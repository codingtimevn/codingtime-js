(function () {
    var Panigation = new this.Component(function (setting) {
        var val = {
            index: -1,
            active: true
        }, This = this;
        var priv = { $node: $(this.node) };
        priv.$list = priv.$node.find(setting.selector.items);
        this
            .observer(function () {
                priv.$items = priv.$list.children();
                return arguments.callee;
            })
            .action('change')
            .const({
                index: function () { return index }
            })
            .module('navigation', setting.selector.navigation, function () {
                var mod = this.bind('next', function () {
                    This.change(val.index + 1);
                }).bind('prev', function () {
                    This.change(val.index - 1);
                });
                This.bind('change', function (e, index) {
                    mod.first(val.index == 0);
                    mod.last(val.index == priv.$items.length - 1);
                    return arguments.callee;
                }(undefined, val.index));
            })
            .bind('change', function (e, toIndex) {
                var index = toIndex;
                if (!val.active || val.index == index) return false;                    
                if (setting.loop) {
                    index = index % priv.$items.length;
                    index = index < 0 ? priv.$items.length + index : index;
                } else if (index < 0 || index > priv.$items.length - 1) return false;
                if (index != toIndex) return this.change(index), false;
                
                priv.$items.eq(val.index).removeAttr('active');
                priv.$items.eq(val.index = index).attr('active', '');
                priv.$node.attr('active-index', index);
            }).bind('active', function (e, active) {
                if (val.active === active) return false;
                val.active = active;
            });
        priv.$node.on('click', setting.selector.items + '>*', function () {
            This.change($(this).index())
        });

        setTimeout(function () {
            This.change(parseInt(setting.active))
        });
    }, 'panigation'), CT = this, $ = this.query;
    Panigation.setting({
        active: 0,
        selector: {
            navigation: '>[navigation]',
            items: '>[items]'
        }
    });
}).call(CodingTime);