// START odoo module encapsulation
odoo.define('inventory_log.validate_wh_ops', function (require) {
"use strict";

var AbstractAction = require('web.AbstractAction');
var ajax = require('web.ajax');
var core = require('web.core');
var canvas = require('inventory_log.canvas');

var Session = require('web.session');
var _t = core._t;

var QWeb = core.qweb;

var ValidateWHOps = AbstractAction.extend({
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
        "click .done": function(e) {
            $('#modal2').modal('toggle');
            Session.move_line = $(e.currentTarget).attr('class').split(/line_/)[1].split(' ')[0];
        }, 
        "click .search_barcode": function(e) {
            this._onBarcodeManual()
        },
        "click .temperature_quality": function(e) {
            var self = this;
            if($('.correct_state_van').is(':checked') && $('.temperature_quality').is(':checked')){
                !$('.quality_check').prop("checked", self.picking.quality_check);
                if ( self.picking.quality_check )
                    $(".reason_check").hide();
            } else {
                if($('.quality_check').is(':checked')){
                    !$('.quality_check').prop("checked", false);
                }
                $(".reason_check").show();
            }

        },
        "click .correct_state_van": function(e) {
            var self = this;
            if($('.correct_state_van').is(':checked') && $('.temperature_quality').is(':checked')){
                !$('.quality_check').prop("checked", self.picking.quality_check);
                if ( self.picking.quality_check )
                    $(".reason_check").hide();
            } else {
                if($('.quality_check').is(':checked')){
                    !$('.quality_check').prop("checked", false);
                }
                $(".reason_check").show();
            }

        },
        "click .nav-item": function(e) {
            $('#modal2').modal('hide');
            $('body').removeClass('modal-open');
            $('.modal-backdrop').remove();
        },
        "click .modal_close": function(e) {
            $('body').removeClass('modal-open');
            $('.modal-backdrop').remove();
        },
        "click .undo": function(e) {
            var self = this;
            this._rpc({
                model: 'stock.move.line',
                method: 'erase_done',
                args: [[parseInt(Session.move_line)]],
            })
            .then(function (quality_check) {
                delete Session.lines_done[Session.move_line];
                self.picking.quality_check = quality_check
                self._rpc({
                    model: 'stock.warehouse',
                    method: 'get_stock_move',
                    args: [Session.picking.id],
                }).then(function(result){
                    $("#modal2").modal('toggle');
                    $('body').removeClass('modal-open');
                    $('.modal-backdrop').remove();
                    Session.line_pick = {}
                    result.stock_move_line.forEach(function(l) {
                        if(l.qty_done != l.product_uom_qty && l.product_uom_qty!=0 && l.qty_done < l.product_uom_qty){
                            Session.line_pick[l.id] = {name:l.product_id[1], product_uom_qty:l.product_uom_qty, quantity_done: l.qty_done,reserved_availability:l.product_uom_qty,lot_id:l.lot_id};
                        }
                    });
                    result.stock_move.forEach(function(l) {
                        if(l.reserved_availability==0){
                            Session.line_pick_not_reserved[l.id] = {name:l.product_id[1], product_uom_qty:l.product_uom_qty, quantity_done: l.qty_done,reserved_availability:l.reserved_availability,lot_id:l.lot_id};   
                        }
                    });
                    self.$el.html(QWeb.render("ValidateWHOpsXML", {picking: self.picking, completed_lines: Session.lines_done , lines: Session.line_pick, dest: Session.dest, respon: Session.respon, zones: self.zones,states: self.states,date: self.picking.scheduled_date.split(' '), options: Session.company_settings, p_type:Session.picking_type_code, is_in_group:Session.company_settings.quality_control_group}));      
                    if ( self.picking.quality_check )
                        $(".reason_check").hide();
                });
          });
        }, 
        "click .go_back_no_save": function(){ 
            Session.line_pick = undefined;
            Session.respon = undefined;
            Session.dest = undefined;  
            var date = false; 
            var self = this;

            $("#exampleModal").modal('toggle');
            $('body').removeClass('modal-open');
            $('.modal-backdrop').remove();
            core.bus.off('barcode_scanned', this, this._onBarcodeScanned);
            if(Session.date){
                date = Session.date
            }
                this.do_action({
                    type: 'ir.actions.client',
                    name: _t('Warehouse Operations'),
                    tag: 'wh_ops',
                    target: 'fullscreen',
                    next_show: Session.picking_type
                }, {clear_breadcrumbs: true}); 
        },
        "click .back": function(e) {
            var self = this;
            var date = false; 
            $('body').removeClass('modal-open');
            $('.modal-backdrop').remove();
            Session.line_pick = undefined;
            Session.respon = undefined;
            Session.dest = undefined; 
            date = false
            core.bus.off('barcode_scanned', this, this._onBarcodeScanned);
            if(Session.date){
                date = Session.date
            }
            if(Session.from_picking_lines){
                Session.from_picking_lines = undefined;
                self.do_action({
                    type: 'ir.actions.client',
                    name: _t('Picking Lines'),
                    tag: 'picking_lines',
                    target: 'fullscreen',
                    date: Session.date,
                    filter: Session.filter,
                    warehouse: Session.warehouse,
                    zones: Session.selected_badges,
                }, {clear_breadcrumbs: true}); 
            }  
            this.do_action({
                type: 'ir.actions.client',
                name: _t('Warehouse Operations'),
                tag: 'wh_ops',
                target: 'fullscreen',
                next_show: Session.picking_type
            }, {clear_breadcrumbs: true}); 
        },
        "click .partner": function(e) {
            e.preventDefault();
            this.do_action('inventory_log.respon_kanban_action',{
                additional_context: {
                    n_action: "inventory_log.validate_wh_ops",
                },
                clear_breadcrumbs: true
            });
        },
        "click .loc": function(e) {
            e.preventDefault();

            this.do_action('inventory_log.location_kanban_action_duwi',{
                additional_context: {
                    type: "dest",
                    n_action: "inventory_log.validate_wh_ops",
                },
                clear_breadcrumbs: true
            });

        },
        "click .to_do": function(e) {
            e.preventDefault();
            this.do_action({
                type: 'ir.actions.client',
                name: _t('Move Line'),
                tag: 'move_line',
                target: 'fullscreen',
                move_line_id: $(e.currentTarget).attr('class').split(/line_/)[1]
            }, {clear_breadcrumbs: true});
        },
        "click .done_confirm": function(e) {
            self._rpc({
                model: 'stock.move.line',
                method: 'unlink',
                args: [parseInt($(e.currentTarget).attr('class').split(/line_/)[1])],
            })
            .then(function () {
                self._reloadAttachmentBox();
                if (self.fields.thread) {
                    self.fields.thread.removeAttachments([ev.data.attachmentId]);
                }
                self.trigger_up('reload');
            });
        },

        "click .save_changes": function() {
            var self = this;
            self.scheduled_date = $('#start').val()+' '+$('#appt').val()
            self.zone_id = parseInt($("#selected_zone").val());
            if($(".temperature").val()){
                Session.deliver_temperature =  $(".temperature").val().replace(',','.');
            }
            this._rpc({
                model: 'stock.picking',
                method: 'write',
                args: [self.picking.id, {scheduled_date: self.scheduled_date,
                deliver_temperature: Session.deliver_temperature}],
            });
        },
        "click .cancel_r": function() {
            var self = this;
            this._rpc({
                model: 'stock.warehouse',
                method: 'do_unreserve_log',
                args: [self.picking.id]
            }).then(function(res){
                self.start()  
                core.bus.off('barcode_scanned', self, self._onBarcodeScanned);
            });
        },
        "click .validate": function(e) {
            var self = this;
            var msg = ""
            var value = self.check_lines()
            var checked_quality = true;
            var quality_message = false;
            var temperature_quality = false;
            var correct_state_van = false;

            var self = this;
            var msg = ""
            var value = self.check_lines()
            console.log("Value ",value)
            $(".force_validate").prop('disabled', false);
    
            switch(value){
                case 3:
                    msg += _t("<p>You have processed more than what was initially planned. Are you sure you want to validate the picking?</p><br/>");
                    msg += _t("<p>You have processed less than what was initially planned.</p><br/><div class='form-check'><input class='form-check-input' type='checkbox' onclick=document.getElementById('b_order').setAttribute('value',document.getElementById('b_order').value*-1) value='-1' id='b_order'/><label class='form-check-label' for='flexCheckDefault'>Create BackOrder</label></div>");
                    break;
                case 2:
                    msg += _t("<p>You have processed less than what was initially planned.</p><br/><div class='form-check'><input class='form-check-input' type='checkbox' onclick=document.getElementById('b_order').setAttribute('value',document.getElementById('b_order').value*-1) value='-1' id='b_order'/><label class='form-check-label' for='flexCheckDefault'>Create BackOrder</label></div>");
                    break;
                case 1:
                    msg += _t("<p>You have processed more than what was initially planned. Are you sure you want to validate the picking?</p>");
                    break;
            }
            if (value != 0){
                $("#GenericModalTitle").html(_t("Warning"));
                $("#GenericModalBody").html(msg);
                $("#GenericModal").modal('show');
                console.log("valueeee");
                return;
            }
            $('body').removeClass('modal-open');
            $('.modal-backdrop').remove();
            console.log('validar', self)
            
            if(!$('.quality_check').is(':checked')){
                checked_quality = false;
                if($('.reason_state').val()){
                    quality_message = $('.reason_state').val();
                }
            }
            if($('.temperature_quality').is(':checked')){
                temperature_quality = true;
            }
            if($('.correct_state_van').is(':checked')){
                correct_state_van = true;
            }
            
            Session.scheduled_date = $('#start').val()+' '+$('#appt').val();
            Session.delivery_zone_id = false;
            
            Session.deliver_temperature =  false;
            if($(".temperature").val()){
                Session.deliver_temperature =  $(".temperature").val().replace(',','.');
            }
            this._rpc({
                model: 'stock.warehouse',
                method: 'validate_picking',
                args: [self.picking.id, Session.line_pick, false, Session.dest,,
                    ,Session.scheduled_date,false,Session.deliver_temperature,
                    checked_quality,quality_message,temperature_quality,correct_state_van, Session.uid
                ],
            }).then(function(res){
                Session.line_pick = undefined;
                Session.dest = undefined;   
                core.bus.off('barcode_scanned', self, self._onBarcodeScanned);
                /*if(Session.date){
                    date = Session.date
                } */
                self.do_action({
                    type: 'ir.actions.client',
                    name: _t('Warehouse Operations'),
                    tag: 'wh_ops',
                    target: 'fullscreen',
                    next_show: Session.picking_type
                }, {clear_breadcrumbs: true}); 
            });
        },
        "click .force_validate": function(e) {
            var self = this;
            var msg = ""
            var value = self.check_lines()
            var date = false;
            var checked_quality = true;
            var quality_message = false;
            var temperature_quality = false;
            var correct_state_van = false;
            if (typeof(self.b_order) == undefined)
            self.b_order = false;
        if (value == 2 || value == 3){
            if ($("#b_order").val())
                self.b_order = $("#b_order").val();
        } else self.b_order = false;

            if(!$('.quality_check').is(':checked')){
                checked_quality = false;
                if($('.reason_state').val()){
                    quality_message = $('.reason_state').val();
                }
            }
            if($('.temperature_quality').is(':checked')){
                temperature_quality = true;
            }
            if($('.correct_state_van').is(':checked')){
                correct_state_van = true;
            }
            var sig_64 = false;
            $('body').removeClass('modal-open');
            $('.modal-backdrop').remove();
            if (Session.respon || self.picking.picking_type_code == 'outgoing' && Session.company_settings.signature){
                sig_64 = this.canvas.myCanvas[0].toDataURL();
                sig_64 = sig_64.split(',')[1]
            }
            Session.scheduled_date = $('#start').val()+' '+$('#appt').val();
            Session.delivery_zone_id = false;
            
            Session.deliver_temperature =  false;
            if($(".temperature").val()){
                Session.deliver_temperature =  $(".temperature").val().replace(',','.');
            }
            this._rpc({
                model: 'stock.warehouse',
                method: 'validate_picking',
                args: [self.picking.id, Session.line_pick, self.b_order, Session.dest, Session.respon && Session.respon.id || false, sig_64
                    ,Session.scheduled_date,false,Session.deliver_temperature,
                    checked_quality,quality_message,temperature_quality,correct_state_van, Session.uid]
            }).then(function(res){
                Session.line_pick = undefined;   
                Session.dest = undefined;   
                Session.respon = undefined;
                core.bus.off('barcode_scanned', self, self._onBarcodeScanned);
                if(Session.date){
                    date = Session.date
                }  
                self.do_action({
                    type: 'ir.actions.client',
                    name: _t('Warehouse Operations'),
                    tag: 'wh_ops',
                    target: 'fullscreen',
                    next_show: Session.picking_type
                }, {clear_breadcrumbs: true}); 
            });
            $('body').removeClass('modal-open');
            $('.modal-backdrop').remove();
        },
        "click .duplicate": function(e) {
            var self = this;
            e.preventDefault();
            Session.line_pick[Session.counter--] = Session.line_pick[$(e.currentTarget).parent().attr('id')]
            self.$el.html( QWeb.render("ValidateWHOpsXML", {picking: self.picking, lines: Session.line_pick, dest: Session.dest, respon: Session.respon, zones: self.zones,states: self.states,date: self.picking.scheduled_date.split(' '), options: Session.company_settings, p_type:Session.picking_type_code, is_in_group:Session.company_settings.quality_control_group}));
            if ( self.picking.quality_check )
                $(".reason_check").hide();
        },
        "click .prod": function(e) {
            e.preventDefault();
        },
        "click .confirm_create_lot": function(e) {
            var self = this;
            e.preventDefault();
            this._rpc({
                model: 'stock.move',
                method: 'create_new_lot',
                args: [Session.current_line,$(".lot_name").val()],
            }).then(function(res){
                Session.line_pick[Session.current_line].lot_ids.push(res)
                Session.line_pick[Session.current_line].current_lot = res
                $("#myModal").modal('toggle');
                Session.current_line = undefined;
                self.$el.html( QWeb.render("ValidateWHOpsXML", {picking: self.picking, lines: Session.line_pick, dest: Session.dest, respon: Session.respon, zones: self.zones,states: self.states,date: self.picking.scheduled_date.split(' '),  options: Session.company_settings, p_type:Session.picking_type_code, is_in_group:Session.company_settings.quality_control_group}));
                if ( self.picking.quality_check )
                    $(".reason_check").hide();
            });
        },
        "click .create_lot": function(e) {
            Session.current_line = $(e.currentTarget).parent().parent().attr('id')
            e.preventDefault();
            this._rpc({
                model: 'stock.move',
                method: 'get_sequence',
                args: [],
            }).then(function(res){
                $(".lot_name").val(res)
                $("#myModal").modal('toggle');
            });

        },
        "change .qty_done": function(e){
            var line_id = $(e.currentTarget).parent().attr('class').split(/line_/)[1];
            Session.line_pick[line_id].quantity_done = parseFloat($(e.currentTarget).val());
        },
        "click .check-availability": function(e) {
            var self = this;
            e.preventDefault();
            this._rpc({
                model: 'stock.picking',
                method: 'action_assign_kanban',
                args: [Session.picking.id],
            }).then(function(result){
                if (result == 'assigned') {
                    Session.picking = {"id": Session.picking.id};
                    self.do_action("inventory_log.validate_wh_ops");
                } else {
                    $('#StateWarning').modal('show');
                }
                
            });
        },
        "click .view_picking_picture": function(e) {
            e.preventDefault();
            Session.take_pic = false
            this.do_action({
                type: 'ir.actions.client',
                name: _t('Picking Picture'),
                tag: 'picking_picture',
                target: 'fullscreen',
            }, {clear_breadcrumbs: true});
        },
        "click .take_picking_picture": function(e) {
            e.preventDefault();
            Session.take_pic = true
            this.do_action({
                type: 'ir.actions.client',
                name: _t('Picking Picture'),
                tag: 'picking_picture',
                target: 'fullscreen',
            }, {clear_breadcrumbs: true});
        },
    },
    start: async function () {
        this._super();
        Session.counter = -1;
        Session.in_group = false
        var self = this;
        if (!Session.picking) {
            this.do_action('inventory_log.main_screen',{
                    clear_breadcrumbs: true
                });
            return;
        }
        if (!Session.line_pick){
            Session.line_pick = {};
        }
        this.canvas = new canvas();
        this._rpc({
                model: 'stock.warehouse',
                method: 'get_picking',
                args: [Session.picking.id,Session.location_id,Session.picking_type],
            }).then(function(result){
                if (result.picking.length > 0){
                    self.picking = result.picking[0];
                    self.scheduled_date = self.picking.scheduled_date;
                    self.zones = result.zones;
                    self.states = result.states;
                    if ( self.picking.quality_check )
                        $(".reason_check").hide();
                }
                else {
                    self.do_action({
                        type: 'ir.actions.client',
                        name: _t('Warehouse Operations'),
                        tag: 'wh_ops',
                        target: 'fullscreen',
                    }, {clear_breadcrumbs: true}); 
                }
                self.type = self.picking.picking_type_code;
                Session.picking_type_code = self.type;
                Session.barcodes = result.barcodes
                Session.line_pick = {}
                Session.lines_done = {}
                Session.line_pick_not_reserved = {}
                result.stock_move_line.forEach(function(l) {
                    if(l.qty_done != l.product_uom_qty && l.product_uom_qty!=0 && l.qty_done < l.product_uom_qty){
                        Session.line_pick[l.id] = {name:l.product_id[1], product_uom_qty:l.product_uom_qty, quantity_done: l.qty_done,reserved_availability:l.product_uom_qty,lot_id:l.lot_id, expired: l.expired};
                    }
                    if(l.qty_done > 0){
                        Session.lines_done[l.id] = {name:l.product_id[1], product_uom_qty:l.product_uom_qty, quantity_done: l.qty_done,lot_id:l.lot_id, expired: l.expired};
                    }
                });
                result.stock_move.forEach(function(l) {
                    if(l.reserved_availability==0){
                        Session.line_pick_not_reserved[l.id] = {name:l.product_id[1], quantity_done: l.quantity_done,reserved_availability:l.reserved_availability,lot_id:l.lot_id};   
                    }
                });
                core.bus.on('barcode_scanned', self, self._onBarcodeScanned);
                self.$el.html( QWeb.render("ValidateWHOpsXML", {picking: self.picking, completed_lines: Session.lines_done , lines: Session.line_pick, dest: Session.dest, respon: Session.respon, zones: self.zones,states: self.states,date: self.picking.scheduled_date.split(' '), options: Session.company_settings, p_type: Session.picking_type_code, is_in_group:Session.company_settings.quality_control_group}));
                if(self.picking.quality_check){
                    $(".reason_check").hide();
                }
            });
    },
    check_lines: function() {
        var result = 0;
        // 0 = All Rigth
        // 1 = Product Excess 
        // 2 = Less Product than expected (BackOrder?)
        // 3 = All of before

        Object.keys(Session.line_pick).forEach(function(k){
            if (result == 3) return;

            if (Session.line_pick[k].reserved_availability > Session.line_pick[k].quantity_done && result != 2)
                result += 2;
            if (Session.line_pick[k].reserved_availability < Session.line_pick[k].quantity_done && result != 1)
                result += 1;
        });
        if (Object.keys(Session.line_pick_not_reserved).length > 0 && result != 2){
            result += 2;
        }
        return result;
    },
    _onBarcodeScanned: function(barcode) {
        var self = this;

        core.bus.off('barcode_scanned', this, this._onBarcodeScanned);
        var self = this;
        var move_line_id = false;
        var found = false;
        this._rpc({
            model: 'stock.warehouse',
            method: 'check_barcode',
            args: [barcode,],
        }).then(function(res){
            if (res.length > 0){
                Session.barcodes.forEach(function(l) {

                    if(l.product_id === res[[1]].barcode){
                        if(!found){
                            found = l.line;
                        }
                    }
                });
                if (found) {
                    move_line_id = found
                    if(move_line_id){
                        self.do_action({
                            type: 'ir.actions.client',
                            name: _t('Move Line'),
                            tag: 'move_line',
                            target: 'fullscreen',
                            move_line_id: move_line_id,
                        }, {clear_breadcrumbs: true}); 
                    }
                    else{
                        alert(_t("Barcode don't match any product in line"));
                        core.bus.on('barcode_scanned', self, self._onBarcodeScanned);
                    }
                }
            }
            else{
                alert(_t("Barcode don't match any product in line"));
                core.bus.on('barcode_scanned', self, self._onBarcodeScanned);
            }
        });
        /*

        
        else{
            alert(_t("Barcode don't match any product in line"));
            core.bus.on('barcode_scanned', self, self._onBarcodeScanned);
        }*/
    },
});

core.action_registry.add('validate_wh_ops', ValidateWHOps);

return ValidateWHOps

});
// END Odoo module encapsulation
