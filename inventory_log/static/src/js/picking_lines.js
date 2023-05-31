// START odoo module encapsulation
odoo.define('inventory_log.picking_lines', function (require) {
    "use strict";
    
    var AbstractAction = require('web.AbstractAction');
    var ajax = require('web.ajax');
    var core = require('web.core');
    
    var Session = require('web.session');
    var _t = core._t;
    
    var QWeb = core.qweb;
    
    var PickingLines = AbstractAction.extend({
        events: {
            "click .picking": function(e){ 
                var picking_id = $(e.currentTarget).attr('id').split(/p_/)[1];
                console.log("picking id ",picking_id)
                Session.picking = {"id": picking_id};
                Session.from_picking_lines = true;

                this.do_action("inventory_log.validate_wh_ops");            
            },
            "click .back_to_date": function(){ 
                Session.selected_pickings = undefined;
                Session.from_picking_lines = undefined;
                this.do_action({
                    type: 'ir.actions.client',
                    name: _t('Date Range'),
                    tag: 'date_range',
                    target: 'fullscreen',
                }, {clear_breadcrumbs: true}); 
            },
            "click #check_all": function(e){ 
                if( $(e.currentTarget).is(":checked")){
                    $(".picking_ch").each(function() {   
                        $(this).prop('checked', true);
                    });
                }
                else{
                    $(".picking_ch").each(function() {   
                        $(this).prop('checked', false);
                    });
                }
                var selected = [];
                $('div#accordion2 input[type=checkbox]').each(function() {
                    if ($(this).is(":checked")) {
                        selected.push(parseInt($(this).attr('id').split(/pid_/)[1]));
                    }
                });
                console.log("Selected ",selected)
                Session.selected_pickings = selected;
            },
            "click .coninue_to_delivery_orders": function(){ 
                console.log(" Session.selected_pickings ", Session.selected_pickings)
                if(!Session.selected_pickings){
                    this.do_action({
                        type: 'ir.actions.client',
                        name: _t('Date Range'),
                        tag: 'date_range',
                        target: 'fullscreen',
                    }, {clear_breadcrumbs: true}); 
                }
                var self = this;
                Session.picking_type = "out";
                var selected = [];
                $('div#accordion2 input[type=checkbox]').each(function() {
                    if ($(this).is(":checked")) {
                        selected.push(parseInt($(this).attr('id').split(/pid_/)[1]));
                    }
                });
                console.log("Selected ",selected)
                Session.selected_pickings = selected;
                Session.picking = undefined
                Session.pickings = selected
                this.do_action({
                    type: 'ir.actions.client',
                    name: _t('Multiple Validate'),
                    tag: 'multiple_validate_wh_ops',
                    target: 'fullscreen',
                }, {clear_breadcrumbs: true}); 
            },
        },
        init: function(parent, action) {
            var self = this;
            this._super.apply(this, arguments);
            this.date = action.date || false;
            this.warehouse = action.warehouse || false;
            this.filter = action.filter || false;
            this.zones = action.zones || false;
        },
        start: async function () {
            var self = this;
            this._super();
            this._rpc({
                model: 'stock.warehouse',
                method: 'get_stock_lines',
                args: [this.warehouse,this.date,this.filter,this.zones],
            }).then(function(result){
                self.pickings = result.grouped_pickings
                console.log('result.grouped_pickings', result.grouped_pickings)
                self.$el.html( QWeb.render("PickingLines", {pickings: result.grouped_pickings, filter: result.filter_name}));
            });
        },
    })
    core.action_registry.add('picking_lines', PickingLines);
    return PickingLines
})