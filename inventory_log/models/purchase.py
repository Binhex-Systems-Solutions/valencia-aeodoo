# -*- coding: utf-8 -*-

from odoo import models, fields, api, _
from odoo.tools import groupby
from operator import itemgetter
import logging
_logger = logging.getLogger(__name__)

class Purchase(models.Model):
    _inherit = "purchase.order"

    res_signature = fields.Binary(string=_("Respon Signature"))
    responsable = fields.Many2one("hr.employee", string=_("Responsable"))
