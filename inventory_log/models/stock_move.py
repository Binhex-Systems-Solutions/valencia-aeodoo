# -*- coding: utf-8 -*-

from odoo import models, fields, api, _
from odoo.tools import groupby
from operator import itemgetter
from datetime import datetime
import logging
_logger = logging.getLogger(__name__)

class StockMove(models.Model):
    _inherit = 'stock.move'

    picking_partner_id = fields.Many2one('res.partner',related="picking_id.partner_id",string=_("Picking Client"))

    def read_with_lot(self):
        lot_ids = self.env['stock.production.lot'].sudo().search_read([('product_id','=',self.product_id.id)],['name', 'expiration_date'])
        self_dictionary = self.sudo().read()[0]
        self_dictionary['lot_ids'] = lot_ids
        return [self_dictionary]
    
    def create_move(self,qty_done,lot_id,lot_name,p_type):
        if self:
            if lot_id:
                for operation in self.picking_id.move_line_ids_without_package:
                    if operation.lot_id.id == lot_id and operation.product_id.id == self.product_id.id:
                        operation.qty_done = operation.qty_done+qty_done
                        return True
                    elif not operation.lot_id and p_type == 'incoming' and operation.product_id.id == self.product_id.id:
                        operation.qty_done = operation.qty_done+qty_done
                        operation.lot_id = lot_id
                        return True

            stock_move_line = self.env['stock.move.line'].sudo().create({ 
                'picking_id': self.picking_id.id,
                'qty_done': qty_done,
                'location_id': self.location_id.id,
                'date': datetime.now(),
                'location_dest_id': self.location_dest_id.id,
                #'product_uom_qty': self.product_uom_qty,
                'product_uom_id': self.product_id.uom_id.id,
                'product_id': self.product_id.id,
                'lot_id': lot_id
            })
            self.picking_id.sudo().write({
                'move_line_ids_without_package': [(4,stock_move_line.id)]
            })
            self.sudo().write({
                'move_line_ids': [(4,stock_move_line.id)]
            })
            
            return True
        return False
            #move_line_ids_without_package

    @api.model
    def get_sequence(self):
        return self.env['ir.sequence'].next_by_code('stock.lot.serial')

    @api.model
    def create_new_lot(self,move_line_id,name,expiration_date=False):
        line = self.env['stock.move'].browse(int(move_line_id))
        if line:
            lot_id = self.env['stock.production.lot'].sudo().create({
                'product_id':line.product_id.id,
                'name': name,
                'expiration_date':expiration_date,
                'removal_date':expiration_date,
                'use_date':expiration_date,
                'company_id': self.env.company.id
            })
            return lot_id.read(['name','expiration_date'])[0]
        return True

    def change_done_qty(self,qty_done,lot_id=False):
        self.quantity_done = self.quantity_done+qty_done
        self.lot_id = lot_id
        return True

