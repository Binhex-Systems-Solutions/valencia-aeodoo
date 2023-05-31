// START odoo module encapsulation
odoo.define('inventory_log.select_barcode', function (require) {
    "use strict";
    
    var AbstractAction = require('web.AbstractAction');
    var ajax = require('web.ajax');
    var core = require('web.core');
    
    var Session = require('web.session');
    var _t = core._t;
    
    var QWeb = core.qweb;
    
    var SelectBarcode = AbstractAction.extend({
        /* EVENTS */
         events: {
            "click .back": function() {
                Session.product_list = {};
                Session.orig = undefined;
                this.do_action('inventory_log.main_screen',{
                        clear_breadcrumbs: true
                    });
            },
            "click .ean_13": function() {
                this.do_action({
                    type: 'ir.actions.client',
                    name: _t('Quick Info'),
                    tag: 'quick_info',
                    target: 'fullscreen',
                    barcode_type: 'gs1'
                }, {clear_breadcrumbs: true}); 
            },
            "click .gs1": function() {
                this.do_action({
                    type: 'ir.actions.client',
                    name: _t('Quick Info'),
                    tag: 'quick_info',
                    target: 'fullscreen',
                    barcode_type: 'gs1'
                }, {clear_breadcrumbs: true}); 
            }
         },
         start: async function () {
            this._super();
            var self = this;
            self.$el.html( QWeb.render("SelectBarcode"));
         },
    });
    core.action_registry.add('select_barcode', SelectBarcode);
    return SelectBarcode;
    
    });