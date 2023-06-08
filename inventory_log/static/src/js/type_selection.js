// START odoo module encapsulation
odoo.define('inventory_log.type_selection', function (require) {
"use strict";

// web odoo dependecies
var AbstractAction = require('web.AbstractAction');
var ajax = require('web.ajax');
var core = require('web.core');
// var env = require('web.env');
// var mat_service = env.services.mat_service;
var Session = require('web.session');
// var canvas = require('inventory_log.canvas');

var _t = core._t;

var QWeb = core.qweb;

    /* INITIALIZATION */

var MatOrder = AbstractAction.extend({
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
        "click #origPlace": function(e) {
            e.preventDefault();
            if (this.location){
                this.do_action('inventory_log.location_kanban_action',{
                    additional_context: {
                        type: "orig",
                    },
                    clear_breadcrumbs: true
                });
            }
            else
                this.do_action('inventory_log.warehouse_kanban_action',{
                    additional_context: {
                        type: "orig",
                    },
                    clear_breadcrumbs: true
                });
        },
        "click #destPlace": function(e) {
            e.preventDefault();
            if (this.location){
                this.do_action('inventory_log.location_kanban_action',{
                    additional_context: {
                        type: "dest",
                    },
                    clear_breadcrumbs: true
                });
            }
            else
                this.do_action('inventory_log.warehouse_kanban_action',{
                    additional_context: {
                        type: "dest",
                    },
                    clear_breadcrumbs: true
                });
        },
        "click .partner": function(e) {
            e.preventDefault();
            this.do_action('inventory_log.respon_kanban_action',{
                clear_breadcrumbs: true
            });
        },
        "click #add": function(e) {
            e.preventDefault();
            var self = this;
            var domain = []
            if (Session.mats_categ_ids && Session.mats_categ_ids.length > 0)
                domain.push(['categ_id', 'in', Session.mats_categ_ids])
            if (Session.orig)
                this._rpc({
                    model: 'stock.warehouse',
                    method: 'avail_prod',
                    args: [Session.orig.id],
                }).then(function(res){
                    domain.push(['id', 'in', res])
                    self.do_action('inventory_log.product_kanban_action',{
                        additional_context: {
                            domain: domain,
                        },
                        clear_breadcrumbs: true,
                    });
                });
            else
                this.do_action('inventory_log.product_kanban_action',{
                        additional_context: {
                            domain: domain,
                        },
                        clear_breadcrumbs: true,
                    });
        },
        "click .exit": function(e) {
            Session.product_list = {};
            Session.orig = undefined;
            Session.dest = undefined;
            core.bus.off('barcode_scanned', this, this._onBarcodeScanned);
            if (Session.next_action){
                var n_act = Session.next_action;
                Session.next_action = false;
                this.do_action(n_act);
            }
            else
                this.do_action('inventory_log.material_borrow',{
                    additional_context: {
                    },
                    clear_breadcrumbs: true
                });
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
                this.canvas_html_element($('#myCanvas'));
                this.clear_html_clickable_element($('#clear'));

                this.myCanvas.bind('mouseup', function(e) {
                    if(!self.its_signed) {
                        self.its_signed = true;
                        // let sig_64 = self.canvas.myCanvas[0].toDataURL();
                        // self.image_canvas = sig_64.split(',')[1]; 
                        $("#finish").prop('disabled', false);
                        // $('.modal_body_fotter').html(QWeb.render("SignatureModalFotter", {widget: self, from:from})); 
                    }
                });
                this.$clear.bind('click', function(e) {
                    if(self.its_signed) {
                        self.its_signed = false;
                        $("#finish").prop('disabled', true);
                        // $('.modal_body_fotter').html(QWeb.render("SignatureModalFotter", {widget: self, from:from}));
                    }
                });
                
                return;
            }
            this._rpc({
                model: 'stock.warehouse',
                method: 'create_picking',
                args: [Session.product_list,Session.orig.id,Session.dest.id],
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
        "click .prod": function(e) {
            e.preventDefault();
        },
        "click .trash": function(e) {
            var prod_id = $(e.currentTarget).parent().attr('class').split(/prod_/)[1];
            $(e.currentTarget).parent().remove();
            Session.product_list[prod_id] && delete Session.product_list[prod_id];
        },
        "change .qty": function(e){
            var prod_id = $(e.currentTarget).parent().attr('class').split(/prod_/)[1];
            var lot_id = $(e.currentTarget).parent().children('.lot').attr('id');
            if(lot_id){
            Session.product_list[prod_id][lot_id][1] = parseFloat($(e.currentTarget).val());
            }
            else{
                Session.product_list[prod_id][0][1] = parseFloat($(e.currentTarget).val());
            }
        },
        "click .lot": function(e) {
            var self = this;
            var prod_id = $(e.currentTarget).parent().attr('class').split(/prod_/)[1];
            e.preventDefault();
            var m = new Date();
            var dateString =
                m.getUTCFullYear() + "-" +
                ("0" + (m.getUTCMonth()+1)).slice(-2) + "-"+
                ("0" + m.getUTCDate()).slice(-2) + " " +
                ("0" + m.getUTCHours()).slice(-2) + ":" +
                ("0" + m.getUTCMinutes()).slice(-2) + ":" +
                ("0" + m.getUTCSeconds()).slice(-2);
            var domain = [['product_id','=',parseInt(prod_id)]];
            this.do_action('inventory_log.only_view_lot_kanban_action2',{
                additional_context: {
                    domain: domain,
                },
            });
        },
        "click .check": function(e) {
            e.preventDefault();
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
            this._rpc({
                model: 'stock.warehouse',
                method: 'check_avail',
                args: [Session.product_list, Session.orig.id],
            }).then(function(res){
                $(".modal-title").html(_t("Result"));
                if (res.length){
                    $(".modal-body").html(_t("<p>"+res+"</p>"));
                }
                else {
                    $(".modal-body").html(_t("<p>All seems correct.</p>"));
                }
                $(".modal").modal('show')
            });

        },
    },
    signed_picking: function () {
        var self = this;
        let sig_64 = this.myCanvas[0].toDataURL();
        this._rpc({
                model: 'stock.warehouse',
                method: 'create_picking',
                args: [Session.product_list,Session.orig.id,Session.dest.id, Session.respon.id, sig_64.split(',')[1]],
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
    start: async function () {
        this._super();
        if (!Session.product_list)
            Session.product_list = {};
        core.bus.on('barcode_scanned', this, this._onBarcodeScanned);
        var self = this;
        self.getSession().user_has_group('inventory_log.group_use_locations').then(function(has_group){
            self.location = has_group;
        })
        setTimeout(function(){ 
            self._rpc({
                model: 'stock.warehouse',
                method: 'warehouse_ops_count',
                args: [],
            }).then(function(count){
                Session.company_settings = count['company']
            });
        }, 1000);
        this.$el.html( await QWeb.render("MatOrder", {widget: this, products: Session.product_list, orig: Session.orig, dest: Session.dest, respon: Session.respon}));
    },
    _onBarcodeScanned: function(barcode) {
        var self = this;
        core.bus.off('barcode_scanned', this, this._onBarcodeScanned);
        this._rpc({
                model: 'stock.warehouse',
                method: 'check_barcode',
                args: [barcode,],
            }).then(function(res){
                if (res.length > 0){
                    if (res[0] == 'p'){
                        if (!Session.product_list[res[1].id])
                            Session.product_list[res[1].id] = 
                                {0:[res[1].name,parseFloat($("#code").html()) || 1,res[1].uom_id[0],res[1].tracking]};
                        else
                            Session.product_list[res[1].id][1] += parseFloat($("#code").html()) || 1;
                    }else{
                        if (!Session.orig)
                            Session.orig = {"id": res[1].id, 'name': res[1].display_name};
                        else if (!Session.dest)
                            Session.dest = {"id": res[1].id, 'name': res[1].display_name};
                    }   
                    self.do_action("inventory_log.op_type_select");
                }
                else
                    core.bus.on('barcode_scanned', self, self._onBarcodeScanned);
            });


    }, 
    canvas_html_element(element) {
        this.myCanvas  = element || $("#myCanvas");
        this.context = this.myCanvas[0].getContext("2d");
        let s = getComputedStyle(this.myCanvas[0]);
        var w = s.width;
        var h = s.height;
        this.myCanvas[0].width = w.split('px')[0];
        this.myCanvas[0].height = h.split('px')[0];
        this.canvas_events();
    },
    clear_html_clickable_element(element) {
        let self = this;
        this.$clear  = element || $("#clear");
        this.$clear.click(function(){   
            self.myCanvas[0].width = self.myCanvas[0].width;
        });
    },
    canvas_events() {
        let self = this;
        let myCanvas = this.myCanvas[0];
        this.myCanvas.bind('mousedown', function(e) {self.beginSignature(e)});
        this.myCanvas.bind('mouseup', function(e) {self.endSignature(e)});
        this.myCanvas.bind('mouseout', function(e) {self.endSignature(e)});
        this.myCanvas.bind('mousemove', function(e) {self.doDrawSignature(e)});
        $( window ).resize(function() {
            self.context = self.myCanvas[0].getContext("2d");
            let s = getComputedStyle(self.myCanvas[0]);
            var w = s.width;
            var h = s.height;
            self.myCanvas[0].width = w.split('px')[0];
            self.myCanvas[0].height = h.split('px')[0];
        });
       
      // Set up touch events for mobile, etc
        myCanvas.addEventListener("touchstart", function (e) {
            let mousePos = self.getTouchPos(myCanvas, e);
            let touch = e.touches[0];
            let mouseEvent = new MouseEvent("mousedown", {
                clientX: touch.clientX,
                clientY: touch.clientY
            });
            myCanvas.dispatchEvent(mouseEvent);
        }, false);

        myCanvas.addEventListener("touchend", function (e) {
            let mouseEvent = new MouseEvent("mouseup", {});
            myCanvas.dispatchEvent(mouseEvent);
        }, false);
        
        myCanvas.addEventListener("touchmove", function (e) {
            let touch = e.touches[0];
            let mouseEvent = new MouseEvent("mousemove", {
                clientX: touch.clientX,
                clientY: touch.clientY
            });
            myCanvas.dispatchEvent(mouseEvent);
        }, false);

        // Prevent scrolling when touching the canvas
        document.body.addEventListener(
            'touchstart',
            function (e) {
                if (e.target == self.myCanvas[0]) {
                    e.preventDefault();
                }
            },
            {passive: false}
        );
        document.body.addEventListener(
            'touchend',
            function (e) {
                if (e.target == self.myCanvas[0]) {
                    e.preventDefault();
                }
            },
            {passive: false}
        );
        document.body.addEventListener(
            'touchmove',
            function (e) {
                if (e.target == self.myCanvas[0]) {
                    e.preventDefault();
                }
            },
            {passive: false}
        );
    },
    // Get the position of a touch relative to the canvas
    getTouchPos(canvasDom, touchEvent) {
        let rect = canvasDom.getBoundingClientRect();
        return {
            x: touchEvent.touches[0].clientX - rect.left,
            y: touchEvent.touches[0].clientY - rect.top
        };
    },
    beginSignature(event) {
        this.drawingSignature = true;
        this.context.beginPath();
        const rect = this.myCanvas[0].getBoundingClientRect();
        this.context.moveTo(event.clientX - rect.left, event.clientY - rect.top);
    },
    endSignature(){
        this.drawingSignature = false;
    },
    doDrawSignature(event){
        if (this.drawingSignature){
            this.context.strokeStyle = "black";
            const rect = this.myCanvas[0].getBoundingClientRect();
            this.context.lineTo(event.clientX - rect.left, event.clientY - rect.top);
            this.context.stroke();
        }
    },
    clearSignature(){
        this.myCanvas[0].width = this.myCanvas[0].width;
    },
});

core.action_registry.add('type_selection', MatOrder);

return MatOrder;

});
// END Odoo module encapsulation