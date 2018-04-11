import { Application as BaseApplication, Page as BasePage } from 'chitu.mobile';
import { userData } from 'services';

import siteMap from 'siteMap';

export class Application extends BaseApplication {
    // private topLevelPages = ['home.index', 'home.class', 'shopping.shoppingCart', 'home.newsList', 'user.index'];
    constructor() {
        super(siteMap);
        this.pageType = Page;

        this.pageCreated.add((sender, page) => this.onPageCreated(sender, page));
        this.error.add((sender, error, page) => this.onError(sender, error, page));
    }

    onPageCreated(sender: this, page: chitu.Page) {
        let pageName = page.name;
        if (pageName == 'index') {
            pageName = 'home_index';
        }
        let path = pageName.split('_').join('/');
        let cssPath = `css!content/app/` + path;
        requirejs([cssPath]);

        let className = pageName.split('_').join('-');
        page.element.className = `page ${className}`;
        // if (pageName == 'home_index') {
        //     page.displayStatic = true;
        // }
    }

    onError(sender: this, error: Error, page: chitu.Page) {
        // var currentPage = app.currentPage;
        switch (error.name) {
            case '600':     //600 为未知异常
            default:
                ui.alert({ title: '错误', message: error.message });
                console.log(error);
                break;
            case '724':     //724 为 token 失效
            case '601':     //601 为用户未登录异常
                if (error.name == '724') {
                    userData.userToken.value = '';
                }
                let isLoginPage = page.name == 'user.login';
                if (isLoginPage) {
                    return;
                }
                //========================================================
                // 1. 如果在打开页面的过程中页面出现未登录，就关掉打开的页面    
                // 2. 如果是点击按钮的时候出现未登录，就调转登录页面   
                let err = error as ServiceError;
                if ((err.method || 'get') == 'get') {
                    let target = siteMap.nodes.user_login;
                    app.showPage(target, { return: page.name });

                    page.close()
                    // setTimeout(() => currentPage.close(), 100);
                }
                else {
                    let target = siteMap.nodes.user_login;
                    app.redirect(target, { return: page.name });
                }
                //========================================================
                break;
            case '725':
                ui.alert({ title: '错误', message: 'application-key 配置错误' });
                break;
        }
    }

    // protected parseRouteString(routeString: string) {
    //     let routeData = new chitu.RouteData(this.fileBasePath, routeString, '_');
    //     return routeData;
    // }

    // protected createPage(routeData, args) {
    //     let page = super.createPage(routeData, args);// as Page;

    //     let path = routeData.actionPath.substr(routeData.basePath.length);
    //     let cssPath = `css!content/app` + path;
    //     requirejs([cssPath]);

    //     return page;
    // }
}


const loadingClassName = 'loading';
/** 是否为 APP */
let isCordovaApp = location.protocol === 'file:';
/** 是否为安卓系统 */
let isAndroid = navigator.userAgent.indexOf('Android') > -1;

export class Page extends BasePage {
    // private allowSwipeBackGestrue;
    // displayStatic;

    constructor(params) {
        super(params);

        //=========================================
        // 在 shown 加入转动，而不是一开始加，避免闪烁
        this.shown.add((sender: Page, args) => {
            let i = sender.element.querySelector('section.loading i') as HTMLElement;
            if (i)
                i.className = i.className + ' icon-spin';
        })
        //=========================================

        this.renderLoading();
    }

    private renderLoading() {
        ReactDOM.render(
            <div>
                <section className={loadingClassName}>
                    <div className="spin">
                        <i className="icon-spinner icon-spin"></i>
                    </div>
                </section>
            </div>,
            this.element
        );
    }

    private renderError() {
        ReactDOM.render(
            <div>
                <div className="norecords">
                    <div className="icon">
                        <i className="icon-rss">
                        </i>
                    </div>
                    <h4 className="text"></h4>
                    <button onClick={() => this.reload()} className="btn btn-default">点击重新加载页面</button>
                </div>

            </div>, this.element
        );
    }




    // createService<T extends Service>(serviceType: { new(): T }): T {
    //     let result = new serviceType();
    //     result.error.add((sender, error) => {
    //         errorHandle(app, error);
    //     })
    //     return result;
    // }

    reload() {
        let result = super.reload();
        this.renderLoading();
        return result;
    }
}

export function productNavBar() {
    return (
        <nav style={{ opacity: 1, backgroundColor: 'unset' }}>
            <button onClick={() => app.back()} className="leftButton">
                <i className="icon-chevron-left"></i>
            </button>
        </nav>
    );
}

export function searchNavBar() {
    return (
        <nav style={{ backgroundColor: 'white', borderBottom: 'solid 1px #ccc' }}>
            <button onClick={() => window['app'].back()} className="leftButton">
                <i className="icon-chevron-left"></i>
            </button>
        </nav>
    );
}



export let app: Application = window['app'] = window['app'] || new Application();



