// START odoo module encapsulation
odoo.define('inventory_log.move_line', function (require) {
    "use strict";
    
    var AbstractAction = require('web.AbstractAction');
    var ajax = require('web.ajax');
    var core = require('web.core');    
    var Session = require('web.session');
    var _t = core._t;
    
    var QWeb = core.qweb;
    
    var MoveLine = AbstractAction.extend({
        events: {
            "click .correct_state_of_product": function(e) {
                var self = this;
                if ($('.correct_state_of_product').is(':checked')) {
                    $(".bad_quality_description_div").hide();
                    $('.quality_check').prop("checked", Session.quality_check_prev_state)
                    
                } else {
                    Session.quality_check_prev_state = $('.quality_check').is(':checked')
                    $('.quality_check').prop("checked", false);
                    $(".bad_quality_description_div").show();
                }
                self.updateQualityCheckRelatedParams(Session, Session.line.failed_expiration, Session.line.overdue_days, $('.correct_state_of_product').is(':checked'), $('.quality_check').is(':checked'), "")
            },
            "click .confirm_create_lot": function(e) {
                var self = this;
                e.preventDefault();
                var expiration_date = false;
                var message = false
                var quality_check = true
                var failed_expiration = false
                var overdue_days = 0
                var html = ""
                if ($('#expiration_date').val()) {
                    expiration_date = $('#expiration_date').val() + ' 12:00:00' 
                }
                
                this._rpc({
                    model: 'stock.move.line',
                    method: 'create_new_lot',
                    args: [parseInt(Session.line['id']),$(".lot_name").val(),expiration_date],
                }).then(function(res) {
                    Session.line.lot_ids.push(res)
                    Session.line.current_lot = res;
                    if (Session.company_settings.quality_control_group && Session.line.product_tracking == 'lot' && self.line.product_id['expiration_time'] != 0)
                        if (self.line.current_lot && self.line.current_lot.expiration_date) {
                            var lot_date = new Date(self.line.current_lot.expiration_date.split(' ')[0]);
                            var today = new Date();
                            var dd = String(today.getDate()).padStart(2, '0');
                            var mm = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
                            var yyyy = today.getFullYear();
                            today = yyyy+'-'+mm+'-'+dd;
                            var todayDate = new Date(today);
                            var diffTime = Math.abs(todayDate - lot_date);
                            var diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                            var productLifeTime = self.line.product_id['expiration_time']
                            var productDays = new Date(new Date().getTime()+(productLifeTime * 24 * 60 * 60 * 1000));
                            if (lot_date <= todayDate) {
                                failed_expiration = true
                                quality_check = false
                                overdue_days = Math.abs(Math.ceil((productDays - lot_date) / (1000 * 60 * 60 * 24)))
                                message = "There is not enough life date"
                            } else {
                                if (diffDays < self.line.product_id['expiration_time']) {
                                    failed_expiration = true
                                    quality_check = false
                                    overdue_days = Math.abs(Math.ceil((productDays - lot_date) / (1000 * 60 * 60 * 24)))
                                    message = "There is not enough life date"
                                }
                            }
                        } else if (self.line.current_lot && !self.line.current_lot.expiration_date) {
                            failed_expiration = true
                            quality_check = false
                            message = "There is no life date"
                        } 
                    self.updateQualityCheckRelatedParams(self, failed_expiration, overdue_days, self.line.correct_state_of_product, quality_check, message)
                    $("#myModal").modal('toggle');
                    self.$el.html( QWeb.render("ShowMoveLine", {line: Session.line, options: self.conf,type:Session.picking_type_code, is_in_group:Session.company_settings.quality_control_group}));
                    if ($('.correct_state_of_product').is(':checked')) {
                        $(".bad_quality_description_div").hide();
                        $('.quality_check').prop("checked", Session.quality_check_prev_state)
                        
                    } else {
                        Session.quality_check_prev_state = $('.quality_check').is(':checked')
                        $('.quality_check').prop("checked", false);
                        $(".bad_quality_description_div").show();
                    }
                });
            },
            "click .create_lot": function(e) {
                e.preventDefault();
                if (Session.company_settings.lot_sequence) {
                    this._rpc({
                        model: 'stock.move',
                        method: 'get_sequence',
                        args: [],
                    }).then(function(res) {
                        $(".lot_name").val(res)
                        $("#myModal").modal('toggle');
                    });
                }
                else {
                    $("#myModal").modal('toggle');
                }
            },
            "click .validate_move_lines": function(e) {
                e.preventDefault();
                var self = this;
                var checked_quality = Session.line.quality_check;
                var correct_state_of_product = Session.line.correct_state_of_product;
                var bad_quality_description = $('.bad_quality_description').val();
                if (parseInt($(".done").val()) <  parseInt($(".to_do_total").val()))
                    $('#modal').modal('toggle');
                else {
                    console.log("lot name ",$(".selected_lot").text());
                    var html = "";
                    console.log("namaaae ",Session.line);
                    if(!$(".selected_lot").text() && Session.line.tracking != "none"){
                        html += _t("<p>You need to select or create a lot.</p><br/>");
                        $("#GenericModalBody").html(html);
                        $(".force_validate").prop('disabled', true);
                        $("#GenericModal").modal('show');
                        return;
                    }
                    this._rpc({
                        model: 'stock.move.line',
                        method: 'create_move_line',
                        args: [[parseInt(Session.line['id'])], self.parseQuantity($(".done").val()), parseInt($('.selected_lot').attr('id')), $('.selected_lot').html(),
                        Session.picking_type_code, checked_quality, correct_state_of_product, bad_quality_description, Session.line.product_id.id, 
                        Session.line.failed_expiration, Session.line.overdue_days, Session.line.reason_quality],
                    })
                    .then(function (line) {
                        $('body').removeClass('modal-open');
                        $('.modal-backdrop').remove();
                        Session.lot_id = undefined;
                        if (Session.picking) {
                            self.do_action({
                                type: 'ir.actions.client',
                                name: _t('Validate Picking'),
                                tag: 'validate_wh_ops',
                                target: 'fullscreen',
                            }, {clear_breadcrumbs: true}); 
                        }
                        else if (Session.pickings) {
                            self.do_action({
                                type: 'ir.actions.client',
                                name: _t('Validate Multiple Picking'),
                                tag: 'multiple_validate_wh_ops',
                                target: 'fullscreen',
                            }, {clear_breadcrumbs: true}); 
                        }

                        //window.history.back();
                    });
                }
            },
            "click .divide": function(e) {
                var checked_quality = Session.line.quality_check;
                var correct_state_of_product = Session.line.correct_state_of_product;
                var bad_quality_description = $('.bad_quality_description').val();
                var self = this;
                var html = "";
                console.log("namaaae ",Session.line);
                if(!$(".selected_lot").text() && Session.line.tracking != "none"){
                        html += _t("<p>You need to select or create a lot.</p><br/>");
                        $("#GenericModalBody").html(html);
                        $(".force_validate").prop('disabled', true);
                        $("#GenericModal").modal('show');
                        return;
                }
                this._rpc({
                    model: 'stock.move.line',
                    method: 'create_move_line',
                    args: [[parseInt(Session.line['id'])], self.parseQuantity($(".done").val()), parseInt($('.selected_lot').attr('id')), $('.selected_lot').html(),
                    Session.picking_type_code, checked_quality, correct_state_of_product, bad_quality_description, Session.line.product_id.id, 
                    Session.line.failed_expiration, Session.line.overdue_days, Session.line.reason_quality],
                })
                .then(function (line) {
                    $("#modal").modal('toggle');
                    $('body').removeClass('modal-open');
                    $('.modal-backdrop').remove();
                    Session.lot_id = undefined;
                    if (Session.picking) {
                        self.do_action({
                            type: 'ir.actions.client',
                            name: _t('Validate Picking'),
                            tag: 'validate_wh_ops',
                            target: 'fullscreen',
                        }, {clear_breadcrumbs: true}); 
                    }
                    else if (Session.pickings) {
                        self.do_action({
                            type: 'ir.actions.client',
                            name: _t('Validate Multiple Picking'),
                            tag: 'multiple_validate_wh_ops',
                            target: 'fullscreen',
                        }, {clear_breadcrumbs: true}); 
                    }
                    //window.history.back();
                });
            },
            "click .back": function() {
                var self = this;
                Session.lot_id = undefined;
                if (Session.picking) {
                    self.do_action({
                        type: 'ir.actions.client',
                        name: _t('Validate Picking'),
                        tag: 'validate_wh_ops',
                        target: 'fullscreen',
                    }, {clear_breadcrumbs: true}); 
                }
                else if (Session.pickings) {
                    self.do_action({
                        type: 'ir.actions.client',
                        name: _t('Validate Multiple Picking'),
                        tag: 'multiple_validate_wh_ops',
                        target: 'fullscreen',
                    }, {clear_breadcrumbs: true}); 
                }

                //window.history.back();
            },
            "click .selected_lot": function(e) {
                var self = this;
                e.preventDefault();
                var m = new Date();
                var dateString =
                    m.getUTCFullYear() + "-" +
                    ("0" + (m.getUTCMonth()+1)).slice(-2) + "-"+
                    ("0" + m.getUTCDate()).slice(-2) + " " +
                    ("0" + m.getUTCHours()).slice(-2) + ":" +
                    ("0" + m.getUTCMinutes()).slice(-2) + ":" +
                    ("0" + m.getUTCSeconds()).slice(-2);
                var domain = [['product_id','=',self.line.product_id['id']],['expiration_date','>',dateString]];
                this.do_action('inventory_log.only_view_lot_kanban_action',{
                    additional_context: {
                        domain: domain,
                    },/*
                    clear_breadcrumbs: true*/
                });
            },
            "keypress #done_integer_input": function(e) {
                return e.charCode >= 48 && e.charCode <= 57
            },
            "keypress #done_float_input": function(e) {
                return (e.charCode >= 48 && e.charCode <= 57) || e.charCode == 46
            },
        },
        start: async function () {
            
            var self = this;
            var done = 0;
            this._super();
            Session.current_model = "stock.move.line";
            this._rpc({
                model:  Session.current_model,
                method: 'read_with_lot',
                args: [[parseInt(self.line_id)],Session.lot_id],
            })
            .then(function (line) {
                self.line = line[0];
                var not_read = true;
                var create_lot = false;
                Session.line = self.line;
                if (self.codes.qty) {
                    done = self.codes.qty;
                }
                if (self.codes.lote) {
                    var existent_lot = false;
                    self.line.lot_ids.forEach(function(l) {
                        if (l.name === self.codes.lote) {
                            existent_lot = { name: l.name, id: l.id, expiration_date: l.expiration_date};
                        }
                    });
                    if (!existent_lot && Session.picking_type_code === 'incoming') {
                        var expiration_date = false;
                        if (self.codes.expiration_date) {
                            var date_string = self.codes.expiration_date.toString()
                            expiration_date = date_string;
                            $("#expiration_date").val(expiration_date)
                        }
                        create_lot = true;
                    }
                    else if (existent_lot) {
                        $('body').removeClass('modal-open');
                        $('.modal-backdrop').remove();
                        self.line.current_lot = existent_lot;
                         
                    }
                    else {
                        $('body').removeClass('modal-open');
                        $('.modal-backdrop').remove();
                        Session.line = self.line;
                    }
                }
                else {
                    not_read = false;
                    Session.line = self.line;
                    if (self.line.lot_id  && !self.line.current_lot) {
                        self.line.current_lot = {
                            'id': self.line.lot_id.id,
                            'name': self.line.lot_id.name,
                            'expiration_date': self.line.lot_id.expiration_date
                        };
                    }
                }
                if (!self.line.current_lot) {
                    self.line.current_lot = {
                        'id': -1,
                        'name': "",
                        'expiration_date':""
                    }; 
                    /*if (self.line.lot_ids.length > 0) {
                        self.line.current_lot = {
                            'id': self.line.lot_ids[0].id,
                            'name': self.line.lot_ids[0].name,
                            'expiration_date':self.line.lot_ids[0].expiration_date
                        }; 
                    }
                    else {
                        self.line.current_lot = {
                            'id': -1,
                            'name': "",
                            'expiration_date':""
                        }; 
                    }*/
                }
                //Check quality
                var message = ""
                var quality_check = true
                var failed_expiration = false
                var overdue_days = 0
                if (Session.company_settings.quality_control_group && Session.line.product_tracking == 'lot' && self.line.product_id['expiration_time'] != 0)
                    if (self.line.current_lot && self.line.current_lot.expiration_date) {
                        var lot_date = new Date(self.line.current_lot.expiration_date.split(' ')[0]);
                        var today = new Date();
                        var dd = String(today.getDate()).padStart(2, '0');
                        var mm = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
                        var yyyy = today.getFullYear();
                        today = yyyy+'-'+mm+'-'+dd;
                        var todayDate = new Date(today);
                        var diffTime = Math.abs(todayDate - lot_date);
                        var diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
                        var productLifeTime = self.line.product_id['expiration_time']
                        var productDays = new Date(todayDate.getTime()+(productLifeTime * 24 * 60 * 60 * 1000));
                        if (lot_date <= todayDate) {
                            failed_expiration = true
                            overdue_days = Math.abs(Math.ceil((productDays - lot_date) / (1000 * 60 * 60 * 24)))
                            quality_check = false
                            message = "There is not enough life date" 
                        }
                        else {
                            if (diffDays < self.line.product_id['expiration_time']) {
                                failed_expiration = true
                                overdue_days = Math.abs(Math.ceil((productDays - lot_date) / (1000 * 60 * 60 * 24)))
                                quality_check = false
                                message = "There is not enough life date"
                            } 
                        }
                    } else if (self.line.current_lot && !self.line.current_lot.expiration_date) {
                        failed_expiration = true
                        quality_check = false
                        message = "There is no life date" 
                    }
                self.updateQualityCheckRelatedParams(self, failed_expiration, overdue_days, self.line.correct_state_of_product, quality_check, message)
                $('body').removeClass('modal-open');
                $('.modal-backdrop').remove();
                self.$el.html( QWeb.render("ShowMoveLine", {line: self.line, options: self.conf,type:Session.picking_type_code, done:done,not_read: not_read, is_in_group:Session.company_settings.quality_control_group}));    
                if (create_lot) {
                    $("#expiration_date").val(expiration_date)
                    $(".lot_name").val(self.codes['lote'])
                    $("#myModal").modal('toggle')
                }
                $(".bad_quality_description_div").hide();
            });
            
        },
        init: function(parent, action) {
            var self = this;
            this._super.apply(this, arguments);
            this.line_id = action.move_line_id || false;
            Session.line_id = this.line_id;
            this.codes = action.codes || false;
        },
        parseQuantity(stringQty) {
            if (Session.line.product_id.measure_type == 'unit')
                return parseInt(stringQty)
            else {
                let integer = parseInt(stringQty);
                let decimalPointerIndex = stringQty.search(/[,\.]/)
                let decimal = stringQty.substring(decimalPointerIndex + 1, decimalPointerIndex + 4)
                return parseFloat(integer + '.' + decimal.match(/\d+/)[0])
            }
        },
        updateQualityCheckRelatedParams(self, failed_expiration, overdue_days, correct_state_of_product, quality_check, message) {
            self.line.failed_expiration = failed_expiration
            self.line.overdue_days = overdue_days
            self.line.correct_state_of_product = correct_state_of_product
            if (self.line.product_tracking != 'none' && self.line.product_tracking != 'serial' && Session.company_settings.quality_control_group && self.line.product_id.expiration_time != 0) {
                self.line.quality_check = quality_check
                self.line.reason_quality = message
            }
        },
    });




    core.action_registry.add('move_line', MoveLine);

    return MoveLine
    
});
