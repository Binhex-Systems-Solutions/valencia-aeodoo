# -*- coding: utf-8 -*-
{
    'name': "Inventory Log",

    'summary': """
        Short (1 phrase/line) summary of the module's purpose, used as
        subtitle on modules listing or apps.openerp.com""",

    'description': """
        Long description of module's purpose
    """,

    'author': "Binhex Systems Solutions",
    'website': "https://binhex.es/",

    # Categories can be used to filter modules in modules listing
    # Check https://github.com/odoo/odoo/blob/12.0/odoo/addons/base/data/ir_module_category_data.xml
    # for the full list
    'category': 'Inventory',
    'version': '0.1',

    # any module necessary for this one to work correctly
    'depends': ['base','purchase','sale_stock','product_expiry','hr','stock'],

    # always loaded
    'data': [
        'security/ir.model.access.csv',
        'views/web_asset_backend_template.xml',
        'views/views.xml',
        'views/stock_warehouse.xml',
        'security/res_config_groups.xml',
        'views/res_config_settings.xml',
        'views/stock_picking.xml',
        'views/quality_check.xml',
        'views/quality_check_line.xml',
        'data/mail.xml',
    ],
    'qweb': [
        "static/src/xml/templates.xml",
        "static/src/xml/gs1_templates.xml",
        "static/src/xml/templates2.xml",
    ],
    # only loaded in demonstration mode
    'demo': [
        'demo/demo.xml',
    ],
}