(function () {
    var Pursued = new this.Component(function (setting) {
        var
            $node = $(this.node), This = this,
            shadow = $node.find(setting.shadow),
            applyTo = function (node) {
                if (!node) return node;
                var size = {
                    width: node.offsetWidth,
                    height: node.offsetHeight
                }
                node = $(node);

                var pos = node.position();

                shadow.css({
                    width: node.outerWidth(),
                    height: node.outerHeight(),
                    left: pos.left + size.width / 2,
                    top: pos.top + size.height / 2
                });
                val.pursued = node;
            };
        var val = {
            following: $(),
            attaching: $(),
            pursued: $()
        };
        this
            .action('attach', 'follow', 'callback')
            .bind('attach', function (e, node) {
                if (val.attaching.get(0) === node) return false;
                val.attaching = $(node);
                applyTo(node);
            })
            .bind('follow', function (e, node) {
                if (val.following.get(0) === node) return false;
                val.following = $(node);
                applyTo(node);
            })
            .bind('callback', function (e, node) {
                if (val.pursued.get(0) === node) return false;
                applyTo(node);
            })
            .extend({
                shadow: shadow,
                following: function () { return val.following; },
                attaching: function () { return val.attaching; }
            });

        shadow.css({
            position: 'absolute',
            width: 0, height: 0,
            display: 'block',
            transform: 'translate(-50%,-50%)'
        });

        $node
            .on(setting.attachOn, setting.follow, function (e) {
                This.attach(this);
            })
            .on(setting.followOn, setting.follow, function (e) {
                This.follow(this);
            })
            .on('mouseleave', setting.follow, function () {
                This.callback(val.attaching.get(0));
            });
    }, 'pursued').setting({
        shadow: '>[pursued-shadow]',
        follow: 'pursued',
        followOn: 'mouseenter',
        attachOn: 'click'
    });
}).call(CodingTime)