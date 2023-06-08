odoo.define('inventory_log.mat_borrow', function (require) {
    "use strict";

    "use strict";
    
    // web odoo dependecies
    var AbstractAction = require('web.AbstractAction');
    var ajax = require('web.ajax');
    var core = require('web.core');
    // var env = require('web.env');
    // var mat_service = env.services.mat_service;
    var Session = require('web.session');
    var canvas = require('inventory_log.canvas');
    
    var _t = core._t;
    
    var QWeb = core.qweb;
    
    // START module class encapsulation
    var MaterialBorrow = AbstractAction.extend({
        /* EVENTS */
        // events in html elements
         events: {
            "click .manual": function(){
                core.bus.off('barcode_scanned', this, this._onBarcodeScanned);
                this.do_action("inventory_log.op_type_select");
            },
            "click .start": function(e) {
                var self = this;
                if (Object.keys(Session.product_list).length < 1){
                    $(".modal-title").html(_t("Warning"));
                    $(".modal-body").html(_t("<p>Number of products must be higher than 0.</p>"));
                    $(".modal").modal('show')
                    return;
                }
                if (!Session.orig){
                    $(".modal-title").html(_t("Warning"));
                    $(".modal-body").html(_t("<p>Origin must be set.</p>"));
                    $(".modal").modal('show')
                    return;
                }
                if (!Session.dest){
                    $(".modal-title").html(_t("Warning"));
                    $(".modal-body").html(_t("<p>Destination must be set.</p>"));
                    $(".modal").modal('show')
                    return;
                }
                if (Session.orig.id == Session.dest.id){
                    $(".modal-title").html(_t("Warning"));
                    $(".modal-body").html(_t("<p>Origin and Destination must be different.</p>"));
                    $(".modal").modal('show')
                    return;
                }
                if (Session.orig.display_name.includes(Session.dest.display_name) || Session.dest.display_name.includes(Session.orig.display_name)){
                    $(".modal-title").html(_t("Warning"));
                    $(".modal-body").html(_t("<p>Origin and Destination must not be direct son/parent.</p>"));
                    $(".modal").modal('show')
                    return;
                }
                if (Session.respon){
                    $(".modal-title").html(_t("Signature"));
                    var html = "";
                    html +=    "<div class='o_canvas_container'>";
                    html += _t("<canvas id='myCanvas' class='o_signature_canvas'> Canvas not supported</canvas>");
                    html +=    "<input name='signature' id='signature' type='hidden'/>";
                    html +=    "<div class='o_canvas_clear_button_container'>";
                    html += _t("<button id='clear' class='btn btn-primary'>Clear</button><br/>");
                    html += _t("<button id='finish' class='btn btn-success'>Confirm</button><br/>");
                    html +=    "</div></div>";
                    $(".modal-body").html(html);
                    $(".modal").modal('show');
                    $("#finish").prop('disabled', true);
                    $("#finish").click(function() {
                        $(".modal").modal('hide');
                        self.signed_picking();
                    });
                    this.canvas.canvas_html_element($('#myCanvas'));
                    this.canvas.clear_html_clickable_element($('#clear'));

                    this.canvas.myCanvas.bind('mouseup', function(e) {
                        if(!self.canvas.its_signed) {
                            self.canvas.its_signed = true;
                            // let sig_64 = self.canvas.myCanvas[0].toDataURL();
                            // self.image_canvas = sig_64.split(',')[1]; 
                            $("#finish").prop('disabled', false);
                            // $('.modal_body_fotter').html(QWeb.render("SignatureModalFotter", {widget: self, from:from})); 
                        }
                    });
                    this.canvas.$clear.bind('click', function(e) {
                        if(self.canvas.its_signed) {
                            self.canvas.its_signed = false;
                            $("#finish").prop('disabled', true);
                            // $('.modal_body_fotter').html(QWeb.render("SignatureModalFotter", {widget: self, from:from}));
                        }
                    });
                    
                    return;
                }
                this._rpc({
                    model: 'stock.warehouse',
                    method: 'create_picking_with_email',
                    args: [Session.product_list, Session.orig.id, Session.dest.id, false, false, Session.uid],
                }).then(function(res){
                    $(".modal-title").html(_t("Result"));
                    if (res.length){
                        $(".modal-body").html(_t("<p>"+res+"</p>"));
                    }
                    else if (!res){
                        $(".modal-body").html(_t("<p>Error creating the picking.</p>"));
                    }
                    else {
                        self.do_action('inventory_log.end_screen');
                        return;
                    }
                    $(".modal").modal('show')
                });
            },
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
        },
    
        /* INITIALIZATION */
    
        // initialization mian function
        start: async function () {
            this._super();
            core.bus.on('barcode_scanned', this, this._onBarcodeScanned);
            this.$el.html( await QWeb.render("MatBorrow", {widget: this}));
            // this._rpc({
            //         model: 'res.company',
            //         method: 'search_read',
            //         args: [[],['category_materials_ids']],
            //     }).then(function(res){
            //         if (res.length > 0)
            //             Session.mats_categ_ids = res[0].category_materials_ids;
            //     });
        },
    
        /* BARCODE */
        // on barcode sccaned make a request from odoo db to ensure if its some expected register
        _onBarcodeScanned: function(barcode) {
            var self = this;    
            core.bus.off('barcode_scanned', this, this._onBarcodeScanned);
            this._rpc({
                    model: 'stock.warehouse',
                    method: 'check_barcode',
                    args: [barcode,],
                }).then(function(res){
                    if (res.length > 0 && res[0] == 'p'){
                            Session.product_list = {}
                            Session.product_list[res[1].id] = [res[1].name,parseFloat($("#code").html()) || 1];
                            self.do_action("inventory_log.op_type_select");
    
                    }
                    else
                        core.bus.on('barcode_scanned', self, self._onBarcodeScanned);
                });
        }, 
        
        signed_picking: function () {
            var self = this;
            let sig_64 = this.canvas.myCanvas[0].toDataURL();
            this._rpc({
                    model: 'stock.warehouse',
                    method: 'create_picking_with_email',
                    args: [Session.product_list, Session.orig.id, Session.dest.id, Session.respon.id, sig_64.split(',')[1], Session.uid],
                }).then(function(res){
                    $(".modal-title").html(_t("Result"));
                    if (res.length){
                        $(".modal-body").html(_t("<p>"+res+"</p>"));
                    }
                    else if (!res){
                        $(".modal-body").html(_t("<p>Error creating the picking.</p>"));
                    }
                    else {
                        self.do_action('inventory_log.end_screen');
                        return;
                    }
                    $(".modal").modal('show')
                });
        },
    });
    
    var EndScreen = AbstractAction.extend({
        events: {
            "click .button_dismiss": function(e) {
                if (Session.next_action){
                    var n_act = Session.next_action;
                    Session.next_action = false;
                    this.do_action(n_act);
                }
                else
                    this.do_action('inventory_log.material_borrow');
            },
        },
        start: async function () {
            this._super();
            Session.product_list = {};
            Session.respon = undefined;
            Session.orig = undefined;
            Session.dest = undefined;
            this.$el.html( await QWeb.render("EndScreen"));
        },
    });
    
    core.action_registry.add('material_borrow', MaterialBorrow);
    core.action_registry.add('end_screen', EndScreen);
    
    return {
        MaterialBorrow,
        EndScreen,
    };
})