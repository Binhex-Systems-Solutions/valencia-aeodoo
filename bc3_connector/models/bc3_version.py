# -*- coding: utf-8 -*-

from odoo import models, fields, api, tools, _
from iteration_utilities import duplicates
from odoo.exceptions import UserError, ValidationError
import logging
import re
_logger = logging.getLogger(__name__)
import regex
class Bc3Version(models.Model):
    _name = 'bc3.version'
    _description = "BC3 Version"
    _order = 'name'
    name = fields.Char(_("Name"),required=True)
    register_ids = fields.One2many('bc3.version.register', 'version_id', string=_('Registers'))

    @api.constrains('register_ids')
    def _check_registers(self):
        for record in self:
            if record.register_ids:
                register_name = record.register_ids.mapped('name')
                if len(list(duplicates(register_name))) > 0:
                    raise ValidationError(_('Register name should unique'))

class Bc3VersionRegister(models.Model):
    _name = 'bc3.version.register'
    _description = "BC3 Version Register"
    _order = 'name'
    name = fields.Selection(selection=[
        ('v', '~V'),
        ('k', '~K'),
        ('c', '~C'),
        ('d', '~D'),
        ('t', '~T'),
        ('g', '~G'),
        ('f', '~F')],string=_("Name"),required=True)
    description = fields.Text(_("Rule Description"))
    rule_ids = fields.One2many('bc3.version.register.rule', 'register_id', string=_('Rule Lines'))
    version_id = fields.Many2one('bc3.version', string=_("Version"),ondelete='cascade')
    model_id = fields.Many2one('ir.model', _('Model'), required=True, ondelete='cascade',domain="['|','|',('model', '=', 'sale.order'),('model', '=', 'sale.order.line'),('model', '=', 'product.product')]")
    edit_existent = fields.Boolean(_("The register may edit existent records"))

class Bc3VersionRegisterRule(models.Model):
    _name = 'bc3.version.register.rule'
    _description = "BC3 Version Register Rule"
    _order = "sequence"

    sequence = fields.Integer(string=_('Sequence'))
    model_id = fields.Many2one('ir.model',string=_('Model'), ondelete='cascade')
    field_id = fields.Many2one('ir.model.fields',_("Field"),domain="[('model_id', '=', model_id),('ttype','not in',['many2one_reference','reference','serialized','job_serialized','selection'])]",ondelete='cascade')
    register_id = fields.Many2one('bc3.version.register', string=_("Register"),ondelete='cascade')
    is_child = fields.Boolean(_("Child"))
    regular_expression = fields.Char(_("Regular expression"))
    primary_key = fields.Boolean(_("Primary key"))
    field_ids = fields.Many2many('ir.model.fields',string=_("Field"),domain="[('model_id', '=', model_id),('ttype','not in',['many2one_reference','reference','serialized','job_serialized','selection'])]",ondelete='cascade')