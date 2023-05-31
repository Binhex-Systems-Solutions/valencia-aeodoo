// START odoo module encapsulation
odoo.define('inventory_log.quick_info', function (require) {
"use strict";

var AbstractAction = require('web.AbstractAction');
var ajax = require('web.ajax');
var core = require('web.core');

var Session = require('web.session');
var _t = core._t;

var QWeb = core.qweb;

var QuickInfo = AbstractAction.extend({
    /* EVENTS */
     events: {
        "click .1": function(){ $("#code").html($("#code").html() + "1");},
        "click .2": function(){ $("#code").html($("#code").html() + "2");},
        "click .3": function(){ $("#code").html($("#code").html() + "3");},
        "click .4": function(){ $("#code").html($("#code").html() + "4");},
        "click .5": function(){ $("#code").html($("#code").html() + "5");},
        "click .6": function(){ $("#code").html($("#code").html() + "6");},
        "click .7": function(){ $("#code").html($("#code").html() + "7");},
        "click .8": function(){ $("#code").html($("#code").html() + "8");},
        "click .9": function(){ $("#code").html($("#code").html() + "9");},
        "click .0": function(){ $("#code").html($("#code").html() + "0");},
        "click .dot": function(){ $("#code").html($("#code").html() + ".");},
        "click .del": function(){ $("#code").html($("#code").html().slice(0, -1));},
        "click .search_barcode": function(e) {
            this._onBarcodeManual()
        },   
        "click .search_reference": function(e) {
            this._onReferenceManual()
        },  
        "click .exit": function() {
            this.do_action({
                type: 'ir.actions.client',
                name: _t('Select Barcode'),
                tag: 'select_barcode',
                target: 'fullscreen',
            }, {clear_breadcrumbs: true}); 
        },
        "click .locat": function(e) {
            e.preventDefault();
            Session.product_list = {};
            Session.orig = undefined;
            this.do_action('inventory_log.location_kanban_action_duwi',{
                additional_context: {
                    type: "orig",
                    n_action: "inventory_log.quick_info",
                },
                clear_breadcrumbs: true
            });
        },
        "click .prod": function(e) {
            e.preventDefault();
            Session.product_list = {};
            Session.orig = undefined;
            this.do_action('inventory_log.product_kanban_action',{
                    additional_context: {
                        domain: [],
                        n_action: "inventory_log.quick_info",
                    },
                    clear_breadcrumbs: true,
                });
        },
    },

    init: function(parent, action) {
        var self = this;
        this._super.apply(this, arguments);
        this.barcode_type = action.barcode_type || false;
    },

    start: async function () {
        this._super();
        var self = this;
        core.bus.on('barcode_scanned', this, this._onBarcodeScanned);
        var args = [];
        if(Session.product_list && Object.keys(Session.product_list).length > 0)
            args = [Object.keys(Session.product_list)[0],'p'];
        else if (Session.orig)
            args = [Session.orig.id,'l'];
        if (args.length > 0)
            this._rpc({
                    model: 'stock.warehouse',
                    method: 'quick_info_by_id',
                    args: args,
                }).then(function(res){
                    if (!res){
                        self.$el.html( QWeb.render("QuickInfoXML",{type:self.barcode_type}));
                    }
                    else {       
                        res.type =self.barcode_type;
                        self.$el.html( QWeb.render("QuickInfoXML", res));
                    }
                });
        else 
            self.$el.html( QWeb.render("QuickInfoXML",{type:this.barcode_type}));
    },
    _onReferenceManual: function() {
        var self = this;
        var reference = $("#code").html();
        this._rpc({
            model: 'stock.warehouse',
            method: 'quick_info_reference',
            args: [reference],
        }).then(function(res){
            if (!res){
                $(".modal-title").html(_t("Reference not found"));
                $(".modal").modal('show');
            }
            else {    
                res.type = self.barcode_type;
                self.$el.html( QWeb.render("QuickInfoXML", res));
            }
        });
    },


    _onBarcodeManual: function() {
        var self = this;
        var barcode = $("#code").html();
        var codes = false;
        var lot_id = false;

        if(this.barcode_type === 'gs1'){
            var codes = self.parseBarcode(barcode)
            barcode = codes['product_id'].toString();
            if(codes['lote']){
                lot_id = codes['lote'].toString();
            }
        }

        this._rpc({
                model: 'stock.warehouse',
                method: 'quick_info_barcode',
                args: [barcode,self.barcode_type,lot_id],
            }).then(function(res){
                if (!res){
                    $(".modal-title").html(_t("Barcode not found"));
                    $(".modal").modal('show');
                }
                else {    
                    res.type = self.barcode_type;
                    self.$el.html( QWeb.render("QuickInfoXML", res));
                }
                core.bus.on('barcode_scanned', self, self._onBarcodeScanned);
            });
    },
    _onBarcodeScanned: function(barcode) {
        var self = this;
        alert(barcode)

        
        core.bus.off('barcode_scanned', this, this._onBarcodeScanned);
        var lot_id = false;

        this._rpc({
                model: 'stock.warehouse',
                method: 'quick_info_barcode',
                args: [barcode,self.barcode_type,lot_id],
            }).then(function(res){
                console.log("RES ",res)
                if (!res){
                    $(".modal-title").html(_t("Barcode not found"));
                    $(".modal").modal('show');
                }
                else { 
                    res.type =self.barcode_type;   
                    self.$el.html( QWeb.render("QuickInfoXML", res));
                }
                core.bus.on('barcode_scanned', self, self._onBarcodeScanned);
            });
    }, 
});

core.action_registry.add('quick_info', QuickInfo);

return QuickInfo;

});
