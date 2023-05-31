# -*- coding: utf-8 -*-
{
    'name': "BC3 Connector",

    'summary': """
        BC3 Connector.""",

    'description': """
        Addon that allows the import of quoutations in FIEBDC-3 format
    """,

    'author': "Binhex Systems Solutions",
    'website': "https://binhex.es/",

    # Categories can be used to filter modules in modules listing
    # Check https://github.com/odoo/odoo/blob/14.0/odoo/addons/base/data/ir_module_category_data.xml
    # for the full list
    'category': 'Sales/Sales',
    'version': '0.1',

    # any module necessary for this one to work correctly
    'depends': ['base','sale','project','uom','sale_management'],

    # always loaded
    'data': [
        'security/bc3_file_security.xml',
        'security/ir.model.access.csv',
        'wizard/bc3_import_wizard_views.xml',
        #'views/bc3_file_views.xml',
        'views/bc3_version_views.xml',
        'data/bc3_version_data.xml',
        'views/sale_order_views.xml',
        'data/uom_data.xml',
        'data/product_data.xml',
        #'views/product_product_views.xml',
    ],
    'external_dependencies': {
        'python': ['iteration_utilities','regex','codecs','chardet'],
    }
}
