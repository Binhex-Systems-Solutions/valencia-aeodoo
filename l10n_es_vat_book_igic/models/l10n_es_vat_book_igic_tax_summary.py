# Copyright 2017 Praxya (http://praxya.com/)
#                Daniel Rodriguez Lijo <drl.9319@gmail.com>
# Copyright 2017 ForgeFlow, S.L. <contact@forgeflow.com>
# Copyright 2019 Tecnativa - Carlos Dauden
# Copyright 2014-2022 Nicolás Ramos (http://binhex.es)
# Copyright 2023 Binhex System Solutions
# License AGPL-3 - See https://www.gnu.org/licenses/agpl-3.0

from odoo import fields, models, _


class L10nEsVatBookIgicIssuedTaxSummary(models.Model):
    _name = "l10n.es.vat.book.igic.tax.summary"
    _description = "Canary VAT book tax summary"
    _inherit = "l10n.es.vat.book.igic.summary"

    _order = "book_type, special_tax_group DESC, tax_id"

    tax_id = fields.Many2one(
        comodel_name="account.tax",
        string=_("Account Tax"),
        required=True,
        ondelete="cascade",
    )
