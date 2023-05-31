# -*- coding: utf-8 -*-

from odoo import fields, models, _

from odoo.models import api, Model
from odoo.tools.safe_eval import const_eval
import logging
_logger = logging.getLogger(__name__)

class ResConfigSettings(models.TransientModel):

    _inherit = 'res.config.settings'
    group_enable_filters = fields.Boolean(string= _('Enable filters'),
        implied_group="inventory_log.group_enable_filters")
    group_enable_date_filters = fields.Boolean(string= _('Enable date filters'),
        implied_group="inventory_log.group_enable_date_filters")
    group_enable_customer_filters = fields.Boolean(string= _('Enable customer filters'),
        implied_group="inventory_log.group_enable_customer_filters")
    group_enable_delivery_zone_filters = fields.Boolean(string= _('Enable delivery zone filters'),
        implied_group="inventory_log.group_enable_delivery_zone_filters")
    group_enable_location_filters = fields.Boolean(string= _('Enable location filters'),
        implied_group="inventory_log.group_enable_location_filters")
    group_enable_signature = fields.Boolean(string= _('Enable signature'),
        implied_group="inventory_log.group_enable_signature")
    group_enable_lot_sequence = fields.Boolean(string= _('Enable lot sequence'),
        implied_group="inventory_log.group_enable_lot_sequence")
    group_enable_manual_gs1 = fields.Boolean(string= _('Enable manual GS1'),
        implied_group="inventory_log.group_enable_manual_gs1")
    group_enable_quality_control = fields.Boolean(string= _('Enable Quality Control'),
        implied_group="inventory_log.group_enable_quality_control")
    quality_responsable_user_id = fields.Many2one(related="company_id.quality_responsable_user_id", readonly=False, string=_('Quality Control Responsable'))
    group_send_quality_mail = fields.Boolean(string= _('Send mail'),
        implied_group="inventory_log.group_send_quality_mail")
    group_enable_inventory_loss = fields.Boolean(string= _('Enable Inventory Loss'),
        implied_group="inventory_log.group_enable_inventory_loss")
    inventory_loss_responsable_user_id = fields.Many2one(related="company_id.inventory_loss_responsable_user_id", readonly=False, string=_('Inventory Loss Responsable'))
    group_send_inventory_loss_mail = fields.Boolean(string= _('Send mail'),
        implied_group="inventory_log.group_send_inventory_loss_mail")
    group_use_locations = fields.Boolean(string=_('Use Locations instead of Warehouses'),
        implied_group="inventory_log.group_use_locations")