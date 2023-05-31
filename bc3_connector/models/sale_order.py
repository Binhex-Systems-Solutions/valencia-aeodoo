# -*- coding: utf-8 -*-

from datetime import datetime, timedelta
from odoo import api, fields, models, SUPERUSER_ID, _
from odoo.exceptions import AccessError, UserError, ValidationError

class SaleOrder(models.Model):
    _inherit = "sale.order"
    bc3 = fields.Boolean(_("BC3 sale order"))
    bc3_file_property = fields.Char(_("File property"))
    bc3_version_format = fields.Char(_("Version / Format"))
    bc3_version_date = fields.Date(_("Version date"))
    bc3_program = fields.Char(_("Program"))
    bc3_header = fields.Char(_("Header"))
    bc3_identifying_label = fields.Char(_("Identifying label"))
    bc3_character_set = fields.Char(_("Character set"))
    bc3_comment = fields.Text(_("Comment"))
    bc3_information_type = fields.Char(_("Information Type"))
    bc3_certification_number = fields.Char(_("Certification number"))
    bc3_certification_date = fields.Date(_("Certification date"))
    bc3_base_url = fields.Char(_("Base url"))


class SaleOrderLine(models.Model):
    _inherit = "sale.order.line"
    code = fields.Char(_("Code"))
    date = fields.Date(_("Date"))
