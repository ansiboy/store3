import { Service, shoppingCart, userData, ValueStore } from 'services';
import { Application as BaseApplication } from 'chitu.mobile';
import errorHandle from 'errorHandle';
import * as ui from 'ui';

/** 监听 shoppingCart 错误  */
shoppingCart.error.add((sender, error) => {
    errorHandle(app, error);
})

/** 是否为 APP */
let isCordovaApp = location.protocol === 'file:';
/** 是否为安卓系统 */
export let isAndroid = navigator.userAgent.indexOf('Android') > -1;
/** 是否允浸入式头 */
let allowImmersionHeader = false;
let topLevelPages = ['home.index', 'home.class', 'shopping.shoppingCart', 'home.newsList', 'user.index'];

const loadingClassName = 'loading';

if (isCordovaApp && !isAndroid) {
    allowImmersionHeader = true;
}

export let config = {
    defaultUrl: 'home_index'
}

export class Menu extends React.Component<{ pageName: string }, { itemsCount: number }> {
    private productsCountSubscribe: (value: number) => void;

    constructor(props) {
        super(props);
        // let shoppingCart = (app.getPage(this.props.pageName) as Page).createService(ShoppingCartService);
        this.state = { itemsCount: shoppingCart.productsCount || 0 };
        shoppingCart.onChanged(this, (value) => {
            this.state.itemsCount = shoppingCart.productsCount;
        });
    }
    componentDidMount() {
        let menuElement = this.refs['menu'] as HTMLElement;
        var activeElement = menuElement.querySelector(`[name="${this.props.pageName}"]`) as HTMLElement;
        if (activeElement) {
            activeElement.className = 'active';
        }
    }

    render() {
        return (
            <ul ref="menu" className="menu" style={{ marginBottom: '0px' }}>
                <li>
                    <a name="home.index" onClick={() => app.redirect('home_index')}>
                        <i className="icon-home"></i>
                        <span>首页</span>
                    </a>
                </li>
                <li>
                    <a name="home.class" onClick={() => app.redirect('home_class')}>
                        <i className="icon-th-large"></i>
                        <span>分类</span>
                    </a>
                </li>
                <li>
                    <a name="shopping.shoppingCart" onClick={() => app.redirect('shopping_shoppingCart')}>
                        <i className="icon-shopping-cart"></i>
                        <sub name="products-count" style={{ display: this.state.itemsCount <= 0 ? 'none' : 'block' }} className="sub">
                            {this.state.itemsCount}
                        </sub>
                        <span>购物车</span>
                    </a>

                </li>
                <li>
                    <a name="home.newsList" onClick={() => app.redirect('home_newsList')}>
                        <i className="icon-rss"></i>
                        <span>微资讯</span>
                    </a>
                </li>
                <li>
                    <a name="user.index" onClick={() => app.redirect('user_index')}>
                        <i className="icon-user"></i>
                        <span>我</span>
                    </a>
                </li>
            </ul>
        );
    }
}

export class Page extends chitu.Page {
    private allowSwipeBackGestrue;
    private displayStatic;

    constructor(params) {
        super(params);


        let className = this.routeData.pageName.split('.').join('-');
        this.element.className = (allowImmersionHeader ? 'page immersion ' : 'page ') + className;
        this.displayStatic = topLevelPages.indexOf(this.name) >= 0 || this.name == 'home.search';

        //=========================================
        // 在 shown 加入转动，而不是一开始加，避免闪烁
        this.shown.add((sender: Page, args) => {
            let i = sender.element.querySelector('section.loading i') as HTMLElement;
            if (i)
                i.className = i.className + ' icon-spin';
        })
        //=========================================

        //===================================================
        // IOS WEB 浏览器自带滑动返回
        this.allowSwipeBackGestrue = (isCordovaApp || isAndroid) && topLevelPages.indexOf(this.routeData.pageName) < 0;
        //===================================================readonly

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
                {this.createHeader()}

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

    private createHeader() {
        let noneHeaderPages = ['user.index'];
        if (noneHeaderPages.indexOf(this.routeData.pageName) >= 0) {
            return;
        }

        let navBar;
        switch (this.routeData.pageName) {
            case 'home.product':
                navBar = productNavBar();
                break;
            case 'home.search':
                navBar = searchNavBar();
                break;
            default:
                let isTopPage = topLevelPages.indexOf(this.routeData.pageName) >= 0;
                navBar = defaultNavBar({ showBackButton: !isTopPage });
                break;
        }

        return <header>{(navBar)}</header>;
    }

    createService<T extends Service>(serviceType: { new(): T }): T {
        let result = new serviceType();
        result.error.add((sender, error) => {
            errorHandle(app, error);
        })
        return result;
    }

    reload() {
        let result = super.reload();
        this.renderLoading();
        return result;
    }
}

export class Application extends BaseApplication {
    private topLevelPages = ['home.index', 'home.class', 'shopping.shoppingCart', 'home.newsList', 'user.index'];
    constructor() {
        super();
        this.pageType = Page;
    }

    protected parseRouteString(routeString: string) {
        let routeData = new chitu.RouteData(this.fileBasePath, routeString, '_');
        return routeData;
    }

    protected createPage(routeData: chitu.RouteData, args) {
        let page = super.createPage(routeData, args);// as Page;

        let path = routeData.actionPath.substr(routeData.basePath.length);
        let cssPath = `css!content/app` + path;
        requirejs([cssPath]);

        return page;
    }
}

export let app = window['app'] = new Application();
app.backFail.add(() => {
    app.redirect(config.defaultUrl);
});


if (!location.hash) {
    app.redirect(config.defaultUrl);
}

//============================================================
// ui
export function defaultNavBar(options?: { title?: string, showBackButton?: boolean, right?: JSX.Element, back?: () => void }) {
    options = options || {};
    let title = options.title || '';
    let showBackButton = options.showBackButton == null ? true : options.showBackButton;
    let back = options.back || (() => app.back());
    return (
        <nav className="bg-primary">
            <div className="col-xs-3" style={{ padding: 0 }}>
                {showBackButton ?
                    <button name="back-button" onClick={() => back()} className="left-button" style={{ opacity: 1 }}>
                        <i className="icon-chevron-left"></i>
                    </button> :
                    <span></span>
                }
            </div>
            <div className="col-xs-6" style={{ padding: 0 }}>
                <h4>
                    {title}
                </h4>
            </div>
            <div className="col-xs-3" style={{ padding: 0 }}>
                {options.right ? (options.right) : null}
            </div>
        </nav>
    );
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
//============================================================
export function formatDate(date: Date) {
    if (!date.getFullYear)
        return date;

    let d = date;
    return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()} ${d.getHours() + 1}:${d.getMinutes()}`;
}


export let env = {
    isWeiXin() {
        var ua = navigator.userAgent.toLowerCase();
        return (ua.match(/MicroMessenger/i) as any) == 'micromessenger';
    }
}