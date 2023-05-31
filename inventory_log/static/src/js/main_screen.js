// START odoo module encapsulation
odoo.define('inventory_log.main_screen', function (require) {
"use strict";

var AbstractAction = require('web.AbstractAction');
var ajax = require('web.ajax');
var core = require('web.core');

var Session = require('web.session');
var _t = core._t;

var QWeb = core.qweb;

var MainScreen = AbstractAction.extend({
    /* EVENTS */
     events: {
        "click .wh_op": function(){ 
            this.do_action({
                        type: 'ir.actions.client',
                        name: _t('Warehouse Operations'),
                        tag: 'wh_ops',
                        target: 'fullscreen',
                    }, {clear_breadcrumbs: true}); 
        },
        "click .int_trans": function(){
            // this.do_action("inventory_log.op_type_select",{
            //         additional_context: {
            //             next_action: 'inventory_log.main_screen',
            //         },
            //     });
            Session.next_action = 'inventory_log.main_screen';
            this.do_action({
                        type: 'ir.actions.client',
                        name: _t('Internal Transfer'),
                        tag: 'type_selection',
                        target: 'fullscreen',
                    }, {clear_breadcrumbs: true}); 
        },
        "click .pur_ord": function(){ 
            this.do_action({
                        type: 'ir.actions.client',
                        name: _t('Purchases'),
                        tag: 'purchases',
                        target: 'fullscreen',
                    }, {clear_breadcrumbs: true}); 
        },
        "click .inv_upd": function(){ 
            this.do_action({
                        type: 'ir.actions.client',
                        name: _t('Inventory'),
                        tag: 'inv_upd',
                        target: 'fullscreen',
                        a_type: 'inv',
                    }, {clear_breadcrumbs: true}); 
        },
        "click .scrap": function(){ 
            this.do_action({
                        type: 'ir.actions.client',
                        name: _t('Scrap'),
                        tag: 'inv_upd',
                        target: 'fullscreen',
                        a_type: 'scrap',
                    }, {clear_breadcrumbs: true}); 
        },
        "click .quick_info": function(){ 
            this.do_action({
                        type: 'ir.actions.client',
                        name: _t('Select Barcode'),
                        tag: 'select_barcode',
                        target: 'fullscreen',
                    }, {clear_breadcrumbs: true}); 
        },
    },

    start: async function () {
        this._super();
        this.$el.html( await QWeb.render("MainScreenXML", {widget: this}));
    },
});

core.action_registry.add('main_screen', MainScreen);

return MainScreen;

});