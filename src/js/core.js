(function ($) {
    this.CodingTime = this.CT = this.CodingTime || (function () {

        var
            win = window, doc = win.document, arr = [],
            valueFromString = function (str) {
                try {
                    eval('str = ' + str);
                } catch (e) { }
                return str;
            },
            configFromParams = function (params) {
                var obj = {};
                $.each(params, function (key, val) {
                    var keys = key.split('.'), child = obj;
                    while (keys.length > 1) {
                        key = keys.shift();
                        child = (child[key] = child[key] || {});
                    }
                    child[keys.shift()] = val;
                });
                return obj;
            }
            ;

        $.each([Array, Function, Function.prototype], function () {
            $.extend(this, {
                was: function (obj) { return obj instanceof this; }
            });
        });
        Object.was = function (obj) { return obj instanceof this && !Array.was(obj) }
        String.was = function (obj) { return typeof obj === 'string' }

        String.prototype.toProp = function () {
            return this.replace(/-([a-z])/g, function (match, key) {
                return key.toUpperCase()
            })
        }




        /********************************** Core *****************************************/
        var CT = function (setting) {
            $.extend(CT.setting, setting);
            prefix = setting.prefix || prefix;
        }, prefix = 'ct-';
        $.extend(CT, {
            Coms: {},
            setting: {
                prefix: 'ct-'
            },
            query: jQuery,
            nodeAttrs: function (node) {
                var attrs = {};
                $.each(node.attributes, function () {
                    attrs[this.nodeName] = valueFromString(this.value);
                });
                return attrs;
            },
            nodeParams: function (node) {
                var string = node.getAttribute(prefix.replace(/-$/i, ''));
                var params = {};
                if (string) {
                    try {
                        eval('params = ' + string);
                    } catch (e) {
                        var reg = /\w+[\w\d]*/i;
                        $.each(string.split(/ +|,/g).map(function (com) { return com.toProp() }).filter(function (com) {
                            if (reg.test(com)) return com;
                        }), function () {
                            params[this] = {};
                        });
                    };
                }
                
                
                    
                var reg = new RegExp('^' + prefix, 'i');
                $.each(CT.nodeAttrs(node), function (key, val) {
                    if (reg.test(key)) {
                        params[key.replace(reg, '').toProp()] = val;
                    }
                });
                return params;
            },
            nodeSetting: function (node) {
                var params = this.nodeParams(node);
                return configFromParams(params);
            },
            ready: function (fn) {
                doc.addEventListener('DOMContentLoaded', fn);
                return this;
            },
            get: function (id, name) {
                if (id === undefined) return;
                if (name != undefined) {
                    return (this.Coms[id] || { installed: {} }).installed[name];
                } else {
                    var com;
                    $.each(this.Coms, function () {
                        if ((com = this.installed[id]) !== undefined) return false;
                    });
                    return com;
                }
            }
        });
        //CT(CT.nodeAttrs(doc.currentScript));


        /********************************** Class *****************************************/

        CT.Const = function (props) {
            var This = this;
            return new function Const() {
                if (!Object.was(props)) throw "Const {props} must be an Object"
                $.each(props || {}, function (key, value) {
                    Object.defineProperty(This, key, {
                        enumerable: false,
                        configurable: false,
                        writable: false,
                        value: value
                    });
                });
            }
        }

        CT.Enum = function (props) {
            var count = 0;
            if (arguments.length > 1) props = arr.slice.call(arguments);
            return new function Enum() {
                CT.Const.call(this, {
                    extend: function (props) {
                        if (Object.was(props)) {
                            CT.Const.call(this, props);
                        } else if (Array.was(props)) {
                            var newProps = {};
                            $.each(props, function (i, key) {
                                newProps[key] = count++;
                            });
                            CT.Const.call(this, newProps);
                        } else {
                            throw 'Enum {props} must be an Object or Array';
                        }
                        return this;
                    }
                });
                this.extend(props);
            }
        }


        CT.Class = function (func) {
            func = func || function () { };
            var extendClass = [];

            function Class() {
                var args = arguments, This = this;
                Function.was(this.extend) || CT.Const.call(this, {
                    extend: function () {
                        $.extend.apply(this, $.merge([this], arr.map.call(arguments, function (obj) {
                            if (Function.was(obj)) return obj.apply(This, args);
                            return obj;
                        })));
                        return this
                    },
                    const: function (prop, val) {
                        if (String.was(prop)) {
                            var props = {};
                            props[prop] = val;
                            return this.const(props);
                        }
                        CT.Const.call(this, prop);
                        return this;
                    }
                });
                if (arguments.callee.caller === Class) return;
                this.extend.apply(this, extendClass.map(function (cl) { return cl.apply(This, args) }));
                var public = {};
                $.each(this, function (name, prop) {
                        public[name] = Function.was(prop) ? function () { return prop.apply(This, arguments); } : prop;
                });
                this.super = new Class().const(public);
                return func.apply(this, arguments);
            }
            CT.Const.call(Class, {
                extend: function () {
                    var cl = this;
                    $.each(arguments, function () {
                        if (Function.was(this)) extendClass.push(this);
                        $.extend(cl, this);
                    });
                    return this
                },
                const: function (prop, val) {
                    if (String.was(prop)) {
                        var props = {};
                        props[prop] = val;
                        return this.const(props);
                    }
                    CT.Const.call(this, prop);
                    return this;
                }

            });
            return Class;
        }



        CT.Event = (function () {
            return new CT.Class(function Event(node) {
                node = node || doc.createElement('Event');

                var This = this, $event = $(node);
                this.extend({
                    fire: function (name) {
                        arguments[0] = prefix + name;
                        return $event.triggerHandler.apply($event, arguments) !== false;
                    },
                    bind: function (name, func) {
                        $event.bind(prefix + name, func.handler = func.handler || function () {
                            var rs = func.apply(This, arguments);
                            if (rs === false)  arguments[0].stopImmediatePropagation();
                            return rs;
                        });
                        return this
                    },
                    bindOne: function (name, func) {
                        $event.one(prefix + name, func.handler = func.handler || function () {
                            return func.apply(This, arguments);
                        });
                        return this
                    },
                    unbind: function (name, func) {
                        $event.unbind(prefix + name, (func || {}).handler);
                        return this
                    },
                    action: function (actions) {
                        if (arguments.length > 1) actions = arr.slice.call(arguments);
                        var This = this;
                        if (String.was(actions)) return this.const(actions, function () {
                            return this.fire(actions, arguments);
                        });
                        if (Function.was(actions)) return this.action(actions.call(this));
                        if (Array.was(actions)) return $.each(actions, function (k,val) {
                            This.action(val);
                        }), this;
                        return this;
                    }
                });
            });
        })();

        CT.Node = new CT.Class(function (node) {
            this.const({
                node: node,
                parent: function () { },
                addChild: function (module) { },
                delChild: function (module) { },
                getChild: function (name) { }
            });
        }).extend(CT.Event);

        /********************************** Component *****************************************/
        CT.Component = function (fn, name) {

            var
                comSetting = CT.nodeParams(doc.currentScript),
                defaults = $.extend(true, {}, comSetting.setting || {}),
                name = comSetting.component || name,
                tag = prefix + name
                ;

            var Component = CT.Coms[name] = new CT.Class(function (node, setting) {
                if (!this instanceof Component) return new Component(node, setting);
                arguments[0] = node = node || doc.createElement(prefix + 'nullcomponent');

                if (!node.ctComs) Object.defineProperty(node, 'ctComs', {
                    enumerable: false,
                    configurable: false,
                    writable: false,
                    value: {}
                });
                if (node.ctComs[name]) return node.ctComs[name];
                Object.defineProperty(node.ctComs, name, {
                    enumerable: false,
                    configurable: false,
                    writable: false,
                    value: this
                });
                
                
                var
                    This = this,
                    registers = {};
                setting = $.extend(true, {}, defaults, setting || CT.nodeSetting(node));

                this.const({
                    setting: setting,
                    getState: function () { },
                    setState: function () { },
                    saveState: function () { },
                    connect: function (com, actions) {
                        if (com.node === this.node) return;
                        if (String.was(actions)) { actions = arr.slice.call(arguments, 1) }
                        $.each(actions, function (i, action) {
                            var connect;
                            This.bind(action, function () {
                                if (!connect) { connect = com }
                                else if (connect == this) { delete connect; return false }
                                arr.shift.call(arguments);
                                return com[action] && com[action].apply(com,arguments);
                            });
                            com.bind(action, function () {
                                if (!connect) { connect = This }
                                else if (connect == this) { delete connect; return false }
                                arr.shift.call(arguments);
                                return This[action] && This[action].apply(This, arguments);
                            });
                        });
                        return this;
                    },
                    module: function (obj, selector, init) {
                        if (Object.was(obj)) {
                            $.each(obj, function (key, val) {
                                if (Array.was(val)) {
                                    This.module(key, val[0], val[1]);
                                } else if (Object.was(val)) {
                                    This.module(key, val.selector, val.init);
                                } else {
                                    This.module(key, val);
                                }
                            });
                        } else {
                            registers[obj] = {
                                selector: selector,
                                init: init
                            };
                        }
                        
                        return this;
                    },
                    observer: function (func) {
                        this.bind('domchange', func);
                        func();
                        return this;
                    }
                });

                //Component.installed.push(this);
                //this.id && (Component.installed['#'+this.id] = this);
                //this.name && (Component.installed['[' + this.name+']'] = this);
                
                var $node = $(node), initModule = function (e) {
                    setTimeout(function () {
                        $.each(registers, function (name, params) {
                            var module;
                            if (Function.was(params.selector)) {
                                module = params.selector.call(This);
                            } else {
                                if (This.node.ctComs[name]) return This.node.ctComs;
                                var node = $node.find(params.selector).get(0);
                                module = node && node.ctComs && node.ctComs[name];
                            }
                            if (This.module[name] = module) {
                                Function.was(params.init) && params.init.call(module);
                                delete registers[name];
                            }
                        });
                    });
                };
                node.addEventListener('DOMNodeRemoved', function (e) {
                    This.fire('domchange', [e]);
                });
                node.addEventListener('DOMNodeInserted', function (e) {
                    This.fire('domchange', [e]);
                    if (e && !e.target.ctComs) return;
                    initModule();
                });
                initModule();

                fn.call(this, setting);
            }).extend(CT.Node, new CT.Event, {
                installed: [],
                setting: function (setting) { $.extend(defaults, setting, comSetting.setting) }
            });
            
            return Component;
        };

        /********************************** Module *****************************************/
        CT.Module = function () {
            return new CT.Class(function (node) {

            }).extend(CT.Node);
        }
        /********************************** Initialize Components *****************************************/
        $(function () {
            var reg = new RegExp('^' + prefix), init = function () {
                var node = this;
                $.each(CT.nodeSetting(this), function (name) {
                    CT.Coms[name] && new CT.Coms[name](node, this);
                });
            };
            doc.addEventListener('DOMNodeInserted', function (e) {
                init.call(e.target);
            });
            $('[' + prefix.replace(/-$/i, '') + ']').each(init);
        });
        
        return CT;
    }).call(this);
})(jQuery);
