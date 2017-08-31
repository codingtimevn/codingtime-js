(function () {

    var Nav = new this.Component(function (setting) {

        var This = this,
            state = { first: true, last: true },
            $node = $(this.node);

        this.action('next', 'prev','first','last');
        this.const('state', function () { return { first: state.first, last: state.last } });
        this
            .bind('first', function (e, val) {
                if (state.first == val) return false;
                if (state.first = val) {
                    $node.attr('first','');
                } else {
                    $node.removeAttr('first');
                }
            }).bind('last', function (e, val) {
                if (state.last == val) return false;
                if (state.last = val) {
                    $node.attr('last', '');
                } else {
                    $node.removeAttr('last');
                }
            }).bind('next', function (e) {
                
            }).bind('prev', function () {
                
            });

        $node
            .on('click', setting.next, function () { return This.next(), false })
            .on('click', setting.prev, function () { return This.prev(), false });        

        
    }, 'navigation'), $ = this.query;

    Nav.setting({
        next: '[next]',
        prev: '[prev]'
    });
}).call(CodingTime);