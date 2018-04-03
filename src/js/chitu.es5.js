(function(factory) { 
            if (typeof require === 'function' && typeof exports === 'object' && typeof module === 'object') { 
                // [1] CommonJS/Node.js 
                var target = module['exports'] || exports; 
                var chitu = factory(target, require);
                Object.assign(target,chitu);
            } else 
        if (typeof define === 'function' && define['amd']) { 
            define(factory);  
        } else { 
            factory(); 
        } 
    })(function() {'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var chitu;
(function (chitu) {
    var DEFAULT_FILE_BASE_PATH = 'modules';

    var RouteData = function () {
        function RouteData(basePath, routeString, pathSpliterChar) {
            _classCallCheck(this, RouteData);

            this._parameters = {};
            this.path_string = '';
            this.path_spliter_char = '/';
            this.path_contact_char = '/';
            this.param_spliter = '?';
            this.name_spliter_char = '.';
            this._pathBase = '';
            if (!basePath) throw chitu.Errors.argumentNull('basePath');
            if (!routeString) throw chitu.Errors.argumentNull('routeString');
            if (pathSpliterChar) this.path_spliter_char = pathSpliterChar;
            this._loadCompleted = false;
            this._routeString = routeString;
            this._pathBase = basePath;
            this.parseRouteString();
            var routeData = this;
        }

        _createClass(RouteData, [{
            key: 'parseRouteString',
            value: function parseRouteString() {
                var routeString = this.routeString;
                var routePath = void 0;
                var search = void 0;
                var param_spliter_index = routeString.indexOf(this.param_spliter);
                if (param_spliter_index > 0) {
                    search = routeString.substr(param_spliter_index + 1);
                    routePath = routeString.substring(0, param_spliter_index);
                } else {
                    routePath = routeString;
                }
                if (!routePath) throw chitu.Errors.canntParseRouteString(routeString);
                if (search) {
                    this._parameters = pareeUrlQuery(search);
                }
                var path_parts = routePath.split(this.path_spliter_char).map(function (o) {
                    return o.trim();
                }).filter(function (o) {
                    return o != '';
                });
                if (path_parts.length < 1) {
                    throw chitu.Errors.canntParseRouteString(routeString);
                }
                var file_path = path_parts.join(this.path_contact_char);
                this._pageName = path_parts.join(this.name_spliter_char);
                this._actionPath = this.basePath ? chitu.combinePath(this.basePath, file_path) : file_path;
            }
        }, {
            key: 'pareeUrlQuery',
            value: function pareeUrlQuery(query) {
                var match = void 0,
                    pl = /\+/g,
                    search = /([^&=]+)=?([^&]*)/g,
                    decode = function decode(s) {
                    return decodeURIComponent(s.replace(pl, " "));
                };
                var urlParams = {};
                while (match = search.exec(query)) {
                    urlParams[decode(match[1])] = decode(match[2]);
                }return urlParams;
            }
        }, {
            key: 'basePath',
            get: function get() {
                return this._pathBase;
            }
        }, {
            key: 'values',
            get: function get() {
                return this._parameters;
            }
        }, {
            key: 'pageName',
            get: function get() {
                return this._pageName;
            }
        }, {
            key: 'routeString',
            get: function get() {
                return this._routeString;
            }
        }, {
            key: 'actionPath',
            get: function get() {
                return this._actionPath;
            }
        }, {
            key: 'loadCompleted',
            get: function get() {
                return this._loadCompleted;
            }
        }]);

        return RouteData;
    }();

    chitu.RouteData = RouteData;
    var PAGE_STACK_MAX_SIZE = 20;
    var ACTION_LOCATION_FORMATER = '{controller}/{action}';
    var VIEW_LOCATION_FORMATER = '{controller}/{action}';

    var Application = function () {
        function Application(args) {
            _classCallCheck(this, Application);

            this.pageCreated = chitu.Callbacks();
            this.pageType = chitu.Page;
            this.pageDisplayType = PageDisplayerImplement;
            this._runned = false;
            this.page_stack = new Array();
            this.fileBasePath = DEFAULT_FILE_BASE_PATH;
            this.backFail = chitu.Callbacks();
            args = args || {};
            this._siteMap = args.siteMap;
            if (this._siteMap) {
                if (this._siteMap.root == null) throw chitu.Errors.siteMapRootCanntNull();
                this._siteMap.root.level = 0;
                this.setChildrenParent(this._siteMap.root);
            }
        }

        _createClass(Application, [{
            key: 'setChildrenParent',
            value: function setChildrenParent(parent) {
                if (parent == null) throw chitu.Errors.argumentNull('parent');
                var children = parent.children || [];
                for (var i = 0; i < children.length; i++) {
                    children[i].parent = parent;
                    children[i].level = parent.level + 1;
                    this.setChildrenParent(children[i]);
                }
            }
        }, {
            key: 'parseRouteString',
            value: function parseRouteString(routeString) {
                var routeData = new RouteData(this.fileBasePath, routeString);
                return routeData;
            }
        }, {
            key: 'on_pageCreated',
            value: function on_pageCreated(page) {
                return this.pageCreated.fire(this, page);
            }
        }, {
            key: 'createPage',
            value: function createPage(routeData, actionArguments) {
                var _this = this;

                var previous_page = this.pages[this.pages.length - 1];
                var element = this.createPageElement(routeData);
                var displayer = new this.pageDisplayType(this);
                console.assert(this.pageType != null);
                var page = new this.pageType({
                    app: this,
                    previous: previous_page,
                    routeData: routeData,
                    displayer: displayer,
                    element: element,
                    actionArguments: actionArguments
                });
                var page_onclosed = function page_onclosed(sender) {
                    _this.page_stack = _this.page_stack.filter(function (o) {
                        return o != sender;
                    });
                    page.closed.remove(page_onclosed);
                };
                page.closed.add(page_onclosed);
                this.on_pageCreated(page);
                return page;
            }
        }, {
            key: 'createPageElement',
            value: function createPageElement(routeData) {
                var element = document.createElement(chitu.Page.tagName);
                document.body.appendChild(element);
                return element;
            }
        }, {
            key: 'hashchange',
            value: function hashchange() {
                var location = window.location;
                if (location.skipHashChanged == true) {
                    location.skipHashChanged = false;
                    return;
                }
                var hash = window.location.hash;
                if (!hash) {
                    console.log('The url is not contains hash.url is ' + window.location.href);
                    return;
                }
                var routeString;
                if (location.hash.length > 1) routeString = location.hash.substr(1);
                var page = this.getPageByRouteString(routeString);
                var previousPageIndex = this.page_stack.length - 2;
                if (page != null && this.page_stack.indexOf(page) == previousPageIndex) {
                    this.closeCurrentPage();
                } else {
                    this.showPage(routeString);
                }
            }
        }, {
            key: 'run',
            value: function run() {
                var _this2 = this;

                if (this._runned) return;
                var app = this;
                this.hashchange();
                window.addEventListener('popstate', function () {
                    _this2.hashchange();
                });
                this._runned = true;
            }
        }, {
            key: 'getPage',
            value: function getPage(name) {
                for (var i = this.page_stack.length - 1; i >= 0; i--) {
                    var page = this.page_stack[i];
                    if (page != null && page.name == name) return page;
                }
                return null;
            }
        }, {
            key: 'getPageByRouteString',
            value: function getPageByRouteString(routeString) {
                for (var i = this.page_stack.length - 1; i >= 0; i--) {
                    var page = this.page_stack[i];
                    if (page != null && page.routeData.routeString == routeString) return page;
                }
                return null;
            }
        }, {
            key: 'showPage',
            value: function showPage(routeString, args) {
                if (!routeString) throw chitu.Errors.argumentNull('routeString');
                var routeData = this.parseRouteString(routeString);
                if (routeData == null) {
                    throw chitu.Errors.noneRouteMatched(routeString);
                }
                Object.assign(routeData.values, args || {});
                var page = this.createPage(routeData, args);
                if (this.currentPage != null) {
                    var pageIsParenPage = false;
                    var newPageNode = this.findSiteMapNode(page.name);
                    var currentPageNode = this.findSiteMapNode(this.currentPage.name);
                    if (newPageNode.level < currentPageNode.level) {
                        this.closeCurrentPage();
                    }
                }
                this.pushPage(page);
                page.show();
                return page;
            }
        }, {
            key: 'pushPage',
            value: function pushPage(page) {
                var previous = this.currentPage;
                this.page_stack.push(page);
                if (this.page_stack.length > PAGE_STACK_MAX_SIZE) {
                    var c = this.page_stack.shift();
                }
                page.previous = previous;
            }
        }, {
            key: 'findSiteMapNode',
            value: function findSiteMapNode(pageName) {
                var stack = new Array();
                stack.push(this._siteMap.root);
                while (stack.length > 0) {
                    var node = stack.pop();
                    if (node.pageName == pageName) {
                        return node;
                    }
                }
            }
        }, {
            key: 'setLocationHash',
            value: function setLocationHash(routeString) {
                history.pushState(routeString, "", '#' + routeString);
            }
        }, {
            key: 'closeCurrentPage',
            value: function closeCurrentPage() {
                if (this.page_stack.length <= 0) return;
                var page = this.page_stack.pop();
                page.close();
                if (this.currentPage != null) this.setLocationHash(this.currentPage.routeData.routeString);
            }
        }, {
            key: 'clearPageStack',
            value: function clearPageStack() {
                this.page_stack = [];
            }
        }, {
            key: 'redirect',
            value: function redirect(routeString, args) {
                var location = window.location;
                var result = this.showPage(routeString, args);
                this.setLocationHash(routeString);
                return result;
            }
        }, {
            key: 'back',
            value: function back() {
                history.back();
            }
        }, {
            key: '_back',
            value: function _back() {
                var args = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : undefined;

                if (this.currentPage == null) {
                    this.backFail.fire(this, null);
                    return;
                }
                var routeData = this.currentPage.routeData;
                this.closeCurrentPage();
                if (this.page_stack.length > 0) {
                    return;
                }
                if (this._siteMap == null) {
                    this.backFail.fire(this, null);
                    return;
                }
                var siteMapNode = this.findSiteMapNode(routeData.pageName);
                if (siteMapNode != null && siteMapNode.parent != null) {
                    var p = siteMapNode.parent;
                    var routeString = typeof p.routeString == 'function' ? p.routeString() : p.routeString;
                    this.redirect(routeString);
                    return;
                }
                this.backFail.fire(this, null);
            }
        }, {
            key: 'currentPage',
            get: function get() {
                if (this.page_stack.length > 0) return this.page_stack[this.page_stack.length - 1];
                return null;
            }
        }, {
            key: 'pages',
            get: function get() {
                return this.page_stack;
            }
        }]);

        return Application;
    }();

    chitu.Application = Application;
})(chitu || (chitu = {}));
//# sourceMappingURL=Application.js.map

'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var chitu;
(function (chitu) {
    var Errors = function () {
        function Errors() {
            _classCallCheck(this, Errors);
        }

        _createClass(Errors, null, [{
            key: 'argumentNull',
            value: function argumentNull(paramName) {
                var msg = 'The argument "' + paramName + '" cannt be null.';
                return new Error(msg);
            }
        }, {
            key: 'modelFileExpecteFunction',
            value: function modelFileExpecteFunction(script) {
                var msg = 'The eval result of script file "' + script + '" is expected a function.';
                return new Error(msg);
            }
        }, {
            key: 'paramTypeError',
            value: function paramTypeError(paramName, expectedType) {
                var msg = 'The param "' + paramName + '" is expected "' + expectedType + '" type.';
                return new Error(msg);
            }
        }, {
            key: 'paramError',
            value: function paramError(msg) {
                return new Error(msg);
            }
        }, {
            key: 'viewNodeNotExists',
            value: function viewNodeNotExists(name) {
                var msg = 'The view node "' + name + '" is not exists.';
                return new Error(msg);
            }
        }, {
            key: 'pathPairRequireView',
            value: function pathPairRequireView(index) {
                var msg = 'The view value is required for path pair, but the item with index "' + index + '" is miss it.';
                return new Error(msg);
            }
        }, {
            key: 'notImplemented',
            value: function notImplemented(name) {
                var msg = '\'The method "' + name + '" is not implemented.\'';
                return new Error(msg);
            }
        }, {
            key: 'routeExists',
            value: function routeExists(name) {
                var msg = 'Route named "' + name + '" is exists.';
                return new Error(msg);
            }
        }, {
            key: 'noneRouteMatched',
            value: function noneRouteMatched(url) {
                var msg = 'None route matched with url "' + url + '".';
                var error = new Error(msg);
                return error;
            }
        }, {
            key: 'emptyStack',
            value: function emptyStack() {
                return new Error('The stack is empty.');
            }
        }, {
            key: 'canntParseUrl',
            value: function canntParseUrl(url) {
                var msg = 'Can not parse the url "' + url + '" to route data.';
                return new Error(msg);
            }
        }, {
            key: 'canntParseRouteString',
            value: function canntParseRouteString(routeString) {
                var msg = 'Can not parse the route string "' + routeString + '" to route data.;';
                return new Error(msg);
            }
        }, {
            key: 'routeDataRequireController',
            value: function routeDataRequireController() {
                var msg = 'The route data does not contains a "controller" file.';
                return new Error(msg);
            }
        }, {
            key: 'routeDataRequireAction',
            value: function routeDataRequireAction() {
                var msg = 'The route data does not contains a "action" file.';
                return new Error(msg);
            }
        }, {
            key: 'viewCanntNull',
            value: function viewCanntNull() {
                var msg = 'The view or viewDeferred of the page cannt null.';
                return new Error(msg);
            }
        }, {
            key: 'createPageFail',
            value: function createPageFail(pageName) {
                var msg = 'Create page "' + pageName + '" fail.';
                return new Error(msg);
            }
        }, {
            key: 'actionTypeError',
            value: function actionTypeError(pageName) {
                var msg = 'The action in page \'' + pageName + '\' is expect as function.';
                return new Error(msg);
            }
        }, {
            key: 'canntFindAction',
            value: function canntFindAction(pageName) {
                var msg = 'Cannt find action in page \'' + pageName + '\', is the exports has default field?';
                return new Error(msg);
            }
        }, {
            key: 'exportsCanntNull',
            value: function exportsCanntNull(pageName) {
                var msg = 'Exports of page \'' + pageName + '\' is null.';
            }
        }, {
            key: 'scrollerElementNotExists',
            value: function scrollerElementNotExists() {
                var msg = "Scroller element is not exists.";
                return new Error(msg);
            }
        }, {
            key: 'resourceExists',
            value: function resourceExists(resourceName, pageName) {
                var msg = 'Rosource \'' + resourceName + '\' is exists in the resources of page \'' + pageName + '\'.';
                return new Error(msg);
            }
        }, {
            key: 'siteMapRootCanntNull',
            value: function siteMapRootCanntNull() {
                var msg = 'The site map root node can not be null.';
                return new Error(msg);
            }
        }]);

        return Errors;
    }();

    chitu.Errors = Errors;
})(chitu || (chitu = {}));
//# sourceMappingURL=Errors.js.map

"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var chitu;
(function (chitu) {
    var Callback = function () {
        function Callback() {
            _classCallCheck(this, Callback);

            this.funcs = new Array();
        }

        _createClass(Callback, [{
            key: "add",
            value: function add(func) {
                this.funcs.push(func);
            }
        }, {
            key: "remove",
            value: function remove(func) {
                this.funcs = this.funcs.filter(function (o) {
                    return o != func;
                });
            }
        }, {
            key: "fire",
            value: function fire(sender, args) {
                this.funcs.forEach(function (o) {
                    return o(sender, args);
                });
            }
        }]);

        return Callback;
    }();

    chitu.Callback = Callback;
    function Callbacks() {
        return new Callback();
    }
    chitu.Callbacks = Callbacks;

    var ValueStore = function () {
        function ValueStore(value) {
            _classCallCheck(this, ValueStore);

            this.funcs = new Array();
            this._value = value;
        }

        _createClass(ValueStore, [{
            key: "add",
            value: function add(func) {
                this.funcs.push(func);
                return func;
            }
        }, {
            key: "remove",
            value: function remove(func) {
                this.funcs = this.funcs.filter(function (o) {
                    return o != func;
                });
            }
        }, {
            key: "fire",
            value: function fire(value) {
                this.funcs.forEach(function (o) {
                    return o(value);
                });
            }
        }, {
            key: "value",
            get: function get() {
                return this._value;
            },
            set: function set(value) {
                this._value = value;
                this.fire(value);
            }
        }]);

        return ValueStore;
    }();

    chitu.ValueStore = ValueStore;
})(chitu || (chitu = {}));
//# sourceMappingURL=Extends.js.map

'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var __awaiter = undefined && undefined.__awaiter || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) {
            try {
                step(generator.next(value));
            } catch (e) {
                reject(e);
            }
        }
        function rejected(value) {
            try {
                step(generator["throw"](value));
            } catch (e) {
                reject(e);
            }
        }
        function step(result) {
            result.done ? resolve(result.value) : new P(function (resolve) {
                resolve(result.value);
            }).then(fulfilled, rejected);
        }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var chitu;
(function (chitu) {
    var Page = function () {
        function Page(params) {
            _classCallCheck(this, Page);

            this.animationTime = 300;
            this.error = chitu.Callbacks();
            this.load = chitu.Callbacks();
            this.loadComplete = chitu.Callbacks();
            this.showing = chitu.Callbacks();
            this.shown = chitu.Callbacks();
            this.hiding = chitu.Callbacks();
            this.hidden = chitu.Callbacks();
            this.closing = chitu.Callbacks();
            this.closed = chitu.Callbacks();
            this._element = params.element;
            this._previous = params.previous;
            this._app = params.app;
            this._routeData = params.routeData;
            this._displayer = params.displayer;
            this._actionArguments = params.actionArguments;
            this.loadPageAction();
        }

        _createClass(Page, [{
            key: 'on_load',
            value: function on_load() {
                return this.load.fire(this, null);
            }
        }, {
            key: 'on_loadComplete',
            value: function on_loadComplete() {
                return this.loadComplete.fire(this, null);
            }
        }, {
            key: 'on_showing',
            value: function on_showing() {
                return this.showing.fire(this, null);
            }
        }, {
            key: 'on_shown',
            value: function on_shown() {
                return this.shown.fire(this, null);
            }
        }, {
            key: 'on_hiding',
            value: function on_hiding() {
                return this.hiding.fire(this, null);
            }
        }, {
            key: 'on_hidden',
            value: function on_hidden() {
                return this.hidden.fire(this, null);
            }
        }, {
            key: 'on_closing',
            value: function on_closing() {
                return this.closing.fire(this, null);
            }
        }, {
            key: 'on_closed',
            value: function on_closed() {
                return this.closed.fire(this, null);
            }
        }, {
            key: 'show',
            value: function show() {
                var _this = this;

                this.on_showing();
                return this._displayer.show(this).then(function (o) {
                    _this.on_shown();
                });
            }
        }, {
            key: 'hide',
            value: function hide() {
                var _this2 = this;

                this.on_hiding();
                return this._displayer.hide(this).then(function (o) {
                    _this2.on_hidden();
                });
            }
        }, {
            key: 'close',
            value: function close() {
                var _this3 = this;

                return this.hide().then(function () {
                    _this3.on_closing();
                    _this3._element.remove();
                    _this3.on_closed();
                });
            }
        }, {
            key: 'createService',
            value: function createService(type) {
                var _this4 = this;

                var service = new type();
                service.error.add(function (ender, error) {
                    _this4.error.fire(_this4, error);
                });
                return service;
            }
        }, {
            key: 'loadPageAction',
            value: function loadPageAction() {
                return __awaiter(this, void 0, void 0, /*#__PURE__*/regeneratorRuntime.mark(function _callee() {
                    var _this5 = this;

                    var routeData, url, actionResult, actionName, action, actionExecuteResult, _actionResult;

                    return regeneratorRuntime.wrap(function _callee$(_context) {
                        while (1) {
                            switch (_context.prev = _context.next) {
                                case 0:
                                    console.assert(this._routeData != null);
                                    routeData = this._routeData;
                                    url = routeData.actionPath;
                                    _context.next = 5;
                                    return chitu.loadjs(url);

                                case 5:
                                    actionResult = _context.sent;

                                    if (actionResult) {
                                        _context.next = 8;
                                        break;
                                    }

                                    throw chitu.Errors.exportsCanntNull(routeData.pageName);

                                case 8:
                                    actionName = 'default';
                                    action = actionResult[actionName];

                                    if (!(action == null)) {
                                        _context.next = 12;
                                        break;
                                    }

                                    throw chitu.Errors.canntFindAction(routeData.pageName);

                                case 12:
                                    actionExecuteResult = void 0;

                                    if (!(typeof action == 'function')) {
                                        _context.next = 18;
                                        break;
                                    }

                                    _actionResult = action(this);

                                    if (_actionResult != null && _actionResult.then != null && _actionResult.catch != null) {
                                        _actionResult.then(function () {
                                            return _this5.on_loadComplete();
                                        });
                                    }
                                    _context.next = 19;
                                    break;

                                case 18:
                                    throw chitu.Errors.actionTypeError(routeData.pageName);

                                case 19:
                                    this.on_load();

                                case 20:
                                case 'end':
                                    return _context.stop();
                            }
                        }
                    }, _callee, this);
                }));
            }
        }, {
            key: 'reload',
            value: function reload() {
                return this.loadPageAction();
            }
        }, {
            key: 'element',
            get: function get() {
                return this._element;
            }
        }, {
            key: 'previous',
            get: function get() {
                return this._previous;
            },
            set: function set(value) {
                this._previous = value;
            }
        }, {
            key: 'routeData',
            get: function get() {
                return this._routeData;
            }
        }, {
            key: 'name',
            get: function get() {
                return this.routeData.pageName;
            }
        }]);

        return Page;
    }();

    Page.tagName = 'div';
    chitu.Page = Page;
})(chitu || (chitu = {}));

var PageDisplayerImplement = function () {
    function PageDisplayerImplement() {
        _classCallCheck(this, PageDisplayerImplement);
    }

    _createClass(PageDisplayerImplement, [{
        key: 'show',
        value: function show(page) {
            page.element.style.display = 'block';
            if (page.previous != null) {
                page.previous.element.style.display = 'none';
            }
            return Promise.resolve();
        }
    }, {
        key: 'hide',
        value: function hide(page) {
            page.element.style.display = 'none';
            if (page.previous != null) {
                page.previous.element.style.display = 'block';
            }
            return Promise.resolve();
        }
    }]);

    return PageDisplayerImplement;
}();
//# sourceMappingURL=Page.js.map

'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var __awaiter = undefined && undefined.__awaiter || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) {
            try {
                step(generator.next(value));
            } catch (e) {
                reject(e);
            }
        }
        function rejected(value) {
            try {
                step(generator["throw"](value));
            } catch (e) {
                reject(e);
            }
        }
        function step(result) {
            result.done ? resolve(result.value) : new P(function (resolve) {
                resolve(result.value);
            }).then(fulfilled, rejected);
        }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
