from odoo import models, fields, api, _
import re 
from odoo.tools import groupby
from operator import itemgetter
from odoo.exceptions import UserError
import logging
_logger = logging.getLogger(__name__)

class Stock(models.Model):
    _inherit = 'stock.picking'
    res_signature = fields.Binary(string=_("Respon Signature"))
    responsable = fields.Many2one("hr.employee", string=_("Responsable"))

    @api.depends('move_line_ids_without_package')
    def compute_state_of_the_van(self):
        not_correct = False
        for line in self.move_line_ids_without_package:
            if not line.quality_check and line.qty_done > 0:
                not_correct = True
        if not_correct:
            self.quality_check = False
        else:
            self.quality_check = True
            
    state_of_the_van =  fields.Boolean(string=_('State of the van'))
    correct_temperature =  fields.Boolean(string=_('Correct Temperature'))
    quality_msg = fields.Text(string=_('Not checked quality'))
    quality_check = fields.Boolean(string=_('Quality Check'),default=True,compute='compute_state_of_the_van')
    image_ids = fields.Many2many('ir.attachment', relation='m2m_images', string=_('Images'))
    deliver_temperature = fields.Float()
    
    @api.model
    def action_assign_kanban(self, picking_id):
        """ Check availability of picking moves.
        This has the effect of changing the state and reserve quants on available moves, and may
        also impact the state of the picking as it is computed based on move's states.
        @return: True
        """
        picking = self.env['stock.picking'].search([('id', '=', picking_id)])
        picking.filtered(lambda picking: picking.state == 'draft').action_confirm()
        moves = picking.mapped('move_lines').filtered(lambda move: move.state not in ('draft', 'cancel', 'done'))
        if not moves:
            raise UserError(_('Nothing to check the availability for.'))
        # If a package level is done when confirmed its location can be different than where it will be reserved.
        # So we remove the move lines created when confirmed to set quantity done to the new reserved ones.
        package_level_done = picking.mapped('package_level_ids').filtered(lambda pl: pl.is_done and pl.state == 'confirmed')
        package_level_done.write({'is_done': False})
        moves._action_assign()
        package_level_done.write({'is_done': True})
        return picking.state
    
    def add_image(self, img):
        name = self.name
        num = "1"
        if self.image_ids:
            last_pic_name = self.image_ids[0].name
            x = re.findall("\d+$", last_pic_name.split('.')[0])
            if x[0].isnumeric():
                num = str(int(x[0]) + 1)
            else:
                raise UserError(_('The picture can\'t be added to the picking, please contact with your administrator'))
        attachment = self.env['ir.attachment'].sudo().create({
            'datas': img,
            'name': name + "_pic_" + num + '.jpg',
            })
        self.sudo().write({'image_ids': [(4, attachment.id)]})

    def delete_img(self, name):
        img = self.env['ir.attachment'].search([('name', '=', name)], limit=1)
        self.image_ids = [(2, img.id)]

    def get_images_info(self):
        image_ids = {}
        for img in self.image_ids:
            image_ids[img.name] = img.datas
        return {
            'name': self.name,
            'image_ids': image_ids
            }
