# Copyright 2014-2022 Nicolás Ramos (http://binhex.es)
# Copyright 2023 Binhex System Solutions

{
    "name": "ATC Modelo 420",
    "version": "15.0.1.0.0",
    "author": "Binhex System Solutions",
    "maintainer": "Binhex System Solutions",
    "category": "Localisation/Account Charts",
    "website": "http://binhex.es",
    "license": "AGPL-3",
    "depends": ["l10n_es", "l10n_es_aeat", "l10n_es_igic", "l10n_es_atc"],
    "data": [
        "data/tax_code_map_mod420_data.xml",
        "views/mod420_view.xml",
        "security/ir.model.access.csv",
        "reports/mod420_report.xml",
    ],
    "maintainers": ["nicolasramos"],
    "installable": True,
    "auto_install": False,
}
