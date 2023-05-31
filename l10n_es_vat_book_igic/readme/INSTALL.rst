Para instalar este modulo necesitas:

* account
* base_vat
* l10n_es (IGIC) o l10n_es_igic
* l10n_es_aeat
* report_xlsx

Se instalan automáticamente si están disponibles en la lista de addons.

Consideraciones adicionales:

* Es importante que en facturas que deban aparecer en los libros registros,
  no sujetos a IGIC, informar el tipo de IGIC 'No Sujeto' en facturas. Para
  evitar que los usuarios olviden informarlo es recomendable instalar el
  módulo 'account_invoice_tax_required', disponible en
  `account_invoice_tax_required <https://github.com/OCA/account-financial-
  tools/tree/14.0>`_.
