# -*- coding: utf-8 -*-

from odoo import models, fields, api, _
from odoo.tools import groupby
from operator import itemgetter
import logging
_logger = logging.getLogger(__name__)

class StockPickingYype(models.Model):
    _inherit = 'stock.picking.type'

    @api.model
    def operation_type_conf(self,location_id,operation_type):
        if operation_type == 'inc':
            return self.env['stock.picking.type'].sudo().search_read([('default_location_dest_id','=',location_id),('code','=','incoming')],['use_create_lots','use_existing_lots'])[0]
        elif operation_type == 'out':
            return self.env['stock.picking.type'].sudo().search_read([('default_location_src_id','=',location_id),('code','=','outgoing')],['use_create_lots','use_existing_lots'])[0]
        return False

