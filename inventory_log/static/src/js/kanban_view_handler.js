odoo.define('inventory_log.kanban_view_handler', function(require) {
"use strict";

var KanbanRecord = require('web.KanbanRecord');
var Session = require('web.session');
var core = require('web.core');
var QWeb = core.qweb;
var _t = core._t;

KanbanRecord.include({

    /**
     * @override
     * @private
     */
    _openRecord: function () {
        if (this.modelName === 'product.product' && this.$el.parents('.o_product_selection').length) {
            if (Session.inv_orig){
                var self = this
                if (!Session.lines[Session.inv_orig.id])
                    Session.lines[Session.inv_orig.id] = {'name':Session.inv_orig.display_name}
                self._rpc({
                    model: 'stock.inventory',
                    method: 'get_tracking',
                    args: [[], self.record.id.raw_value],
                }).then(function(res_prod_tracking){
                    if (!Session.lines[Session.inv_orig.id][self.record.id.raw_value]){
                        Session.lines[Session.inv_orig.id][self.record.id.raw_value] = {}
                        Session.lines[Session.inv_orig.id][self.record.id.raw_value][-1] = {name:self.record.name.raw_value,qty: 1,lot_id:{id:-1,expiration_date:"",name:""},uom_id:self.record.uom_id.raw_value, tracking:res_prod_tracking };
                    }
                    else if(Session.lines[Session.inv_orig.id][self.record.id.raw_value] && Session.lines[Session.inv_orig.id][self.record.id.raw_value][-1]){
                        Session.lines[Session.inv_orig.id][self.record.id.raw_value][-1] = {name:self.record.name.raw_value,qty: 1,lot_id:{id:-1,expiration_date:"",name:""},uom_id:self.record.uom_id.raw_value, tracking:res_prod_tracking}; 
                    }
                        /*else
                        Session.lines[Session.inv_orig.id][this.record.id.raw_value].qty += 1;*/
                    
                    self.do_action("inventory_log.inv_upd");
                });
            }
            else{
                this.record.id.raw_value,this.record.name.raw_value
            if (!Session.product_list[this.record.id.raw_value]){
                Session.product_list[this.record.id.raw_value] = 
                {0:[this.record.name.raw_value, 1, this.record.standard_price.raw_value, this.record.tracking.raw_value]}
            }
            else if(!Session.product_list[this.record.id.raw_value][0]){
                Session.product_list[this.record.id.raw_value][0] = [this.record.name.raw_value, 1, this.record.standard_price.raw_value, this.record.tracking.raw_value]
            }
            else{
                Session.product_list[this.record.id.raw_value][0][1] += 1;
            }


             if (!this.state.context.n_action)
                this.do_action("inventory_log.op_type_select");
            else
                this.do_action(this.state.context.n_action);
            }
            
        } else if (this.modelName === 'res.partner' && this.$el.parents('.o_supplier_selection').length) {

            Session.supplier = {"id": this.record.id.raw_value, 'name': this.record.display_name.raw_value};

            this.do_action("inventory_log.purchases");
            
        } else if (this.modelName === 'stock.picking' && this.$el.parents('.o_picking_selection').length) {
            Session.picking = {"id": this.record.id.raw_value};
            this.do_action("inventory_log.validate_wh_ops");
            
        }
        else if (this.modelName === 'stock.warehouse' && this.$el.parents('.o_warehouse_kanban').length) {
            Session.warehouse = this.record.id.raw_value;
            this.do_action("inventory_log.date_range");
            
        }
        else if (this.modelName === 'stock.production.lot' && this.$el.parents('.o_lot_kanban2').length) {
            if (!Session.product_list[this.record.product_id.raw_value][this.record.id.raw_value]){
                if(Session.product_list[this.record.product_id.raw_value]['0']){
                    var temp = Session.product_list[this.record.product_id.raw_value]['0'];
                    delete Session.product_list[this.record.product_id.raw_value]['0'];
                    temp.push(this.record.name.raw_value);
                    Session.product_list[this.record.product_id.raw_value][this.record.id.raw_value] = temp;
                }
                else{
                }
            }
            else{
                Session.product_list[this.record.product_id.raw_value][this.record.id.raw_value][1] += 1;
            }
            this.do_action({
                type: 'ir.actions.client',
                name: _t('Internal Transfer'),
                tag: 'type_selection',
                target: 'fullscreen',
            }, {clear_breadcrumbs: true}); 
        }
        else if (this.modelName === 'stock.production.lot' && this.$el.parents('.o_lot_kanban').length) {
            Session.lot_id = this.record.id.raw_value;
            if(Session.update_inv){
                Session.changed_lot = {
                    'id': this.record.id.raw_value,
                    'name':this.record.name.raw_value,
                    'expiration_date':this.record.expiration_date.raw_value,
                }
                this.do_action({
                    type: 'ir.actions.client',
                    name: _t('Inventory'),
                    tag: 'inv_upd',
                    target: 'fullscreen',
                    a_type: Session.a_type,
                }, {clear_breadcrumbs: true}); 
            }
            else{
                this.do_action({
                    type: 'ir.actions.client',
                    name: _t('Move Line'),
                    tag: 'move_line',
                    target: 'fullscreen',
                    move_line_id: Session.line_id
                }, {clear_breadcrumbs: true});     
            }
        }
        else if (this.modelName === 'stock.warehouse' && this.$el.parents('.o_warehouse_selection').length) {
            if (this.state.context.type == "orig"){
            	Session.orig = {"id": this.record.id.raw_value, 'name': this.record.name.raw_value, 'display_name': this.record.display_name.raw_value};
            } else {
            	Session.dest = {"id": this.record.id.raw_value, 'name': this.record.name.raw_value, 'display_name': this.record.display_name.raw_value};
            }
            if (!this.state.context.n_action)
                this.do_action("inventory_log.op_type_select");
            else
                this.do_action(this.state.context.n_action);
            
        } else if (this.modelName === 'stock.location' && this.$el.parents('.o_location_selection').length) {
            if (this.state.context.type == "orig"){
                Session.orig = {"id": this.record.id.raw_value, 'name': this.record.name.raw_value, 'display_name': this.record.display_name.raw_value};
            } else {
                Session.dest = {"id": this.record.id.raw_value, 'name': this.record.name.raw_value, 'display_name': this.record.display_name.raw_value};
            }
             if (!this.state.context.n_action)
                this.do_action("inventory_log.op_type_select");
            else
                this.do_action(this.state.context.n_action);
            
        } else if (this.modelName === 'hr.employee' && this.$el.parents('.o_respon_selection').length) {

            Session.respon = {"id": this.record.id.raw_value, 'name': this.record.display_name.raw_value};

            if (!this.state.context.n_action)
                this.do_action("inventory_log.op_type_select");
            else
                this.do_action(this.state.context.n_action);
        }
        else {
            this._super.apply(this, arguments);
        }
    }
});

});