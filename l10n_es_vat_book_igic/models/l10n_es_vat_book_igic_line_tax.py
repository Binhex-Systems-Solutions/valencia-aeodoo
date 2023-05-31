# Copyright 2017 Praxya (http://praxya.com/)
#                Daniel Rodriguez Lijo <drl.9319@gmail.com>
# Copyright 2017 ForgeFlow, S.L. <contact@forgeflow.com>
# Copyright 2019 Tecnativa - Carlos Dauden
# Copyright 2014-2022 Nicolás Ramos (http://binhex.es)
# Copyright 2023 Binhex System Solutions
# License AGPL-3 - See https://www.gnu.org/licenses/agpl-3.0

from odoo import api, fields, models, _


class L10nEsVatBookIgicLineTax(models.Model):
    _name = "l10n.es.vat.book.igic.line.tax"
    _description = "Canary VAT book tax line"

    vat_book_line_id = fields.Many2one(
        comodel_name="l10n.es.vat.book.igic.line",
        required=True,
        ondelete="cascade",
        index=True,
    )
    base_amount = fields.Float(string=_("Base"))

    tax_id = fields.Many2one(comodel_name="account.tax", string=_("Tax"))

    tax_rate = fields.Float(string=_("Tax Rate (%)"), compute="_compute_tax_rate")

    tax_amount = fields.Float(string=_("Tax fee"))

    total_amount = fields.Float(string=_("Total"))

    move_line_ids = fields.Many2many(
        comodel_name="account.move.line", string=_("Move Lines")
    )
    special_tax_group = fields.Selection(
        selection=[("req", "R.Eq."), ("irpf", "IRPF")],
        string=_("Special group"),
        help="Special tax group as R.Eq, IRPF, etc",
    )
    special_tax_id = fields.Many2one(
        comodel_name="account.tax",
        string=_("Special Tax"),
    )
    special_tax_amount = fields.Float(
        string=_("Special Tax fee"),
    )
    total_amount_special_include = fields.Float(
        string=_("Total w/Special"),
    )

    @api.depends("tax_id")
    def _compute_tax_rate(self):
        for rec in self:
            rec.tax_rate = rec.tax_id.amount
