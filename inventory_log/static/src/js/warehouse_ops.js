// START odoo module encapsulation
odoo.define('inventory_log.warehouse_ops', function (require) {
"use strict";

var AbstractAction = require('web.AbstractAction');
var ajax = require('web.ajax');
var core = require('web.core');

var Session = require('web.session');
var _t = core._t;

var QWeb = core.qweb;

var WhOps = AbstractAction.extend({
    /* EVENTS */
     events: {
        "click .receipts": function(e) {
            var self = this;
            Session.warehouse = parseInt($(e.currentTarget).attr('id').split('_')[0])
            Session.location_id = parseInt($(e.currentTarget).attr('id').split('_')[1])
            Session.picking_type = "inc"
            this._rpc({
                model: 'stock.warehouse',
                method: 'warehouse_ops_views',
                args: ["inc",,parseInt($(e.currentTarget).attr('id').split('_')[1])],
            }).then(function(action){
                self.do_action(action);
            });
        },
        "click .int_trans": function(e) { 
            var self = this;
            Session.picking_type = "int"
            Session.location_id = parseInt($(e.currentTarget).attr('id').split('_')[1])

            this._rpc({
                model: 'stock.warehouse',
                method: 'warehouse_ops_views',
                args: ["int",,parseInt($(e.currentTarget).attr('id').split('_')[1])],
            }).then(function(action){
                self.do_action(action);
            });
        },
        "click .cod_barr": function(){ 
            this.do_action({
                        type: 'ir.actions.client',
                        name: _t('Cod Barras'),
                        tag: 'cod_barr',
                        target: 'fullscreen',
                    }, {clear_breadcrumbs: true}); 
        },
        "click .deliv_ord": function(e) {
            var self = this;
            Session.location_id = parseInt($(e.currentTarget).attr('id').split('_')[1])

            if(Session.company_settings && Session.company_settings.filters){
                this.do_action({
                    type: 'ir.actions.client',
                    name: _t('Date Range'),
                    tag: 'date_range',
                    target: 'fullscreen',
                    location: parseInt($(e.currentTarget).attr('id').split('_')[1])
                }); 
            }
            else{
                Session.picking_type = "out"
                this._rpc({
                    model: 'stock.warehouse',
                    method: 'warehouse_ops_views',
                    args: ["out",,parseInt($(e.currentTarget).attr('id').split('_')[1])],
                }).then(function(action){
                    self.do_action(action);
                });                
            }

        },
        "click .back": function() {
            Session.picking_type = undefined
            this.do_action('inventory_log.main_screen',{
                    clear_breadcrumbs: true
                });
        },
    },

    start: async function () {
            this._super();
            var self = this;
            $('body').removeClass('modal-open');
            $('.modal-backdrop').remove();
            if(this.next_show){
                switch(this.next_show) {
                    case 'out':{
                        this._rpc({
                            model: 'stock.warehouse',
                            method: 'warehouse_ops_views',
                            args: ["out",Session.date,Session.location_id],
                        }).then(function(action){
                            self.next_show = undefined;
                            self.do_action(action);
                        });
                        break;
                    }
                    case 'int':
                        this._rpc({
                            model: 'stock.warehouse',
                            method: 'warehouse_ops_views',
                            args: ["int",,Session.location_id],
                        }).then(function(action){
                            self.next_show = undefined;
                            self.do_action(action);
                        });
                        break;                   
                    case 'inc':
                        this._rpc({
                            model: 'stock.warehouse',
                            method: 'warehouse_ops_views',
                            args: ["inc",,Session.location_id],
                        }).then(function(action){
                            self.next_show = undefined;
                            self.do_action(action);
                        });
                        break;
                } 
            }
            setTimeout(function(){ 
                self._rpc({
                    model: 'stock.warehouse',
                    method: 'warehouse_ops_count',
                    args: [],
                }).then(function(count){
                    console.log("COUUNY ",count);
                    Session.company_settings = count['company']
                    self.$el.html( QWeb.render("WhOpsXML", {count: count}));
                });
            }, 1000);

        
    },
    init: function(parent, action) {
        var self = this;
        this._super.apply(this, arguments);
        this.next_show = action.next_show || false;
    },
});

core.action_registry.add('wh_ops', WhOps);

return WhOps;

});