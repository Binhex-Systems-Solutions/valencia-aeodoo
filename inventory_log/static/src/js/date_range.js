// START odoo module encapsulation
odoo.define('inventory_log.date_range', function (require) {
    "use strict";
    
    var AbstractAction = require('web.AbstractAction');
    var ajax = require('web.ajax');
    var core = require('web.core');
    
    var Session = require('web.session');
    var _t = core._t;
    
    var QWeb = core.qweb;
    
    var DateRange = AbstractAction.extend({
        events: {
            "change .zone_select": function(e) {
                var added = false;
                var selected = $(e.currentTarget).find(":selected");
                Session.selected_badges.forEach(element => {
                    if(element.id == selected.val()){
                        added = true;
                    }
                });
                if(!added){
                    Session.selected_badges.push({
                        'id': selected.val(),
                        'display_name': selected.text()
                    })
                    $(".zones_selected").append('<span style="border-radius: 25px;font-size: 100%" id="'+selected.val()+'" class="badge badge-success">'+ selected.text()+'<button style="margin-left: 2%;" class="erase_badge"><strong>x</strong></button></span>');
                }
            },
            "click .filter_button": function(e) {
                Session.filter = $(e.currentTarget).attr('id');
                $(e.currentTarget).toggleClass('red_button');
                if($(e.currentTarget).attr('id') === 'filter_zone'){
                    $(".zone_selector").each(function() {   
                        $(this).toggleClass('no_display');
                    });
                }
                else if($(e.currentTarget).attr('id') === 'filter_loc'){
                    $(".zone_selector").each(function() {   
                        if(!$(this).hasClass('no_display')){
                            $(this).addClass('no_display')
                        }
                    });
                }
                else{
                    $(".zone_selector").each(function() {   
                        if(!$(this).hasClass('no_display')){
                            $(this).addClass('no_display')
                        }
                    });
                }
                $(".filter_button").each(function() {   
                    if($(this).attr('id') != $(e.currentTarget).attr('id')){
                        $(this).removeClass('red_button');
                    }
                });
            },
            "click .erase_badge": function(e){
                Session.selected_badges.forEach(function (element, i) {

                    if(element.id == $(e.currentTarget).parent().attr('id')){
                        Session.selected_badges.splice(i, 1);
                        $("#"+element.id).remove();
                    }
                });
            },
            "click .back": function(){ 
                Session.warehouse = undefined;
                Session.date = undefined;
                Session.filter = undefined;
                Session.selected_badges = undefined;
                this.do_action({
                            type: 'ir.actions.client',
                            name: _t('Warehouse Operations'),
                            tag: 'wh_ops',
                            target: 'fullscreen',
                        }, {clear_breadcrumbs: true}); 
            },
            "click .coninue_to_delivery_orders": function(){ 
                var self = this;
                var date = false;
                var filter = false;
                var delivery_zones = []
                if($("#date_delivery_orders").val()){
                    date = $("#date_delivery_orders").val()
                }
                Session.date = date;

                if($('.red_button').length){
                    Session.filter = $('.red_button').attr('id');
                    filter = Session.filter;
                    this.do_action({
                        type: 'ir.actions.client',
                        name: _t('Picking Lines'),
                        tag: 'picking_lines',
                        target: 'fullscreen',
                        date: Session.date,
                        filter: filter,
                        warehouse: Session.warehouse,
                        zones: Session.selected_badges,
                    }, {clear_breadcrumbs: true}); 
                }
                Session.picking_type = "out"
                this._rpc({
                    model: 'stock.warehouse',
                    method: 'warehouse_ops_views',
                    args: ["out",date,Session.location_id],
                    }).then(function(action){
                        self.do_action(action);
                });
            },
        },
        start: async function () {
            var self = this;
            var warehouse_id = false;
            var date = ""
            var filter = false;
            var selected = [];
            self.zones = []
            if( Session.selected_badges && Session.selected_badges.length>0){
                selected = Session.selected_badges;
            }
            else{
                Session.selected_badges = []
            }
            this._super();
            if(Session.warehouse){
                warehouse_id = Session.warehouse; 
            }
            if(Session.date){
                $('#date_delivery_orders').val(Session.date);
                date = Session.date
            }
            if(Session.filter){filter = Session.filter;
            }
            this._rpc({
                model: 'stock.warehouse',
                method: 'get_warehouse',
                args: [warehouse_id],
            }).then(function(warehouse){
                self.warehouse = warehouse[0][0];
                self.zones = warehouse[1];
                Session.warehouse = warehouse[0][0].id;
                self.company = warehouse[2];
                self.$el.html( QWeb.render("DateRange", {warehouse: self.warehouse, date: date,zones: self.zones, filter: filter,selected:selected, company:self.company,  options: Session.company_settings}));

            });
        },
    })
    core.action_registry.add('date_range', DateRange);
    return DateRange
})