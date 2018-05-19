import { Application as BaseApplication, Page as BasePage } from 'chitu.mobile';
import { userData } from 'services';

import siteMap from 'siteMap';

export class Application extends chitu.Application<chitu.SiteMapNode> {
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


}


const loadingClassName = 'loading';
export class Page extends BasePage {
    // private loadCompleted = false;

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

this.loadComplete.add

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

    reload() {
        let result = super.reload();
        this.renderLoading();
        return result;
    }
}

export let app: Application = window['app'] = window['app'] || new Application();



