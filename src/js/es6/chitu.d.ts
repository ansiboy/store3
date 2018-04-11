declare namespace chitu {
    type ActionType = ((page: Page) => void) | string;
    type SiteMapChildren<T extends SiteMapNode> = {
        [key: string]: T;
    };
    interface SiteMapNode {
        action: ActionType;
        name?: string;
        cache?: boolean;
    }
    interface SiteMap<T extends SiteMapNode> {
        nodes: {
            [key: string]: T;
        };
    }
    class Application<T extends SiteMapNode> {
        static skipStateName: string;
        pageCreated: Callback1<this, Page>;
        protected pageType: PageConstructor;
        protected pageDisplayType: PageDisplayConstructor;
        private _runned;
        private cachePages;
        private allNodes;
        private _currentPage;
        error: Callback2<this, AppError, Page>;
        constructor(siteMap: SiteMap<T>);
        protected parseUrl(url: string): {
            pageName: string;
            values: PageData;
        };
        protected createUrl(pageName: string, values: {
            [key: string]: string;
        }): string;
        private on_pageCreated(page);
        readonly currentPage: Page;
        private getPage(pageName, values?);
        private allowCache(pageName);
        protected createPageElement(pageName: string): HTMLElement;
        protected hashchange(): void;
        run(): void;
        showPage(node: SiteMapNode, args?: any): Page;
        private showPageByUrl(url, args?);
        private pushPage(page);
        private findSiteMapNode(pageName);
        setLocationHash(url: string): void;
        redirect(node: SiteMapNode, args?: any): Page;
        back(): void;
        throwError(err: Error, page?: Page): void;
        loadjs(path: any): Promise<any>;
        readonly pageNodes: {
            [key: string]: T;
        };
    }
}
declare class Errors {
    static pageNodeNotExists(pageName: string): Error;
    static argumentNull(paramName: string): Error;
    static modelFileExpecteFunction(script: any): Error;
    static paramTypeError(paramName: string, expectedType: string): Error;
    static paramError(msg: string): Error;
    static viewNodeNotExists(name: any): Error;
    static pathPairRequireView(index: any): Error;
    static notImplemented(name: any): Error;
    static routeExists(name: any): Error;
    static noneRouteMatched(url: any): Error;
    static emptyStack(): Error;
    static canntParseUrl(url: string): Error;
    static canntParseRouteString(routeString: string): Error;
    static routeDataRequireController(): Error;
    static routeDataRequireAction(): Error;
    static viewCanntNull(): Error;
    static createPageFail(pageName: string): Error;
    static actionTypeError(pageName: string): Error;
    static canntFindAction(pageName: any): Error;
    static exportsCanntNull(pageName: string): Error;
    static scrollerElementNotExists(): Error;
    static resourceExists(resourceName: string, pageName: string): Error;
    static siteMapRootCanntNull(): Error;
    static duplicateSiteMapNode(name: string): Error;
}
declare namespace chitu {
    interface AppError extends Error {
        processed: boolean;
    }
}
declare namespace chitu {
    class Callback {
        private funcs;
        constructor();
        add(func: (...args: Array<any>) => any): void;
        remove(func: (...args: Array<any>) => any): void;
        fire(...args: Array<any>): void;
    }
    interface Callback1<S, A> extends Callback {
        add(func: (sender: S, arg: A) => any): any;
        remove(func: (sender: S, arg: A) => any): any;
        fire(sender: S, arg: A): any;
    }
    interface Callback2<S, A, A1> extends Callback {
        add(func: (sender: S, arg: A, arg1: A1) => any): any;
        remove(func: (sender: S, arg: A, arg1: A1) => any): any;
        fire(sender: S, arg: A, arg1: A1): any;
    }
    function Callbacks<S, A, A1>(): Callback2<S, A, A1>;
    function Callbacks<S, A>(): Callback1<S, A>;
    type ValueChangedCallback<T> = (args: T, sender: any) => void;
    class ValueStore<T> {
        private items;
        private _value;
        constructor(value?: T);
        add(func: ValueChangedCallback<T>, sender?: any): ValueChangedCallback<T>;
        remove(func: ValueChangedCallback<T>): void;
        fire(value: T): void;
        value: T;
    }
}
declare namespace chitu {
    type PageData = {
        [key: string]: any;
    };
    interface PageDisplayConstructor {
        new (app: Application<any>): PageDisplayer;
    }
    interface PageDisplayer {
        show(page: Page): Promise<any>;
        hide(page: Page): Promise<any>;
    }
    interface PageParams {
        app: Application<any>;
        action: ActionType;
        element: HTMLElement;
        displayer: PageDisplayer;
        previous?: Page;
        name: string;
        data: PageData;
    }
    class Page {
        private animationTime;
        private num;
        private _element;
        private _previous;
        private _app;
        private _displayer;
        private _action;
        private _name;
        static tagName: string;
        data: PageData;
        load: Callback1<this, PageData>;
        loadComplete: Callback1<this, PageData>;
        showing: Callback1<this, PageData>;
        shown: Callback1<this, PageData>;
        hiding: Callback1<this, PageData>;
        hidden: Callback1<this, PageData>;
        closing: Callback1<this, PageData>;
        closed: Callback1<this, PageData>;
        active: Callback1<this, PageData>;
        deactive: Callback1<this, PageData>;
        constructor(params: PageParams);
        private on_load();
        private on_loadComplete();
        private on_showing();
        private on_shown();
        private on_hiding();
        private on_hidden();
        private on_closing();
        private on_closed();
        on_active(args: PageData): void;
        on_deactive(): void;
        show(): Promise<any>;
        hide(): Promise<any>;
        close(): Promise<any>;
        createService<T extends Service>(type?: ServiceConstructor<T>): T;
        readonly element: HTMLElement;
        previous: Page;
        readonly name: string;
        private loadPageAction();
        reload(): Promise<void>;
    }
}
interface PageActionConstructor {
    new (page: chitu.Page): any;
}
interface PageConstructor {
    new (args: chitu.PageParams): chitu.Page;
}
declare class PageDisplayerImplement implements chitu.PageDisplayer {
    show(page: chitu.Page): Promise<void>;
    hide(page: chitu.Page): Promise<void>;
}
interface ServiceError extends Error {
    method?: string;
}
declare function ajax<T>(url: string, options: RequestInit): Promise<T>;
declare function callAjax<T>(url: string, options: RequestInit, service: chitu.Service, error: chitu.Callback1<chitu.Service, Error>): Promise<T>;
declare namespace chitu {
    interface ServiceConstructor<T> {
        new (): T;
    }
    class Service {
        error: Callback1<Service, Error>;
        static settings: {
            ajaxTimeout: number;
        };
        ajax(url: string, options?: {
            data?: Object;
            headers?: Headers;
            contentType?: string;
            method?: string;
        }): Promise<{}>;
    }
}
declare namespace chitu {
}

declare module "maishu-chitu" { 
    export = chitu; 
}

declare module "chitu" { 
    export = chitu; 
}