class StockMove(models.Model):
    _inherit = 'stock.move.line'
    main_move_line_id = fields.Integer(default=-1)
    original_qty = fields.Float(default=-1.0)
    validated_on_date = fields.Datetime(string=_("Validated on date"), default=fields.Datetime.now) 
    correct_state_of_product = fields.Boolean(string=_("Correct state"),default=True)
    quality_check = fields.Boolean(string=_("Quality Check"),default=True)
    # If the product is in bad condition, reason_state contains the explanation (broken, rotten, etc)
    reason_state = fields.Text(string=_("Not checked quality")) 
    failed_expiration = fields.Boolean(string=_("Failed expiration"))
    # Date related reason for the failed quality('Not enough life date', 'No life date', etc)
    reason_failed_expiration = fields.Text(string=_("Reason of the failed expiration"))
    overdue_days = fields.Integer(default=0, String=_("Overdue days"))

    @api.depends('lot_id','lot_id.expiration_date')
    def _is_expired(self):
        for record in self:
            if record.lot_id and record.lot_id.expiration_date and not record.lot_id.expiration_date > datetime.now():
                record.expired = True
            else:
                record.expired = False

    expired = fields.Boolean(string=_("Expired"), compute="_is_expired")

    def create(self, vals):
        res = super(StockMove,self).create(vals)
        for result in res:
            result.original_qty = result.product_uom_qty
        return res

    def read_with_lot(self,lot_id=False):
        lot_ids = self.env['stock.production.lot'].with_context(lang=None).sudo().search_read([('product_id','=',self.product_id.id)],['name','expiration_date'])
        self_dictionary = self.with_context(lang=None).sudo().read()[0]
        self_dictionary['lot_ids'] = lot_ids
        if self_dictionary['lot_id']:
            self_dictionary['lot_id'] = self.with_context(lang=None).env['stock.production.lot'].sudo().search_read([('id','=',int(self_dictionary['lot_id'][0]))],['name','expiration_date'])[0]
        if self_dictionary['product_id']:
            self_dictionary['product_id'] = self.with_context(lang=None).env['product.product'].sudo().search_read([('id','=',int(self_dictionary['product_id'][0]))],['name','expiration_time','uom_id'])[0]
            self_dictionary['product_id']['measure_type'] = self.with_context(lang=None).env['uom.uom'].sudo().search([('id', '=', self_dictionary['product_id']['uom_id'][0])]).category_id.name.lower()
        if lot_id:
            self_dictionary['current_lot'] = self.with_context(lang=None).env['stock.production.lot'].sudo().search_read([('id','=',int(lot_id))],['name','expiration_date'])[0]
        self_dictionary['product_tracking'] = self.with_context(lang=None).env['product.product'].sudo().browse(self.product_id.id).tracking
        return [self_dictionary]
    
    def change_done_qty(self,qty_done,lot_id=False):
        self.qty_done = self.qty_done+qty_done
        self.lot_id = lot_id
        return True
    
    def create_move_line(self, qty_done, lot_id, lot_name, p_type, checked_quality, correct_state_of_product, bad_quality_description, 
            product_id, failed_expiration, overdue_days, reason_failed_expiration):
        return_T = False
        lot_original = self.lot_id
        prod = self.env['product.product'].sudo().browse(product_id)
        main_move_line_id = -1
        _logger.info("DEBBUG lot_id "+str(lot_id))
        if self:
            if lot_id and not lot_id == -1 or (lot_id == None and prod.tracking == 'none'):
                for operation in self.picking_id.move_line_ids_without_package:
                    if operation.id == self.id:
                        if not operation.lot_id and prod.tracking == 'none':
                            # Si no hay lote
                            operation.qty_done = operation.qty_done + qty_done
                            return True
                        elif operation.lot_id.id == lot_id and prod.tracking != 'none':
                            # Si el lote es el mismo
                            operation.qty_done = operation.qty_done + qty_done
                            if prod.tracking != 'serial':
                                operation.quality_check = checked_quality
                                operation.validated_on_date = fields.Datetime.now()
                                operation.overdue_days = overdue_days
                                operation.failed_expiration = failed_expiration
                                operation.reason_failed_expiration = reason_failed_expiration
                                operation.correct_state_of_product = correct_state_of_product
                                operation.reason_state = bad_quality_description
                            return True
                        elif not operation.lot_id and p_type == 'incoming' and prod.tracking != 'none':
                            # Si no hay lote y es entrada
                            operation.qty_done = operation.qty_done + qty_done
                            operation.lot_id = lot_id
                            if prod.tracking != 'serial':
                                operation.quality_check = checked_quality
                                operation.validated_on_date = fields.Datetime.now()
                                operation.overdue_days = overdue_days
                                operation.failed_expiration = failed_expiration
                                operation.reason_failed_expiration = reason_failed_expiration
                                operation.correct_state_of_product = correct_state_of_product
                                operation.reason_state = bad_quality_description
                            return True
                        elif operation.qty_done == 0 and p_type == 'outgoing' and prod.tracking != 'none':
                            # qty_done = 0 y es de tipo salida (con mismo o diferente lote)
                            if operation.product_uom_qty <= qty_done: 
                                operation.product_uom_qty = 0
                                main_move_line_id = operation.id # modificacion
                            else:
                                if (operation.product_uom_qty - qty_done) < 0:
                                    operation.product_uom_qty = 0
                                else:
                                    operation.product_uom_qty = operation.product_uom_qty - qty_done
                                    main_move_line_id = operation.id
                        elif lot_original and operation.lot_id.id == lot_original.id:
                            # Cambia lote a la linea
                            main_move_line_id = operation.id
                            if (operation.product_uom_qty - qty_done) < 0:
                                operation.product_uom_qty = 0
                            else:
                                operation.product_uom_qty = operation.product_uom_qty - qty_done
                            if operation.product_uom_qty < operation.qty_done:
                                operation.product_uom_qty = operation.qty_done
            elif not lot_id and not prod.tracking == 'none' or lot_id == -1:
                return False
            _logger.info("DEBBUG lot id "+str(lot_id))
            stock_move_line = self.env['stock.move.line'].sudo().create({ 
                'picking_id': self.picking_id.id,
                'qty_done': qty_done,
                'location_id': self.location_id.id,
                'date': datetime.now(),
                'location_dest_id': self.location_dest_id.id,
                #'product_uom_qty': self.product_uom_qty,
                'product_uom_id': self.product_id.uom_id.id,
                'product_id': self.product_id.id,
                'lot_id': lot_id,
                'quality_check': checked_quality,
                'validated_on_date': fields.Datetime.now(),
                'overdue_days': overdue_days,
                'failed_expiration': failed_expiration,
                'reason_failed_expiration': reason_failed_expiration,
                'correct_state_of_product': correct_state_of_product,
                'reason_state': bad_quality_description,
                'main_move_line_id': main_move_line_id,
            })
            self.picking_id.sudo().write({
                'move_line_ids_without_package': [(4,stock_move_line.id)]
            })
            self.picking_id.sudo().write({
                'move_line_ids': [(4,stock_move_line.id)]
            })
            for operation in self.picking_id.move_ids_without_package:
                if operation.product_id.id == self.product_id.id:
                    operation.sudo().write({
                        'move_line_ids': [(4,stock_move_line.id)]
                    }) 
            return True
        return False

    def erase_done(self):
        if self:
            picking_id = self.picking_id.id
            if self.main_move_line_id != -1: # sublinea de otro lote original
                line = self.env['stock.move.line'].sudo().browse(self.main_move_line_id)
                if line.original_qty > (line.product_uom_qty + self.qty_done):
                    line.product_uom_qty = line.product_uom_qty + self.qty_done
                else:
                    line.product_uom_qty = line.original_qty
                self.picking_id = False
                self.unlink()
            else: # linea original
                self.qty_done = 0

            picking = self.env['stock.picking'].sudo().browse(picking_id)
            lines_done = self.env['stock.move.line'].sudo().search([('picking_id', '=', picking_id), ('qty_done', '>', 0)])
            if len(lines_done) == 0:
                picking.sudo().write({'quality_check': True})
            
            return picking.quality_check

    @api.model
    def create_new_lot(self,move_line_id,name,expiration_date=False):
        line = self.env['stock.move.line'].browse(int(move_line_id))
        if line:
            lot_id = self.env['stock.production.lot'].sudo().create({
                'product_id':line.product_id.id,
                'name': name,
                'expiration_date':expiration_date,
                'removal_date':expiration_date,
                'use_date':expiration_date,
                'company_id': self.env.company.id
            })
            return lot_id.read(['name','expiration_date'])[0]
        return True