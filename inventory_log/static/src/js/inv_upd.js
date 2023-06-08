// START odoo module encapsulation
odoo.define('inventory_log.inv_upd', function (require) {
"use strict";

var AbstractAction = require('web.AbstractAction');
var ajax = require('web.ajax');
var core = require('web.core');

var Session = require('web.session');
var _t = core._t;

var QWeb = core.qweb;

var InvUpdate = AbstractAction.extend({
    /* EVENTS */
     events: {
        "click #add": function(e) {
            e.preventDefault();
            if (!Session.inv_orig){
                $(".modal-title").html(_t("Location not set"));
                $(".modal").modal('show')
                return;
            }
            var domain = [['type','=','product']];
            this.do_action('inventory_log.product_kanban_action',{
                    additional_context: {
                        domain: domain,
                        // n_action: "inventory_log.inv_upd",
                    },
                    clear_breadcrumbs: true,
                });
        },
        "click .loc": function(e) {
            e.preventDefault();

            this.do_action('inventory_log.location_kanban_action_duwi',{
                additional_context: {
                    type: "orig",
                    n_action: "inventory_log.inv_upd",
                },
                clear_breadcrumbs: true
            });

        },
        "click .confirm": function(e) {
            var self = this;
            if (Object.keys(Session.lines).length < 1){
                $(".modal-title").html(_t("Number of products must be higher than 0"));
                // $(".modal-body").html(_t("<p>Number of products must be higher than 0.</p>"));
                $(".modal").modal('show')
                return;
            }
            this._rpc({
                model: 'stock.warehouse',
                method: 'create_inventory',
                args: [Session.lines, Session.uid, $('#motive').val()],
            }).then(function(res){
                Session.inv_orig = undefined;
                Session.a_type = undefined;
                Session.lines = {};
                self.do_action('inventory_log.main_screen',{
                        clear_breadcrumbs: true
                    });
                });
        },
        "click .scrap": function(e) {
            var self = this;
            if (Object.keys(Session.lines).length < 1){
                $(".modal-title").html(_t("Number of products must be higher than 0"));
                // $(".modal-body").html(_t("<p>Number of products must be higher than 0.</p>"));
                $(".modal").modal('show')
                return;
            }
            this._rpc({
                model: 'stock.warehouse',
                method: 'create_scrap',
                args: [Session.lines, Session.uid, $('#motive').val()],
            }).then(function(res){
                Session.inv_orig = undefined;
                Session.a_type = undefined;
                Session.lines = {};
                self.do_action('inventory_log.main_screen',{
                        clear_breadcrumbs: true
                    });
                });
        },
        "click .exit": function() {
            // Session.location = false;
            Session.inv_orig = undefined;
            Session.a_type = undefined;

            Session.lines = {};
            this.do_action('inventory_log.main_screen',{
                    clear_breadcrumbs: true
                });
        },
        "click .trash": function(e) {
            var ids = $(e.currentTarget).parent().attr('class').split(/_/);
            Session.lines[ids[1]][ids[2]][ids[3]] && delete Session.lines[ids[1]][ids[2]][ids[3]];
            if (Object.keys(Session.lines[ids[1]]).length == 1){
                $(e.currentTarget).parent().parent().remove();
                delete Session.lines[ids[1]];
            }
            else 
                $(e.currentTarget).parent().remove();
        },
        "change .qty": function(e){
            var ids = $(e.currentTarget).parent().attr('class').split(/_/);
            Session.lines[ids[1]][ids[2]][ids[3]].qty = parseFloat($(e.currentTarget).val());
        },
        "click .selected_lot": function(e) {
            var self = this;
            e.preventDefault();
            var ids = $(e.currentTarget).parent().attr('class').split(/_/);
            Session.update_inv = {
                'location_id':ids[1],
                'product_id':ids[2],
                'lot_id':ids[3]
            }
            var id = $(e.currentTarget).parent().attr('class').split(/_/)[2];
            var m = new Date();
            var domain = false;
            var dateString =
                m.getUTCFullYear() + "-" +
                ("0" + (m.getUTCMonth()+1)).slice(-2) + "-"+
                ("0" + m.getUTCDate()).slice(-2) + " " +
                ("0" + m.getUTCHours()).slice(-2) + ":" +
                ("0" + m.getUTCMinutes()).slice(-2) + ":" +
                ("0" + m.getUTCSeconds()).slice(-2);
            domain = [['product_id','=',parseInt(id)]];
            this.do_action('inventory_log.lot_kanban_action',{
                additional_context: {
                    domain: domain,
                },
            });
        },
    },
    init: function(parent, action) {
        var self = this;
        this._super.apply(this, arguments);
        this.a_type = action.a_type || false;
        if(!Session.a_type){
            Session.a_type = this.a_type;
        }
    },
    start: async function () {
        this._super();
        var self = this;
        if (typeof(Session.inv_orig) == "undefined")
            Session.inv_orig = false;
        if (Session.orig){
            Session.inv_orig = Session.orig;
            Session.orig = undefined;
        }
        if (typeof(Session.lines) == "undefined")
            Session.lines = {};
        if(Session.lines && Session.update_inv) {
            var temp = Session.lines[Session.update_inv.location_id][Session.update_inv.product_id][-1]
            var barcode = false;
            if (!temp){
                temp = Session.lines[Session.update_inv.location_id][Session.update_inv.product_id][0]
                barcode = true;
            }
            delete Session.lines[Session.update_inv.location_id][Session.update_inv.product_id][-1]
            if(barcode){
                delete Session.lines[Session.update_inv.location_id][Session.update_inv.product_id][0]
            }
            temp.lot_id = Session.changed_lot
            Session.lines[Session.update_inv.location_id][Session.update_inv.product_id][Session.changed_lot.id] = temp
            Session.changed_lot = undefined;
            Session.update_inv = undefined;
        }
        core.bus.on('barcode_scanned', this, this._onBarcodeScanned);
        self.$el.html( QWeb.render("InvUpdXML", {location: Session.inv_orig, lines:Session.lines, a_type: Session.a_type}));
    },
    _onBarcodeScanned: function(barcode) {
        var self = this;
        core.bus.off('barcode_scanned', this, this._onBarcodeScanned);

        this._rpc({
            model: 'stock.warehouse',
            method: 'check_barcode_inv',
            args: [barcode,],
        }).then(function(res){
                if (res['l'].length > 0){
                    Session.inv_orig = res['l'][0]
                    self.$el.html( QWeb.render("InvUpdXML", {'location':Session.inv_orig, 'lines':Session.lines,a_type: Session.a_type}));
                }
                else if (res['p'].length > 0){
                    if (!Session.inv_orig){
                        $(".modal-title").html(_t("Location not set"));
                        $(".modal").modal('show')
                    }
                    else{
                        res['p'].forEach(function(p){
                            if (!Session.lines[Session.inv_orig.id])
                                Session.lines[Session.inv_orig.id] = {'name':Session.inv_orig.display_name}
                            if (!Session.lines[Session.inv_orig.id][p.id]){
                                Session.lines[Session.inv_orig.id][p.id] = {}
                                if(res['lot']){
                                    Session.lines[Session.inv_orig.id][p.id][res['lot'].id] = {lot_id:res['lot'] ,name:p.display_name,qty:parseFloat($("#code").html()) || 1};
                                }
                                else{
                                    Session.lines[Session.inv_orig.id][p.id][0] = {lot_id:res['lot'] ,name:p.display_name,qty:parseFloat($("#code").html()) || 1};
                                }
                            }
                               
                            else if(Session.lines[Session.inv_orig.id][p.id] && !Session.lines[Session.inv_orig.id][p.id][res['lot'].id]){
                                Session.lines[Session.inv_orig.id][p.id][res['lot'].id] = {lot_id:res['lot'] ,name:p.display_name,qty:parseFloat($("#code").html()) || 1};
                            }
                        });
                        self.$el.html( QWeb.render("InvUpdXML", {'location':Session.inv_orig, 'lines':Session.lines, a_type: Session.a_type}));
                    }
            }
            else{
                $(".modal-title").html(_t("Barcode not found"));
                $(".modal").modal('show');
                core.bus.on('barcode_scanned', self, self._onBarcodeScanned);
            }
        
        });
    }, 
});

core.action_registry.add('inv_upd', InvUpdate);

return InvUpdate;

});