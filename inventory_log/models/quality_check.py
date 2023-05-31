# -*- coding: utf-8 -*-

from odoo import models, fields, api, _
from odoo.tools import groupby
from odoo.addons import decimal_precision as dp
from operator import itemgetter
import logging
import pytz
from datetime import datetime
_logger = logging.getLogger(__name__)


class QualityLine(models.Model):
    _name = "quality.check.line"
    name = fields.Char(_("Name"))
    product_id = fields.Many2one('product.product', 'Product', ondelete="cascade")
    lot_id = fields.Many2one('stock.production.lot', 'Lot/Serial Number')
    qty_done = fields.Float('Done', default=0.0, digits=dp.get_precision('Product Unit of Measure'), copy=False)
    quality_check = fields.Boolean(string=_("Quality Check"),default=True)
    overdue_days = fields.Integer(default=0, String=_("Overdue days"))
    failed_expiration = fields.Boolean(string=_("Failed expiration"),default=False)
    # Date related reason for the failed quality('Not enough life date', 'No life date', etc)
    reason_failed_expiration = fields.Text(string=_("Reason of the failed expiration"))
    correct_state_of_product = fields.Boolean(string=_("Correct state"),default=True)
    # If the product is in bad condition, reason_state contains the explanation (broken, rotten, etc)
    reason_state = fields.Text(string=_("Reason"))
    validated_on_date = fields.Datetime(string=_("Validated on date")) 

