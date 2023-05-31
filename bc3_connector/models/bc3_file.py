# -*- coding: utf-8 -*-

from odoo import models, fields, api, tools, _

class Bc3File(models.Model):
    _name = 'bc3.file'
    _description = "BC3 File"
    _order = 'create_date'
    name = fields.Char(_("Name"))
    version_id = fields.Many2one('bc3.file.version',_("Version"))
    sale_id = fields.Many2one('sale.order',_("Sale Order"))