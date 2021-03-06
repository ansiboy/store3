import { Service, shoppingCart, userData, ValueStore } from 'services';
import { Application as BaseApplication, Page as BasePage } from 'chitu.mobile';
import errorHandle from 'errorHandle';
import * as ui from 'ui';
import { SiteMap, SiteMapNode } from 'chitu';
export { app, Page } from 'application';
import { app } from 'application';
import { siteMap } from './site';
export { PageProps, default as siteMap } from 'siteMap';

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
                    <a name="home.index" onClick={() => app.redirect(siteMap.nodes.home_index)}>
                        <i className="icon-home"></i>
                        <span>首页</span>
                    </a>
                </li>
                <li>
                    <a name="home.class" onClick={() => app.redirect(siteMap.nodes.home_class)}>
                        <i className="icon-th-large"></i>
                        <span>分类</span>
                    </a>
                </li>
                <li>
                    <a name="shopping.shoppingCart" onClick={() => app.redirect(siteMap.nodes.shopping_shoppingCartNoMenu)}>
                        <i className="icon-shopping-cart"></i>
                        <sub name="products-count" style={{ display: this.state.itemsCount <= 0 ? 'none' : 'block' }} className="sub">
                            {this.state.itemsCount}
                        </sub>
                        <span>购物车</span>
                    </a>

                </li>
                <li>
                    <a name="user.index" onClick={() => app.redirect(siteMap.nodes.user_index)}>
                        <i className="icon-user"></i>
                        <span>我</span>
                    </a>
                </li>
            </ul>
        );
    }
}


//shopping_shoppingCartNoMenu



// export let app = window['app'] = new Application();

// app.backFail.add(() => {
//     app.redirect(config.defaultUrl);
// });


// if (!location.hash) {
//     app.redirect(config.defaultUrl);
// }

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


//============================================================
export function formatDate(date: Date) {
    if (!date.getFullYear)
        return date;

    let d = date;
    return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()} ${d.getHours() + 1}:${d.getMinutes()}`;
}


