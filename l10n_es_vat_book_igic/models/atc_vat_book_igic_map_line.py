# Copyright 2019 Tecnativa - Carlos Dauden
# Copyright 2014-2022 Nicolás Ramos (http://binhex.es)
# Copyright 2023 Binhex System Solutions
# License AGPL-3.0 or later (https://www.gnu.org/licenses/agpl).

from odoo import fields, models, _


class AtcVatBookIgicMapLines(models.Model):
    _name = "atc.vat.book.igic.map.line"
    _description = "ATC Vat Book Igic Map Line"

    def _selection_special_tax_group(self):
        return self.env["l10n.es.vat.book.igic.line.tax"].fields_get(
            allfields=["special_tax_group"]
        )["special_tax_group"]["selection"]

    name = fields.Char(
        string=_("Name")
    )
    book_type = fields.Selection(
        selection=[("issued", "Issued"), ("received", "Received")],
        string=_("Book type"),
    )
    special_tax_group = fields.Selection(
        selection=_selection_special_tax_group,
        string=_("Special group"),
        help=_("Special tax group as R.Eq, IRPF, etc")
    )
    fee_type_xlsx_column = fields.Char(string=_("Type xlsx column"))
    fee_amount_xlsx_column = fields.Char(string=_("Base xlsx column"))
    tax_tmpl_ids = fields.Many2many(
        comodel_name="account.tax.template",
        string=_("Taxes"),
    )
    tax_account_id = fields.Many2one(
        comodel_name="account.account.template",
        string=_("Tax Account Restriction"),
    )

    def get_taxes(self, report):
        self.ensure_one()
        return report.get_taxes_from_templates(self.tax_tmpl_ids)
