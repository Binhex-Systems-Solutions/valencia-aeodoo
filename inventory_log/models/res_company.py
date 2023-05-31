# -*- coding: utf-8 -*-

from odoo import fields, models, _

from odoo.models import api, Model
from odoo.tools.safe_eval import const_eval
import logging
_logger = logging.getLogger(__name__)

class ResCompany(models.Model):
    _inherit = "res.company"
    quality_responsable_user_id = fields.Many2one('res.users', string=_('Quality Control Responsable'))
    inventory_loss_responsable_user_id = fields.Many2one('res.users', string=_('Inventory Loss Responsable'))