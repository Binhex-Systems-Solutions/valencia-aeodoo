# Copyright 2017 Praxya (http://praxya.com/)
#                Daniel Rodriguez Lijo <drl.9319@gmail.com>
# Copyright 2017 ForgeFlow, S.L. <contact@forgeflow.com>
# Copyright 2019 Tecnativa - Carlos Dauden
# Copyright 2014-2022 Nicolás Ramos (http://binhex.es)
# Copyright 2023 Binhex System Solutions
# License AGPL-3 - See https://www.gnu.org/licenses/agpl-3.0

from odoo import api, fields, models, _


class L10nEsVatBookIgicLine(models.Model):
    _name = "l10n.es.vat.book.igic.line"
    _description = "Canary VAT book line"
    _order = "exception_text asc, entry_number asc, invoice_date asc, ref asc"

    def _selection_special_tax_group(self):
        return self.env["l10n.es.vat.book.igic.line.tax"].fields_get(
            allfields=["special_tax_group"]
        )["special_tax_group"]["selection"]

    ref = fields.Char(_("Reference"))
    entry_number = fields.Integer(_("Entry number"))
    external_ref = fields.Char(_("External Reference"))

    line_type = fields.Selection(
        selection=[
            ("issued", _("Issued")),
            ("received", _("Received")),
            ("rectification_issued", _("Rectification Issued")),
            ("rectification_received", _("Rectification Received")),
        ],
        string=_("Line type"),
    )
    invoice_date = fields.Date(string=_("Invoice Date"))

    partner_id = fields.Many2one(comodel_name="res.partner", string=_("Empresa"))
    vat_number = fields.Char(string=_("NIF"))

    vat_book_id = fields.Many2one(comodel_name="l10n.es.vat.book.igic", string=_("Vat Book id"))

    move_id = fields.Many2one(comodel_name="account.move", string=_("Invoice"))

    move_id = fields.Many2one(comodel_name="account.move", string=_("Journal Entry"))
    tax_line_ids = fields.One2many(
        comodel_name="l10n.es.vat.book.igic.line.tax",
        inverse_name="vat_book_line_id",
        string=_("Tax Lines"),
        copy=False,
    )

    exception_text = fields.Char(string=_("Exception text"))

    base_amount = fields.Float(
        string="Base",
    )
    total_amount = fields.Float(
        string="Total",
    )
    special_tax_group = fields.Selection(
        selection=_selection_special_tax_group,
        string=_("Special group"),
        help="Special tax group as R.Eq, IRPF, etc",
    )

    @api.depends("tax_id")
    def _compute_tax_rate(self):
        for rec in self:
            rec.tax_rate = rec.tax_id.amount
