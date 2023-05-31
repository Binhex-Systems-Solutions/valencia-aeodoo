# -*- coding: utf-8 -*-

from odoo import api, fields, models, _

class Product(models.Model):
    _inherit = 'product.template'
    bc3_category_id = fields.Many2one('product.category', _('BC3 Product Category'),required=True, help=_("Select BC3 category for the current product"),domain=lambda self:[('parent_id', '=', self.env.ref('bc3_connector.product_category_bc3').id)])

