# -*- coding: utf-8 -*-

from odoo import models, fields, api, _
from odoo.tools import groupby
from operator import itemgetter
import pytz
from datetime import datetime
import logging
_logger = logging.getLogger(__name__)

class Inventory(models.Model):
    _inherit = 'stock.inventory'

    def get_tracking(self, product_id):
        prod = self.env['product.product'].sudo().browse(product_id)
        return prod.tracking

    def send_mail_template_inventory(self, logged_user_id, inv_upd_motive):
        logged_user = self.env['res.users'].browse(logged_user_id)
        user = self.env.user.company_id.inventory_loss_responsable_user_id
        if user.notification_type == 'inbox':
            self.inbox_message(user, logged_user, inv_upd_motive)
        else:
            datetime_now = datetime.now()
            email_to = self.env.user.company_id.inventory_loss_responsable_user_id.email_formatted
            try:
                template_id = self.env['ir.model.data'].get_object_reference('inventory_log', 'inventory_created_email_template_v1_3')[1]
                email_values = {'email_to': email_to, 'user': logged_user.name, 'datetime': datetime_now, 'inv_upd_motive': inv_upd_motive}
            except ValueError:
                return
            self.env['mail.template'].browse(template_id).with_context(email_values).sudo().send_mail(self.id, force_send=True)



    def inbox_message(self, user, logged_user, inv_upd_motive):
        """
        Send user chat notification on picking validation.
        """
        
        # construct the message that is to be sent to the user
        
        message_text = '<div style="line-height: 1.6;">'
        message_text += '<span>'
        message_text += _('A new inventory adjustement was made by ')
        message_text += str(logged_user.name)
        message_text += _(' at ')
        message_text += datetime.now()
        message_text += ' :</span>'
        message_text += '<ul>'
        for line in self.line_ids:
            message_text += '<li><span style="font-weight: bolder;">' + _('Product: ') + '</span>' + str(line.product_id.name) + '</li>'
            message_text += '<ul>'
            if line.product_id.tracking != 'none':
                message_text += '<li><span style="font-weight: bolder;">' + _('Lot: ') + '</span>' + str(line.prod_lot_id.name) + '</li>'
            message_text += '<li><span style="font-weight: bolder;">' + _('Qty: ') + '</span>' + str(line.product_qty) + '</li>'
            message_text += '</ul>'
        message_text += '<li>' + _('Motive: ') + inv_upd_motive + '</li>'
        message_text += '</ul>'
        message_text += '</div>'

        # odoo runbot
        odoobot_id = self.env['ir.model.data'].sudo().xmlid_to_res_id("base.partner_root")

        # find if a channel was opened for this user before
        channel = self.env['mail.channel'].sudo().search([
            ('name', '=', 'Inventory Adjustment'),
            ('channel_partner_ids', 'in', [user.partner_id.id])
        ],
            limit=1,
        )

        if not channel:
            # create a new channel
            channel = self.env['mail.channel'].with_context(mail_create_nosubscribe=True).sudo().create({
                'channel_partner_ids': [(4, user.partner_id.id), (4, odoobot_id)],
                'public': 'private',
                'channel_type': 'chat',
                'email_send': False,
                'name': 'Inventory Adjustment',
                'display_name': 'Inventory Adjustment',
            })

        # send a message to the related user
        channel.sudo().message_post(
            body=message_text,
            author_id=odoobot_id,
            message_type="comment",
            subtype="mail.mt_comment",
        )
    