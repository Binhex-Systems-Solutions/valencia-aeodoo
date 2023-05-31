// START odoo module encapsulation
odoo.define('inventory_log.end_screen_p', function (require) {
"use strict";

var AbstractAction = require('web.AbstractAction');
var ajax = require('web.ajax');
var core = require('web.core');

var Session = require('web.session');
var _t = core._t;

var QWeb = core.qweb;

var EndScreenP = AbstractAction.extend({
    events: {
        "click .button_dismiss": function(e) {
            this.do_action('inventory_log.main_screen');
        },
    },
    start: async function () {
        this._super();
        Session.product_list = {};
        Session.supplier = undefined;
        Session.dest = undefined;
        Session.refsup = undefined;
        this.$el.html( await QWeb.render("EndScreenXML"));
    },
});

core.action_registry.add('end_screen_p', EndScreenP);

return EndScreenP;

});