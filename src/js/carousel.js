(function () {
    var Carousel = new this.Component(function (setting) {
        var priv = { $node: $(this.node), $items: $() }, This = this;        
        var val = {}, navigation, panigation, items;
        priv.$items = priv.$node.find(setting.selector.items);

        this
            .action('change', 'next', 'prev', 'first', 'last')
            .observer(function () {
                items = priv.$items.children();
            })
            .module({
                navigation: [function () {
                    if (this.node.ctComs.navigation) return this.node.ctComs.navigation;
                    var node = priv.$node.find(setting.selector.navigation).get(0);
                    return node && node.ctComs && node.ctComs.navigation;
                }, function () {
                    var nav = this.connect(This, 'next', 'prev', 'first', 'last');
                }],
                panigation: [function () {
                    if (this.node.ctComs.panigation) return this.node.ctComs.panigation;
                    var node = priv.$node.find(setting.selector.panigation).get(0);
                    return node && node.ctComs && node.ctComs.panigation;
                }, function () {
                    This.connect(this, 'change');
                }]
            })
            .bind('change', function (e, index) {
                console.log(index)
            });

    }, 'carousel'), CT = this, $ = this.query;
    Carousel.setting({
        selector: {
            navigation: '>[navigation]',
            panigation: '>[panigation]',
            items: '>[items]'
        }
    });
}).call(CodingTime);