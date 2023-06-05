# Copyright (C) 2016-2018 Rodrigo Colombo Vlaeminch (http://sdatos.com).
# Copyright 2014-2022 Nicolás Ramos (http://binhex.es)
# Copyright 2023 Binhex System Solutions

{
    "name": "IGIC Canary Islands",
    "version": "15.0.3.0.0",
    "author": "Spanish Localization Team",
    "category": "Accounting/Localizations/Account Charts",
    "website": "https://github.com/OCA/l10n-spain",
    "depends": [
        "l10n_es",
    ],
    "data": [
        "data/account_chart_template_data.xml",
        "data/account.account.template-common-canary.csv",
        "data/account.account.template-pymes-canary.csv",
        "data/account.account.template-assoc-canary.csv",
        "data/account.account.template-full-canary.csv",
        "data/account_data.xml",
        "data/account_tax_data.xml",
        "data/account_fiscal_position_template_canary_data.xml",
    ],
    "demo": [
        "demo/demo_company.xml",
    ],
    "installable": True,
}
