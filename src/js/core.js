(function ($) {
    this.CodingTime = this.CT = this.CodingTime || (function () {

        var
            win = window, doc = win.document, arr = [],
            valueFromString = function (str) {
                try {
                    eval('str = ' + str);
                } catch (e) { }
                return str;
            }
            ;

        $.each([Array, String, Function, Function.prototype], function () {
            $.extend(this, {
                was: function (obj) { return obj instanceof this; }
            });
        });
        Object.was = function (obj) { return obj instanceof this && !Array.was(obj) }
        String.prototype.toProp = function () {
            return this.replace(/-([a-z])/g, function (match, key) {
                return key.toUpperCase()
            })
        }




        /********************************** Core *****************************************/
        var CT = function (setting) {
            $.extend(CT.setting, setting);
        };
        $.extend(CT, {
            components: {},
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
            nodeParams: function (node, prefix) {
                prefix = prefix || '';
                var params = JSON.parse(node.getAttribute(prefix.replace(/-$/i, '')) || '{}');
                prefix = new RegExp('^' + prefix, 'i');
                $.each(CT.nodeAttrs(node), function (key, val) {
                    if (prefix.test(key)) {
                        params[key.replace(prefix, '').toProp()] = val;
                    }
                });
                return params;
            },
            ready: function (fn) {
                doc.addEventListener('DOMContentLoaded', fn);
                return this;
            },
            install: function () { $.each(CT.components, function () { this.install(); }) },
            get: function (id, name) {
                if (id === undefined) return;
                if (name != undefined) {
                    return (this.components[id] || { installed: {} }).installed[name];
                } else {
                    var com;
                    $.each(this.components, function () {
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
                    const: function (props) {
                        CT.Const.call(this, props);
                    }
                });
                this.extend.apply(this, extendClass.map(function (cl) { return cl.apply(This, args) }));
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
                }
            });
            return Class;
        }



        CT.Event = (function () {
            var prefix = CT.setting.prefix;
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
                            return func.apply(This, arguments);
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
                    }
                });
            });
        })();

        CT.Node = new CT.Class(function (node) {
            this.extend({
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
                prefix = CT.setting.prefix,
                comSetting = CT.nodeParams(doc.currentScript, prefix),
                defaults = $.extend({}, comSetting.setting || {}),
                name = comSetting.component || name,
                tag = prefix + name
                ;

            var Component = CT.components[name] = new CT.Class(function(node) {
                if (node.component) return;
                node.component = this;
                if (!this instanceof Component) return new Component(node);
                var setting = $.extend({}, defaults, CT.nodeParams(node, prefix), {
                    id: node.id,
                    name: node.name
                });
                this.extend({
                    setting: setting,
                    getState: function () { },
                    setState: function () { },
                    saveState: function () { }
                });

                Component.installed.push(Component.installed[this.id] = this);
                fn.call(this, setting);
            }).extend(CT.Node, new CT.Event, {
                install: function () {
                    $.each(doc.getElementsByTagName(tag), function () {
                        new Component(this);
                    });
                    return arguments.callee
                },
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
            var reg = new RegExp('^' + CT.setting.prefix);
            doc.addEventListener('DOMNodeInserted', function (e) {
                var name = e.target.tagName.toLowerCase();
                if (!reg.test(name)) return;
                var Com = CT.components[name.replace(reg, '').toProp()];
                Com && new Com(e.target);
            });
            CT.install();
        });
        
        return CT;
    }).call(this);
})(jQuery);