function _ajax(url, options) {
    return __awaiter(this, void 0, void 0, /*#__PURE__*/regeneratorRuntime.mark(function _callee() {
        var response, responseText, p, text, textObject, isJSONContextType, err, travelJSON;
        return regeneratorRuntime.wrap(function _callee$(_context) {
            while (1) {
                switch (_context.prev = _context.next) {
                    case 0:
                        travelJSON = function travelJSON(result) {
                            var datePattern = /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/;
                            if (typeof result === 'string' && value.match(this.datePattern)) {
                                return new Date(result);
                            }
                            var stack = new Array();
                            stack.push(result);
                            while (stack.length > 0) {
                                var item = stack.pop();
                                for (var key in item) {
                                    var value = item[key];
                                    if (value == null) continue;
                                    if (value instanceof Array) {
                                        for (var i = 0; i < value.length; i++) {
                                            stack.push(value[i]);
                                        }
                                        continue;
                                    }
                                    if ((typeof value === 'undefined' ? 'undefined' : _typeof(value)) == 'object') {
                                        stack.push(value);
                                        continue;
                                    }
                                    if (typeof value == 'string' && value.match(datePattern)) {
                                        item[key] = new Date(value);
                                    }
                                }
                            }
                            return result;
                        };

                        _context.next = 3;
                        return fetch(url, options);

                    case 3:
                        response = _context.sent;
                        responseText = response.text();
                        p = void 0;

                        if (typeof responseText == 'string') {
                            p = new Promise(function (reslove, reject) {
                                reslove(responseText);
                            });
                        } else {
                            p = responseText;
                        }
                        _context.next = 9;
                        return responseText;

                    case 9:
                        text = _context.sent;
                        textObject = void 0;
                        isJSONContextType = (response.headers.get('content-type') || '').indexOf('json') >= 0;

                        if (isJSONContextType) {
                            textObject = JSON.parse(text);
                            textObject = travelJSON(textObject);
                        } else {
                            textObject = text;
                        }

                        if (!(response.status >= 300)) {
                            _context.next = 20;
                            break;
                        }

                        err = new Error();

                        err.method = options.method;
                        err.name = '' + response.status;
                        err.message = isJSONContextType ? textObject.Message || textObject.message : textObject;
                        err.message = err.message || response.statusText;
                        throw err;

                    case 20:
                        return _context.abrupt('return', textObject);

                    case 21:
                    case 'end':
                        return _context.stop();
                }
            }
        }, _callee, this);
    }));
}
var chitu;
(function (chitu) {
    var Service = function () {
        function Service() {
            _classCallCheck(this, Service);

            this.error = chitu.Callbacks();
        }

        _createClass(Service, [{
            key: 'ajax',
            value: function ajax(url, options) {
                var _this = this;

                options.headers = Object.assign(Service.settings.headers || {}, options.headers || {});
                return new Promise(function (reslove, reject) {
                    var timeId = void 0;
                    if (options.method == 'get') {
                        timeId = setTimeout(function () {
                            var err = new Error();
                            err.name = 'timeout';
                            err.message = '网络连接超时';
                            reject(err);
                            _this.error.fire(_this, err);
                            clearTimeout(timeId);
                        }, Service.settings.ajaxTimeout * 1000);
                    }
                    _ajax(url, options).then(function (data) {
                        reslove(data);
                        if (timeId) clearTimeout(timeId);
                    }).catch(function (err) {
                        reject(err);
                        _this.error.fire(_this, err);
                        if (timeId) clearTimeout(timeId);
                    });
                });
            }
        }, {
            key: 'getByJson',
            value: function getByJson(url, data) {
                console.assert(url.indexOf('?') < 0);
                if (data) {
                    url = url + '?' + JSON.stringify(data);
                }
                return this.ajaxByJSON(url, null, 'get');
            }
        }, {
            key: 'postByJson',
            value: function postByJson(url, data) {
                return this.ajaxByJSON(url, data, 'post');
            }
        }, {
            key: 'deleteByJson',
            value: function deleteByJson(url, data) {
                return this.ajaxByJSON(url, data, 'delete');
            }
        }, {
            key: 'putByJson',
            value: function putByJson(url, data) {
                return this.ajaxByJSON(url, data, 'put');
            }
        }, {
            key: 'get',
            value: function get(url, data) {
                data = data || {};
                var urlParams = '';
                for (var key in data) {
                    urlParams = urlParams + ('&' + key + '=' + data[key]);
                }
                console.assert(url.indexOf('?') < 0);
                url = url + '?' + urlParams;
                var options = {
                    method: 'get'
                };
                return this.ajax(url, options);
            }
        }, {
            key: 'post',
            value: function post(url, data) {
                return this.ajaxByForm(url, data, 'post');
            }
        }, {
            key: 'put',
            value: function put(url, data) {
                return this.ajaxByForm(url, data, 'put');
            }
        }, {
            key: 'delete',
            value: function _delete(url, data) {
                return this.ajaxByForm(url, data, 'delete');
            }
        }, {
            key: 'ajaxByForm',
            value: function ajaxByForm(url, data, method) {
                var form = new FormData();
                for (var key in data) {
                    form.append(key, data[key]);
                }
                return this.ajax(url, { body: form, method: method });
            }
        }, {
            key: 'ajaxByJSON',
            value: function ajaxByJSON(url, data, method) {
                var headers = {};
                headers['content-type'] = 'application/json';
                var body = void 0;
                if (data) body = JSON.stringify(data);
                var options = {
                    headers: headers,
                    body: body,
                    method: method
                };
                return this.ajax(url, options);
            }
        }]);

        return Service;
    }();

    Service.settings = {
        ajaxTimeout: 30,
        headers: {}
    };
    chitu.Service = Service;
})(chitu || (chitu = {}));
//# sourceMappingURL=Service.js.map

'use strict';

var chitu;
(function (chitu) {
    function combinePath(path1, path2) {
        if (!path1) throw chitu.Errors.argumentNull('path1');
        if (!path2) throw chitu.Errors.argumentNull('path2');
        path1 = path1.trim();
        if (!path1.endsWith('/')) path1 = path1 + '/';
        return path1 + path2;
    }
    chitu.combinePath = combinePath;
    function loadjs(path) {
        return new Promise(function (reslove, reject) {
            requirejs([path], function (result) {
                reslove(result);
            }, function (err) {
                reject(err);
            });
        });
    }
    chitu.loadjs = loadjs;
})(chitu || (chitu = {}));
//# sourceMappingURL=Utility.js.map

window['chitu'] = window['chitu'] || chitu 
                            
 return chitu;
            });