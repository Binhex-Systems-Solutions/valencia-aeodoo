// START odoo module encapsulation
odoo.define('inventory_log.multiple_validate_wh_ops', function (require) {
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
            "click .back": function() {
                var self = this;
                Session.lot_id = undefined;
                console.log("Back picking ",Session.picking)
                console.log("Back pickings ",Session.pickings)
                this.do_action({
                    type: 'ir.actions.client',
                    name: _t('Picking Lines'),
                    tag: 'picking_lines',
                    target: 'fullscreen',
                    date: Session.date,
                    filter: Session.filter,
                    warehouse: Session.warehouse,
                    zones: Session.selected_badges,
                }, {clear_breadcrumbs: true}); 
            },
            "click .done": function(e) {
                $('#modal2').modal('toggle');
                Session.move_line = $(e.currentTarget).attr('class').split(/line_/)[1].split(' ')[0];
            }, 
            "click .validate": function(e) {
                var self = this;
                var msg = ""
                $(".force_validate").prop('disabled', false);
                msg += _t("<p>If you have processed less than what was initially planned.</p><br/><div class='form-check'><input class='form-check-input' type='checkbox' onclick=document.getElementById('b_order').setAttribute('value',document.getElementById('b_order').value*-1) value='-1' id='b_order'/><label class='form-check-label' for='flexCheckDefault'>Create BackOrder</label></div>");
                $(".modal-title").html(_t("Warning"));
                $(".modal-body").html(msg);
                $(".modal").modal('show')
                return;
            },
            "click .force_validate": function(e) {
                var self = this;
                var date = false;
                if ($("#b_order").val()){
                    self.b_order = $("#b_order").val();
                }else self.b_order = false;
                $('body').removeClass('modal-open');
                $('.modal-backdrop').remove();
                console.log("goint to validate multiple")
                this._rpc({
                    model: 'stock.warehouse',
                    method: 'validate_pickings',
                    args: [Session.pickings,self.b_order, Session.uid],
                }).then(function(res){
                    Session.line_pick = undefined;   
                    Session.dest = undefined;   
                    Session.respon = undefined;
                    Session.pickings = undefined;
                    console.log("hech")
                    core.bus.off('barcode_scanned', self, self._onBarcodeScanned);
                    if(Session.date){
                        date = Session.date
                    }  
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
                });
                $('body').removeClass('modal-open');
                $('.modal-backdrop').remove();
            },    
            "click .undo": function(e) {
                var self = this;
                $('body').removeClass('modal-open');
                $('.modal-backdrop').remove();
                this._rpc({
                    model: 'stock.move.line',
                    method: 'erase_done',
                    args: [[parseInt(Session.move_line)]],
                })
                .then(function (line) {
                    self._rpc({
                        model: 'stock.warehouse',
                        method: 'get_pickings',
                        args: [Session.pickings,Session.location_id,Session.picking_type],
                    }).then(function(result){
                        console.log("Picking result ",result)
                        if (result.lines.length > 0){
                            var barcodes = {}
                            var product_lines = {}
                            Session.zones = result.zones
        
                            result.lines.forEach(function(p) {    
                                console.log("p ",p)
                                barcodes = {...barcodes, ...p.barcodes}; 
                                var line_pick = {}
                                var lines_done = {}
                                console.log("Barcodes ",barcodes)
        
                                console.log("p.lines ",p.lines)
                                p.lines.forEach(function(l) {
                                    if(l.qty_done != l.product_uom_qty && l.product_uom_qty!=0 && l.qty_done < l.product_uom_qty){
                                        line_pick[l.id] = {name:l.product_id[1], product_uom_qty:l.product_uom_qty, quantity_done: l.qty_done,reserved_availability:l.product_uom_qty,lot_id:l.lot_id};
                                    }
                                    if(l.qty_done > 0){
                                        lines_done[l.id] = {name:l.product_id[1], product_uom_qty:l.product_uom_qty, quantity_done: l.qty_done,lot_id:l.lot_id};
                                    }
                                });
                                product_lines[p.product_id.name] = {lines_done:lines_done,lines:line_pick}
                                //console.log("Stock line_pick ",line_pick)
                                //console.log("Stock lines_done ",lines_done)
                            });
                            //console.log("product_lines ",product_lines)
                            core.bus.on('barcode_scanned', self, self._onBarcodeScanned);
                                     
                        }
        
                        else {
                            self.do_action({
                                type: 'ir.actions.client',
                                name: _t('Warehouse Operations'),
                                tag: 'wh_ops',
                                target: 'fullscreen',
                            }, {clear_breadcrumbs: true}); 
                        }
    
                        self.$el.html( QWeb.render("MultipleValidateWHOpsXML", {pickings: result.pickings, options: result.conf,product_lines:product_lines}))
                    })
                }); 
            },
        },
        start: async function () {
            this._super();
            Session.counter = -1;
            var self = this;
            if (!Session.pickings) {
                this.do_action('inventory_log.main_screen',{
                        clear_breadcrumbs: true
                    });
                return;
            }
            this.canvas = new canvas();
            var picking_ids = []
            picking_ids = Session.pickings;
            console.log("pickings size ",picking_ids.length)
            this._rpc({
                    model: 'stock.warehouse',
                    method: 'get_pickings',
                    args: [picking_ids,Session.location_id,Session.picking_type],
                }).then(function(result){
                    console.log("Picking result ",result)
                    if (result.lines.length > 0){
                        var product_lines = {}
                        Session.zones = result.zones
                        Session.barcodes = result.barcodes;
                        console.log("Session.barcodes ",Session.barcodes)
                        result.lines.forEach(function(p) {    
                            //barcodes = {...barcodes, ...p.barcodes}; 
                            var line_pick = {}
                            var lines_done = {}
    
                            p.lines.forEach(function(l) {
                                if(l.qty_done != l.product_uom_qty && l.product_uom_qty!=0 && l.qty_done < l.product_uom_qty){
                                    line_pick[l.id] = {name:l.product_id[1], product_uom_qty:l.product_uom_qty, quantity_done: l.qty_done,reserved_availability:l.product_uom_qty,lot_id:l.lot_id};
                                }
                                if(l.qty_done > 0){
                                    lines_done[l.id] = {name:l.product_id[1], product_uom_qty:l.product_uom_qty, quantity_done: l.qty_done,lot_id:l.lot_id};
                                }
                            });
                            product_lines[p.product_id.name] = {lines_done:lines_done,lines:line_pick}
                        });
                        //core.bus.on('barcode_scanned', self, self._onBarcodeScanned);
                                 
                    }
    
                    else {
                        self.do_action({
                            type: 'ir.actions.client',
                            name: _t('Warehouse Operations'),
                            tag: 'wh_ops',
                            target: 'fullscreen',
                        }, {clear_breadcrumbs: true}); 
                    }
                    core.bus.on('barcode_scanned', self, self._onBarcodeScanned);
                    self.$el.html( QWeb.render("MultipleValidateWHOpsXML", {pickings: result.pickings, options: result.conf,product_lines:product_lines}))
                })
        },
        _onBarcodeScanned: function(barcode) {
            var self = this;
            alert(barcode)
            core.bus.off('barcode_scanned', this, this._onBarcodeScanned);
            var codes = self.parseBarcode(barcode)
            var move_line_id = false;
            var found = false;
            console.log("Session.barcodes ",Session.barcodes)
            //Session.barcodes.forEach(function(l) {
            for (const key in Session.barcodes) {
                if(parseInt(Session.barcodes[key].product_id) === codes['product_id']){
                    if(!found){
                        found = Session.barcodes[key].line;
                    }
                    if(codes['lote'] && codes['lote'] === Session.barcodes[key].lot){
                        found = Session.barcodes[key].line;
                    }
                }
            };
            if (found) {
                move_line_id = found
                if(move_line_id){
                    self.do_action({
                        type: 'ir.actions.client',
                        name: _t('Move Line'),
                        tag: 'move_line',
                        target: 'fullscreen',
                        move_line_id: move_line_id,
                        codes: codes
                    }, {clear_breadcrumbs: true}); 
                }
                else{
                    alert(_t("Barcode don't match any product in line"));
                    core.bus.on('barcode_scanned', self, self._onBarcodeScanned);
                }
            }
            else{
                alert(_t("Barcode don't match any product in line"));
                core.bus.on('barcode_scanned', self, self._onBarcodeScanned);
            }
        },
        check_lines: function() {
            var result = 0;
            // 0 = All Rigth
            // 1 = Product Excess 
            // 2 = Less Product than expected (BackOrder?)
            // 3 = All of before
    
            Object.keys(Session.line_pick).forEach(function(k){
                if (result == 3) return;
    
                if (Session.line_pick[k].product_uom_qty > Session.line_pick[k].quantity_done && result != 2)
                    result += 2;
                if (Session.line_pick[k].product_uom_qty < Session.line_pick[k].quantity_done && result != 1)
                    result += 1;
            });
            return result;
        },
        parseBarcode: function(barcode) {
            //let barcode = '02084567890123450134567891234567370112\F1089B237896541236547891512345';
            //         (01)18410532085137(15)221117(10)109475451(91)4680
            const regexp = /(01|10|15|17|37|91)/g;
            let exists = false
            let qty = "";
            let lote = "";
            let product_id = "";
            let proveedor = "";
            var expiration_date = "";
            let IA = 0
            let indexModified = false;
            let startIndex = 0
            let endIndex = 2
            let lastIA = ''
               //IA: max longitud
            let dictIA = {
                '00': 20, // fija
                '01': 16, // fija
                '02': 16, // fija
                '10': 22, // hasta 22 ---- lote
                '15': 8,  // fija
                '17': 8,  // fija
                '90': 30, // hasta 30
                '91': 6,  // fija 
                '37': 10, // hasta 10 ---- qty
            }
    
            if (barcode.search(regexp) != -1) 
                exists = true
            //IA === '37'  || IA === '10'
            while (exists && startIndex < barcode.length) {
                IA = barcode.substring(startIndex, endIndex);
                if (IA === '' || !(IA in dictIA)) {
                    exists = false
                } else {
                    let codeSize = dictIA[IA];
                    if (IA === '01' || IA === '02' || IA === '37'  || IA === '10' || IA === '15'|| IA === '17') {
                        let tempCode = barcode.substring(endIndex, startIndex + codeSize)
                        console.log('tempCode' , tempCode)
                        if (tempCode.search(' ') != -1) {
                            let cut = tempCode.indexOf(' ')
                            startIndex = startIndex + cut + 3
                            endIndex = endIndex + cut + 3
                            tempCode = tempCode.substring(0, cut)
                            indexModified = true;
                        }
                        if( IA === '37'  || IA === '10' ) {
                            if (tempCode.search(/91\d{4}$/) != -1) {
                                proveedor = tempCode.substring(tempCode.length - 4, tempCode.length)
                                tempCode = tempCode.substring(0, tempCode.length - 6)
                            }
                        }
                        switch(IA) {
                            case '01':
                                product_id = tempCode
                                break
                            case '02':
                                product_id = tempCode
                                break
                            case '10':
                                lote = tempCode.replace(/[^A-Za-z0-9\-\/\.]/g,'')
                                break
                            case '17':
                                expiration_date = tempCode
                                break
                            case '15':
                                expiration_date = tempCode
                                break
                            case '37':
                                qty = tempCode
                                break
                            case '91':
                                proveedor = tempCode
                        }
                    }
                    if(!indexModified) {
                        startIndex += codeSize
                        endIndex = 2 + startIndex
                    }
                    indexModified = false;
    
                    if(qty != '' && lote != '')
                        exists = falses
                }
            }
            console.log("parsed barcode ",parseInt(product_id))
            console.log("parsed lote ",lote)
            return {'qty': parseInt(qty), 'lote': lote, 'product_id':  parseInt(product_id), 'expiration_date':expiration_date}
        },
    })
    core.action_registry.add('multiple_validate_wh_ops', ValidateWHOps);

    return ValidateWHOps
    
    });
    // END Odoo module encapsulation