class QualityCheck(models.Model):
    _name = "quality.check"
    _inherit = ['mail.thread']
    name = fields.Char(_("Name"))
    picking_id = fields.Many2one('stock.picking', string=_('Picking'))
    quality_line_ids = fields.Many2many('quality.check.line', string=_('Quality lines')) 
    sent_mail = fields.Boolean(_("Email sent"))
    message = fields.Text(_("Quality Control Message"))
    temperature = fields.Boolean(_("Temperature"))
    deliver_temperature = fields.Float(default=0.0, string=_("Temperature at deliver"))
    state_of_the_van =  fields.Boolean(string=_('State of the van'))
    reviewed = fields.Boolean(string=_('Reviewed'))
    review_note = fields.Text(_("Review Note"))
    scheduled_date = fields.Datetime(related='picking_id.scheduled_date', string=_('Picking scheduled date'))
    date_done = fields.Datetime(related='picking_id.date_done',  string=_('Picking date of Transfer'))

    '''
    Zonas horarias de pytz desactualizadas
    '''
    one_hour_less_tz = ['Africa/Juba', 'America/Campo_Grande', 'America/Cuiaba', 'Pacific/Fiji', 'America/Sao_Paulo', 'Brazil/East', 'Europe/Volgograd']
    one_hour_more_tz = ['America/Dawson', 'America/Whitehorse', 'Canada/Yukon', 'Pacific/Norfolk']
    three_hours_more_tz = ['Antarctica/Casey']

    def send_mail_template_quality(self, logged_user_id):
        logged_user = self.env['res.users'].browse(logged_user_id)
        user = self.env.user.company_id.quality_responsable_user_id
        if user.notification_type == 'inbox':
            self.inbox_message(user, logged_user)
        else:
            datetime_now = self.get_datetime_of_user_tz(user)
            email_to = self.env.user.company_id.quality_responsable_user_id.email_formatted
            try:
                template_id = self.env['ir.model.data'].get_object_reference('inventory_log', 'quality_not_checked_email_template_v1_2')[1]
                email_values = {'reason': self.message, 'email_to': email_to, 'user': logged_user.name, 'datetime': datetime_now}
            except ValueError:
                return
            self.sent_mail = True
            self.env['mail.template'].browse(template_id).with_context(email_values).send_mail(self.id, force_send=True,email_values={'email_to': email_to})

    def get_datetime_of_user_tz(self, user):
        tz = pytz.timezone(user.tz)
        date_now = datetime.now(tz)

        fix = 0
        if tz in self.one_hour_less_tz:
            fix = -1
        elif tz in self.one_hour_more_tz:
            fix = 1
        elif tz in self.three_hours_more_tz:
            fix = 3

        hour_diff = int(date_now.strftime('%H')) + fix
        
        if hour_diff >= 0 and hour_diff <= 9:
            hour_diff = '+0' + str(hour_diff)
        elif hour_diff <= 0 and hour_diff >= -9:
            hour_diff = '-0' + str(hour_diff)[1]
        elif hour_diff >= 10:
            hour_diff = '+' + str(hour_diff)

        date = date_now.strftime('%Y:%m:%d')
        year = date[0:4]
        month = date[5:7]
        day = date[8:10]

        time = date_now.strftime('%H:%M')
        hour = time[0:2]
        minute = time[3:5]

        return str(hour + ':' + minute + ' ' + day + '/' + month + '/' + year)

    '''
    def action_send_notification(self):
        self.env['mail.message'].create({'message_type':"notification",
            "subtype": self.env.ref("mail.mt_comment").id, # subject type
            'body': "Message body",
            'subject': "Message subject",
            'needaction_partner_ids': [(4, user.partner_id.id)],   # partner to whom you send notification
            'model': self._name,
            'res_id': self.id,
        })
    '''

    def inbox_message(self, user, logged_user):
        """
        Send user chat notification on picking validation.
        """
        

        message_text = '<div style="line-height: 1.6;">'
        message_text += '<span>It has been detected that the following picking validated by '
        message_text += str(logged_user.name)
        message_text += ' does not pass the quality control at '
        message_text += self.get_datetime_of_user_tz(user)
        message_text += '.</span>'
        message_text += '<li><span style="font-weight: bolder;">' + _('Picking: ') + '</span>'
        message_text += self.picking_id.name
        message_text += '</li>'
        message_text += '<li><span style="font-weight: bolder;">' + _('Affected move lines:') + '</span>'
        message_text += '<ul>'
        for line in self.quality_line_ids:
            message_text += '<li>'
            message_text += '<span>' + str(line.product_id.name) + '</span>'
            message_text += '</li>'
            message_text += '<ul>'
            if line.product_id.tracking != 'none':
                message_text += '<li><span style="font-weight: bolder;">' + _('Lot: ') + '</span>' + str(line.lot_id.name) + '</li>'
            message_text += '<li><span style="font-weight: bolder;">' + _('Qty: ') + '</span>' + str(line.qty_done) + '</li>'
            if line.failed_expiration:
                message_text += '<li><span style="font-weight: bolder;">' + _('Wrong expiration') + '</span></li>'
            if not line.correct_state_of_product:
                message_text += '<li><span style="font-weight: bolder;">' + _('Reason: ') + '</span>'
                message_text += str(line.reason_state) + '</li>'
            message_text += '</ul>'
        message_text += '</ul>'
        message_text += '</li>'
        message_text += '<li><span style="font-weight: bolder;">' + ('Temperature: ') + '</span>'
        if self.temperature:
            message_text += 'Correct'
        else:
            message_text += 'Not correct'
        message_text += '</li>'
        message_text += '<li><span style="font-weight: bolder;">' + _('State of the van: ') + '</span>'
        if self.state_of_the_van:
            message_text += 'Correct'
        else:
            message_text += 'Not correct'
        message_text += '</li>'
        message_text += '<li><span style="font-weight: bolder;">' + _('Message: ') + '</span>' + str(self.message) + '</li>'
        message_text += '</div>'
       
        # odoo runbot
        odoobot_id = self.env['ir.model.data'].sudo().xmlid_to_res_id("base.partner_root")

        # find if a channel was opened for this user before
        channel = self.env['mail.channel'].sudo().search([
            ('name', '=', 'Picking Validated'),
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
                'name': 'Picking Validated',
                'display_name': 'Picking Validated',
            })

        # send a message to the related user
        channel.sudo().message_post(
            body=message_text,
            author_id=odoobot_id,
            message_type="comment",
            subtype="mail.mt_comment",
        )

