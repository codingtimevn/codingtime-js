(function () {
    var CT = this, fixeds = [], win = window, doc = document, $ = this.query, prefix = this.setting.prefix;


    var Fixed = new this.Component(function (setting) {
        if (!Fixed.create(this, setting)) return false;
        this.action('layout', 'reset', 'remove', 'enable', 'repair');
        this.const({
            fixed: function () { return val.fixed }
        });
        this.extend({
            rect: { top: 0, left: 0, right: 0, bottom: 0 },
            bounds: { top: 0, left: 0, right: 0, bottom: 0 }
        });

        var This = this, body = doc.body;

        // private methods
        var priv = {
            panel: this.node.parentNode,
            child: this.node.children[0],
            $panel: $(this.node.parentNode),
            $scroll: $(this.node.parentNode),
            $node: $(this.node),
            $child: $(this.node.children[0]),

            layout: function () {
                var scrollTop = priv.panel.scrollTop;
                This.bounds.top = This.rect.top - priv.panel.bounds.top;
                var lastStatus = val.fixed;

                if (priv.panel.outRange) {
                    if (val.fixed !== -1) { val.fixed = -1; }
                } else if (scrollTop < this.bounds.top) {
                    if (val.fixed !== 0) { val.fixed = 0; }
                } else {
                    if (priv.scrollEvent &&
                        priv.scrollEvent.target !== priv.panel &&
                        priv.panel.bounds.top > 0) {
                        val.fixed = 2;
                        delete priv.scrollEvent;
                    } else {
                        val.fixed = 1;
                    }
                }
                if (lastStatus !== val.fixed) {
                    This.fire('status', [val.fixed]);
                }
            },
            scrollHandler: function (e) {
                priv.layout.call(This);
            },
            repairBoundsHandler: function (e) {
                priv.scrollEvent = e;
                for (var i = 0, j = priv.$scroll.length; i < j; i++) {
                    var scroll = priv.$scroll.get(i);
                    if (e.timeStamp === scroll.timeStamp || e.target === scroll) continue;
                    scroll.timeStamp = e.timeStamp;
                    scroll.bounds = scroll.getBoundingClientRect();
                    if (scroll.bounds.bottom < 0 || scroll.bounds.top > win.innerHeight) {
                        scroll.outRange = true;
                        break;
                    } else {
                        scroll.outRange = false;
                    }
                }
            },
            getScoll: function () {
                return this.$node.parents().filter(function () {
                    return this.scrollHeight > this.offsetHeight || this === body;
                });
            },
            unfixed: function () {
            },
            setfixed: function () {
            }
        }

        priv.$node.css({ display: 'block' });

        // vals
        var val = {
            fixed: 0,
            css: {
                node: priv.$node.attr('style') || '',
                child: priv.$child.attr('style') || ''
            }
        }

        this
            .bind('layout', function () { priv.layout.call(This) })
            .bind('repair', function () {

                priv.$node.attr('style', val.css.node);
                priv.$child.attr('style', val.css.child);
                /*
                this.rect = priv.$node.position();
                $.extend(this.rect, {
                    right: this.rect.left + this.node.offsetWidth,
                    bottom: this.rect.right + this.node.offsetHeight,
                    width: this.node.offsetWidth,
                    height: this.node.offsetHeight
                });
                */

                this.position = {
                    top: this.node.offsetTop,
                    left: this.node.offsetLeft
                }
                this.rect = {
                    top: this.node.offsetTop,
                    left: this.node.offsetLeft,
                    width: this.node.offsetWidth,
                    height: this.node.offsetHeight
                };

                priv.$scroll
                    .unbind('scroll', priv.repairBoundsHandler)
                    .unbind('scroll', priv.scrollHandler)
                    .each(function () { $(this).attr('style', this.initCss); });
                priv.$scroll = priv.getScoll()
                    .bind('scroll', priv.repairBoundsHandler)
                    .bind('scroll', priv.scrollHandler)
                    .each(function () {
                        var $this = $(this);
                        if (['absolute', 'relative'].indexOf($this.css('position')) > -1) {
                            This.rect.top += this.offsetLeft;
                            This.rect.left += this.offsetLeft;
                        }
                        return;
                        this.initCss = $this.attr('style');
                        $this.css('position', $this.css('position') != 'absolute' && 'relative');
                    });
                priv.panel = priv.$scroll.get(0);

                $.extend(this.rect, {
                    right: this.rect.left + this.rect.width,
                    bottom: this.rect.top + this.rect.height
                });

                console.log(this.rect);
                this.bounds = {
                    top: this.rect.top,
                    left: this.rect.left,
                    right: this.rect.right,
                    bottom: this.rect.bottom,
                    width: this.rect.width,
                    height: this.rect.height
                }



                //this.position = priv.$node.position();
            }).bind('status', function (e, status) {
                console.log(status)
                switch (status) {
                    case -1: return this.fire('outrange');
                    case 0: return this.fire('unfixed');
                    case 1: return this.fire('fixed');
                    case 2: return this.fire('moving');
                    case 3: return this.fire('avoid');
                }
            }).bind('outrange', function () {
                this.fire('unfixed');
            }).bind('unfixed', function () {
                priv.$node.attr('style', val.css.node).removeClass(prefix + 'fixed');
                priv.$child.attr('style', val.css.child);
            }).bind('fixed', function () {
                var pos = {
                    top: priv.panel.bounds.top,
                    left: priv.panel.bounds.left
                }

                pos.top = pos.top > 0 ? pos.top : 0;
                priv.$scroll.each(function () {

                });


                priv.$node.css({
                    width: This.rect.width,
                    height: This.rect.height
                }).addClass(prefix + 'fixed');

                priv.$child.css({
                    position: 'fixed',
                    width: priv.child.offsetWidth,
                    height: priv.child.offsetHeight
                }).css(pos);

            }).bind('moving', function () {
                var pos = {
                    top: 0,
                    left: 0
                }
                priv.$scroll.each(function () {
                    if (['absolute', 'relative'].indexOf($(this).css('position')) > -1) {
                        pos.top += this.scrollTop;
                    } else {
                        pos.top += this.offsetTop;
                    }
                });
                priv.$child.css({
                    position: 'absolute'
                }).css(pos);
            }).bind('avoid', {

            });


        $(win).resize(function () {
            This.repair();
        });
        This.repair();
        $(win).scroll(priv.repairBoundsHandler).scroll(priv.scrollHandler).scroll();
    }, 'fixed');
    Fixed.setting({
        space: 10,
        push: false,
        avoid: false
    });
    Fixed.action(['create']);
}).call(CodingTime);


