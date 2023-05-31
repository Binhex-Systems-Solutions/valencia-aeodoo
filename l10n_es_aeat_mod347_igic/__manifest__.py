##############################################################################
#
# Copyright (c) 2023 Binhex System Solutions
# Copyright (c) 2023 Nicolás Ramos (http://binhex.es)
#
# The licence is in the file __manifest__.py
##############################################################################

{
    "name": "AEAT modelo 347 IGIC",
    "version": "14.0.1.0.0",
    "author": "Binhex System Solutions",
    "website": "https://github.com/OCA/l10n-spain",
    "category": "Accounting",
    "license": "AGPL-3",
    "depends": [
        "l10n_es_igic",
        "l10n_es_aeat_mod347",
    ],
    "data": [
        "data/tax_code_map_mod347_igic_data.xml",
    ],
    "installable": True,
}
