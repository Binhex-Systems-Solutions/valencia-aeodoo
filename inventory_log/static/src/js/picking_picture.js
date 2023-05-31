odoo.define('inventory_log.picking_picture', function (require) {
    "use strict";

    var AbstractAction = require('web.AbstractAction');
    var ajax = require('web.ajax');
    var core = require('web.core');    
    var Session = require('web.session');
    var _t = core._t;
    
    var QWeb = core.qweb;
    var img_data_base64 = null;

    var PickingPicture = AbstractAction.extend({
        events: {
            "click .back": function() {
                var self = this;
                Session.lot_id = undefined;
                console.log("Back picking ",Session.picking)
                if (Session.picking) {
                    console.log("Back from picture")
                    self.do_action({
                        type: 'ir.actions.client',
                        name: _t('Validate Picking'),
                        tag: 'validate_wh_ops',
                        target: 'fullscreen',
                    }, {clear_breadcrumbs: true}); 
                }
            },
            "click .take_pic": function(e) {
                e.preventDefault();
                let img_data;
                var self = this;
                if (Webcam.live == true) {
                    Webcam.snap( function(data) {
                        img_data = data;
                        });
                    img_data_base64 = img_data.split(',')[1]
                    this._rpc({
                        model: 'stock.picking',
                        method: 'add_image',
                        args: [[Session.picking.id], img_data_base64 ],
                    }).then(function() {
                        let preview = $('#preview_image')
                        preview.attr("src", 'data:image/png;base64,' + img_data_base64)
                        preview.show()
                        /*self.deattach_webcam()
                        if (Session.picking) {  
                            Session.take_pic = false
                            self.do_action({
                                type: 'ir.actions.client',
                                name: _t('Picking Picture'),
                                tag: 'picking_picture',
                                target: 'fullscreen',
                            }, {clear_breadcrumbs: true});
                        }*/
                    })
                }
            },
            "click .go_to_take_pic": function(e) {
                e.preventDefault();
                Session.take_pic = true
                this.do_action({
                    type: 'ir.actions.client',
                    name: _t('Picking Picture'),
                    tag: 'picking_picture',
                    target: 'fullscreen',
                }, {clear_breadcrumbs: true});
            },
            "click .delete_img": function(e) {
                e.preventDefault();
                Session.take_pic = false
                $(e.currentTarget).parent().hide()
                this._rpc({
                    model: 'stock.picking',
                    method: 'delete_img',
                    args: [[Session.picking.id], $(e.currentTarget).prev().attr("id")],
                })
            },
            "click #preview_image": function(e) {
                e.preventDefault();
                Session.take_pic = false
                this.deattach_webcam()
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
            var self = this;
            let pic;
            //console.log('picture', Session)
            if (Session.picking)
                self._rpc({
                    model: 'stock.picking',
                    method: 'get_images_info',
                    args: [[Session.picking.id]],
                }).then(function(picking) {
                    console.log('get_images_info', picking)
                    if (!Session.take_pic && picking && picking.image_ids != {}) {
                        for (const key in picking.image_ids) {
                            picking.image_ids[key] = 'data:image/png;base64,' + picking.image_ids[key]
                        }
                        self.$el.html( QWeb.render("PickingPictureXML", {picking_name: picking.name, take_pic: false, pictures: picking.image_ids, img_preview: ""}));
                    } else {
                        let preview = ""
                        if (Object.keys(picking.image_ids).length != 0)
                            preview = 'data:image/png;base64,' + picking.image_ids[Object.keys(picking.image_ids)[Object.keys(picking.image_ids).length - 1]]
                        self.$el.html( QWeb.render("PickingPictureXML", {picking_name: picking.name, take_pic: true, pictures: {}, img_preview: preview}));
                        if (Object.keys(picking.image_ids).length != 0)
                            $('#preview_image').show()
                        self.attach_webcam();
                    }
                })
        },
        attach_webcam: function () {
            if (Webcam.live == false) 
                Webcam.attach("#live_webcam");
        },
    
        deattach_webcam: function () {
            Webcam.reset();
            this.$('.live_webcam').css("display","none");
        },
    
        destroy: function () {
            this.deattach_webcam();
            this._super();
        },
    });

    core.action_registry.add('picking_picture', PickingPicture);

    return PickingPicture

});