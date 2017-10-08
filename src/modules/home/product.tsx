import { ShoppingService, ShoppingCartService, userData, ValueStore, imageUrl } from 'services';//,
import { Page, config, app } from 'site';
import * as ui from 'ui';


let productStore = new ValueStore<Product>();

export default async function (page: Page) {

    let shoppingCart = page.createService(ShoppingCartService);

    interface ProductPageState {
        productSelectedText: string,
        isFavored: boolean,
        content: string,
        count: number,
        product: Product;
        couponsCount?: number
    }

    let shop = page.createService(ShoppingService);
    let { id } = page.routeData.values
    let panelElement = document.createElement('div');
    page.element.appendChild(panelElement);

    class ProductPage extends React.Component<{ product: Product }, ProductPageState>{

        private header: controls.PageHeader;
        private productPanel: ProductPanel;
        private isShowIntroduceView = false;
        private isShowProductView = false;

        constructor(props) {
            super(props);
            this.state = {
                productSelectedText: this.productSelectedText(this.props.product),
                content: null,
                isFavored: false,
                count: 1,
                product: this.props.product
            };

            shop.isFavored(this.props.product.Id).then((isFavored) => {
                this.state.isFavored = isFavored;
                this.setState(this.state);
            });


            shop.storeCouponsCount().then(count => {
                this.state.couponsCount = count;
                this.setState(this.state);
            })

            shoppingCart.onChanged(this, () => {
                this.setState(this.state);
            })
        }

        private showPanel() {
            this.productPanel.show();
        }
        private productSelectedText(product: Product) {
            var str = '';
            var props = product.CustomProperties;
            for (var i = 0; i < props.length; i++) {
                var options = props[i].Options;
                for (var j = 0; j < options.length; j++) {
                    if (options[j].Selected) {
                        str = str + options[j].Name + ' ';
                        break;
                    }
                }
            }
            str = str + (this.state == null ? 1 : this.state.count) + '件';
            return str;
        }

        private shoppingCartChanged(items: ShoppingCartItem[]) {
            this.setState(this.state);
        }

        private favor() {
            let p: (productId: string) => Promise<any>
            if (this.state.isFavored) {
                p = shop.unfavorProduct;
            }
            else {
                p = shop.favorProduct;
            }

            return p.bind(shop)(this.props.product.Id).then(o => {
                this.state.isFavored = !this.state.isFavored;
                this.setState(this.state);
            })
        }

        addToShoppingCart(product: Product) {
            return shoppingCart.setItemCount(product, this.state.count);
        }

        updateProductCount(value) {
            this.state.count = value;
            this.state.productSelectedText = this.productSelectedText(this.props.product);
            this.state.content = null;
            this.setState(this.state);
        }

        updateStateByProduct(product: Product) {
            this.state.product = product;
            this.state.productSelectedText = this.productSelectedText(this.props.product);
            this.setState(this.state);
        }

        async renderIntroduceElement(e: HTMLElement) {
            if (!e) return;

            let content = await shop.productIntroduce(this.state.product.Id);
            e.innerHTML = content;
        }

        render() {
            let p = this.state.product;
            let { couponsCount } = this.state;
            let productsCount = shoppingCart.productsCount;
            return (
                <div>
                    <section className="main">
                        <div name="productImages" className="swiper-container">
                            <div className="swiper-wrapper">
                                {p.ImagePaths.map(o => (
                                    <div key={o} className="swiper-slide" style={{ textAlign: "center" }}>
                                        <img src={imageUrl(o)} className="img-responsive-100 img-full">
                                        </img>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="container">
                            <div name="productName" className="pull-left" style={{ width: '100%', marginLeft: '-20px' }}>
                                <h4 className="text-left" style={{ fontWeight: 'bold', paddingLeft: '20px' }}>{p.Name}</h4>
                            </div>

                            <div className="col-xs-12 box">
                                <span>类别：</span>
                                <a href="">{p.ProductCategoryName}</a>
                            </div>

                            <div className="col-xs-12 box">
                                <span className="pull-left">价格：<strong className="price">￥{p.Price.toFixed(2)}</strong></span>
                                <span className="pull-left" style={{ display: p.Score == null ? 'none' : 'block' }}>积分：<strong className="price">{this.props.product.Score}</strong></span>
                                <span className="pull-right">{p.Unit}</span>
                                <div className="clearfix"></div>
                                <p className="oldprice" style={{ display: p.MemberPrice != null && p.MemberPrice != p.Price ? 'block' : 'none' }}>
                                    促销价：<span className="price">￥{p.MemberPrice.toFixed(2)}</span>
                                </p>
                            </div>

                            <div onClick={() => this.showPanel()} className="col-xs-12 box">
                                <div className="pull-left">
                                    <span>已选：</span>
                                    <span>{this.state.productSelectedText}</span>
                                </div>
                                <div className="pull-right">
                                    <i className="icon-chevron-right"></i>
                                </div>
                            </div>

                            {p.Promotions.length > 0 ?
                                <div className="col-xs-12 box" style={{ padding: '10px 0px 10px 0px' }}>
                                    {p.Promotions.map((o, i) => (
                                        <PromotionComponent key={i} promotion={o}></PromotionComponent>
                                    ))}
                                </div> : null
                            }
                        </div>
                        {couponsCount ? <hr /> : null}
                        {couponsCount ?
                            <div className="container">
                                <a className="col-xs-12" style={{ padding: '0px 0px 10px 0px' }} href="#shopping_storeCoupons">
                                    <div className="pull-left">
                                        店铺优惠劵
                                </div>
                                    <div className="pull-right">
                                        <span className="badge bg-primary" style={{ marginRight: 10 }}>{couponsCount}</span>
                                        <i className="icon-chevron-right"></i>
                                    </div>
                                </a>
                            </div>
                            : null}
                        <hr />
                        <div className="container">
                            <h4 style={{ fontWeight: 'bold', width: '100%' }}>商品信息</h4>
                            {p.Arguments.map(o => (
                                <div key={o.key} style={{ marginBottom: '10px' }}>
                                    <div className="pull-left" style={{ width: '100px' }}>{o.key}</div>
                                    <div style={{ marginLeft: '100px' }}>{o.value}</div>
                                    <div className="clearfix"></div>
                                </div>
                            ))}
                            <div style={{
                                height: '120px', paddingTop: '40px', textAlign: 'center',
                                display: p.Arguments == null || p.Arguments.length == 0 ? 'block' : 'none'
                            }}>
                                <h4>暂无商品信息</h4>
                            </div>
                        </div>
                        <hr />
                        <div className="container" ref={(e: HTMLElement) => this.renderIntroduceElement(e)}>

                        </div>

                    </section>
                    <footer style={{ position: 'absolute' }}>
                        <nav>
                            <a href={'#shopping_shoppingCartNoMenu'} className="pull-left">
                                <i className="icon-shopping-cart"></i>
                                {productsCount ?
                                    <span className="badge bg-primary">{productsCount}</span>
                                    : null
                                }
                            </a>
                            <button className="btn btn-primary pull-right"
                                ref={(e: HTMLButtonElement) => e ? e.onclick = ui.buttonOnClick(() => this.addToShoppingCart(p)) : null} >加入购物车</button>
                        </nav>
                    </footer>
                    <ProductPanel ref={(o) => this.productPanel = o} parent={this} product={this.props.product} />
                </div>

            );
        }
    }

    class ProductPanel extends React.Component<{ product: Product, parent: ProductPage } & React.Props<ProductPanel>,
        { product: Product, count: number }> {

        private panel: Panel;

        constructor(props) {
            super(props);
            this.state = { product: this.props.product, count: this.props.parent.state.count };
        }
        private decrease() {
            let count = this.state.count;
            if (count == 1) {
                return;
            }

            count = count - 1;
            this.state.count = count;
            this.setState(this.state);
            this.props.parent.updateProductCount(count);
        }
        private increase() {
            let count = this.state.count;
            count = count + 1;
            this.state.count = count;
            this.setState(this.state);
            this.props.parent.updateProductCount(count);
        }
        private onProductsCountInputChanged(event: Event) {
            let value = Number.parseInt((event.target as HTMLInputElement).value);
            if (!value) return;

            this.state.count = value;
            this.setState(this.state);
            this.props.parent.updateProductCount(value);
        }
        private onFieldSelected(property: CustomProperty, name: string) {
            property.Options.forEach(o => {
                o.Selected = o.Name == name
            })

            var properties: { [name: string]: string } = {};
            this.state.product.CustomProperties.forEach(o => {
                properties[o.Name] = o.Options.filter(c => c.Selected)[0].Value;
            });

            return shop.productByProperies(this.state.product.GroupId, properties)
                .then(o => {
                    this.state.product = o;
                    this.setState(this.state);
                    productStore.value = o;
                });
        }
        show() {
            this.panel.show('right');
        }
        render() {
            let p = this.state.product;
            return (
                <Panel ref={(o) => this.panel = o}
                    header={
                        <div>
                            <nav>
                                <ul className="nav nav-tabs">
                                    <li className="text-left" style={{ width: '30%' }}>
                                        <button onClick={() => this.panel.hide()} style={{ border: 'none', padding: 10, backgroundColor: 'inherit' }}>关闭</button>
                                    </li>
                                </ul>
                            </nav>
                            <div style={{ paddingTop: "10px" }}>
                                <div className="pull-left" style={{ width: 80, height: 80, marginLeft: 10 }}>
                                    <img src={imageUrl(p.ImagePath, 50)} className="img-responsive"
                                        ref={(e: HTMLImageElement) => e ? ui.renderImage(e) : null} />
                                </div>
                                <div style={{ marginLeft: 100, marginRight: 70 }}>
                                    <div>{p.Name}</div>
                                    <div className="price">￥{p.Price.toFixed(2)}</div>
                                </div>
                            </div>
                            <div className="clearfix"></div>
                        </div>
                    }
                    body={
                        <div>
                            {p.CustomProperties.map(o => (
                                <div key={o.Name} className="container row">
                                    <div className="pull-left" style={{ width: 60 }}>
                                        <span>{o.Name}</span>
                                    </div>
                                    {o.Options.map(c => (
                                        <div key={c.Name} style={{ marginLeft: 60 }}>
                                            <button onClick={() => this.onFieldSelected(o, c.Name)} className={c.Selected ? 'cust-prop selected' : 'cust-prop'}>{c.Name}</button>
                                        </div>
                                    ))}
                                </div>
                            ))}
                        </div>
                    }
                    footer={
                        <div>
                            <div className="form-group">
                                <div style={{ width: 60, textAlign: 'left' }} className="pull-left">
                                    <span>数量</span>
                                </div>
                                <div style={{ marginLeft: 60 }}>
                                    <div className="input-group">
                                        <span className="input-group-btn">
                                            <button className="btn btn-default" onClick={this.decrease.bind(this)}>
                                                <span className="icon-minus"></span>
                                            </button>
                                        </span>
                                        <input className="form-control" type="number" value={`${this.state.count}`}
                                            onChange={this.onProductsCountInputChanged.bind(this)} />
                                        <span className="input-group-btn">
                                            <button className="btn btn-default" onClick={this.increase.bind(this)}>
                                                <span className="icon-plus"></span>
                                            </button>
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <div className="clearfix"></div>
                            <button onClick={() => { this.props.parent.addToShoppingCart(p); this.panel.hide() }} className="btn btn-primary btn-block"
                                data-dialog="toast:'成功添加到购物车'">
                                加入购物车
                        </button>
                        </div>
                    } />
            );
        }
    }

    shop.product(id).then((product) => {
        let productPage = ReactDOM.render(
            <ProductPage product={product} />,
            page.element
        )
    });

}



class PromotionComponent extends React.Component<
    { promotion: Promotion, key: any },
    { status: 'collapse' | 'expand' }>{

    constructor(props) {
        super(props);
        this.state = { status: 'collapse' };
    }

    toggle() {
        if (this.state.status == 'collapse') {
            this.state.status = 'expand';
        }
        else {
            this.state.status = 'collapse';
        }
        this.setState(this.state);
    }

    render() {
        let type = this.props.promotion.Type;
        let contents = this.props.promotion.Contents;
        let status = this.state.status;
        return (
            <div className="media">
                <div className="media-left" >
                    <span style={{ display: type.indexOf('Given') >= 0 ? 'block' : 'none' }} className="label label-info" >满赠</span>
                    <span style={{ display: type.indexOf('Reduce') >= 0 ? 'block' : 'none' }} className="label label-success" >满减</span>
                    <span style={{ display: type.indexOf('Discount') >= 0 ? 'block' : 'none' }} className="label label-warning" >满折</span>
                </div>
                <div onClick={() => this.toggle()} className="media-body">
                    {contents.map((o, i) => (
                        <div key={i} style={{ display: status == 'expand' || i == 0 ? 'block' : 'none', margin: '0 0 8px 0' }}>
                            {o.Description}
                        </div>
                    ))}
                </div>
                {contents.length > 1 ?
                    <div onClick={() => this.toggle()} className="media-right">
                        <i className={status == 'collapse' ? "icon-chevron-down" : 'icon-chevron-up'}></i>
                    </div> : null}
            </div >
        );
    }
}

export interface PanelProps extends React.Props<Panel> {
    header?: JSX.Element;
    body?: JSX.Element;
    footer?: JSX.Element;
}
export class Panel extends React.Component<PanelProps, {}>{

    private panel: HTMLElement;
    private modalDialog: HTMLElement;
    private header: HTMLElement;
    private body: HTMLElement;
    private footer: HTMLElement;
    private modal: HTMLElement;
    private backdrop: HTMLElement;

    constructor(props) {
        super(props);
    }
    show(from: 'left' | 'right' | 'top' | 'bottom') {
        let header = this.header; //this.refs['header'] as HTMLElement;
        let body = this.body; //this.refs['body'] as HTMLElement;
        let footer = this.footer; //this.refs['footer'] as HTMLElement;
        let panel = this.panel; //this.refs['panel'] as HTMLElement;
        let modal = this.modal; //this.refs['modal'] as HTMLElement;
        let backdrop = this.backdrop; //this.refs['backdrop'] as HTMLElement;

        panel.style.display = 'block';
        modal.style.display = 'block';

        window.setTimeout(() => {
            modal.style.transform = 'translateX(0)';
            backdrop.style.opacity = '0.5';
        }, 50);

        console.assert(header != null && body != null && footer != null);
        let setBodyHeight = () => {
            let headerHeight = header.getBoundingClientRect().height;
            let footerHeight = footer.getBoundingClientRect().height;
            let bodyHeight = window.innerHeight - headerHeight - footerHeight;
            body.style.height = `${bodyHeight}px`;
        };
        window.addEventListener('resize', () => setBodyHeight());
        setBodyHeight();
    }
    hide() {
        this.modal.style.removeProperty('transform');
        this.backdrop.style.opacity = '0';
        window.setTimeout(() => {
            this.panel.style.display = 'none';
        }, 500);
    }
    protected componentDidMount() {
        //=====================================================================
        // 点击非窗口区域，关窗口。并禁用上级元素的 touch 操作。
        let panel = this.panel; //this.refs['panel'] as HTMLElement;
        let modalDialog = this.modalDialog; //this.refs['modalDialog'] as HTMLElement;
        panel.addEventListener('touchstart', (event) => {
            let dialogRect = modalDialog.getBoundingClientRect();
            for (let i = 0; i < event.touches.length; i++) {
                let { clientX } = event.touches[i];
                if (clientX < dialogRect.left) {
                    this.hide();
                    return;
                }
            }
        });

        let isIOS = navigator.userAgent.indexOf('iPhone') > 0 || navigator.userAgent.indexOf('iPad') > 0;
        if (isIOS) {
            panel.addEventListener('touchstart', (event) => {
                let tagName = (event.target as HTMLElement).tagName;
                if (tagName == 'BUTTON' || tagName == 'INPUT' || tagName == 'A') {
                    return;
                }
                event.stopPropagation();
                event.preventDefault();
            });
        }
    }
    render() {
        return <div ref={(o: HTMLElement) => this.panel = o} className="product-panel">
            <div ref={(o: HTMLElement) => this.modal = o} className="modal">
                <div ref={(o: HTMLElement) => this.modalDialog = o} className="modal-dialog">
                    <div className="modal-content">
                        {this.props.header ?
                            <div ref={(o: HTMLElement) => this.header = o} className="modal-header">
                                {this.props.header}
                            </div>
                            : null
                        }
                        {this.props.body ?
                            <div ref={(o: HTMLElement) => this.body = o} className="modal-body">
                                {this.props.body}
                            </div>
                            : null
                        }
                        {this.props.footer ?
                            <div ref={(o: HTMLElement) => this.footer = o} className="modal-footer">
                                {this.props.footer}
                            </div>
                            : null
                        }
                    </div>
                </div>render1
            </div>
            <div ref={(o: HTMLElement) => this.backdrop = o} className="modal-backdrop in">
            </div>
        </div>;
    }
    render1() {
        return <div ref="panel" className="product-panel">
            <div ref="modal" className="modal">
                <div ref="modalDialog" className="modal-dialog">
                    <div className="modal-content">
                        <div ref="header" className="modal-header">
                            {this.props.header}
                        </div>
                        <div ref="body" className="modal-body">
                            {this.props.body}
                        </div>
                        <div ref="footer" className="modal-footer">
                            {this.props.footer}
                        </div>
                    </div>
                </div>
            </div>
            <div ref="backdrop" className="modal-backdrop in">
            </div>
        </div>;
    }
}
