import { ShoppingService, shoppingCart, userData, ValueStore, imageUrl } from 'services';//,
import { config, app, PageProps } from 'site';
import * as ui from 'ui';
import { AddToShoppingCart } from 'components/addToShoppingCart'
import siteMap from 'siteMap';

let productStore = new ValueStore<Product>();

// export default async function (page: chitu.Page) {

interface ProductPageState {
    // productSelectedText: string,
    isFavored: boolean,
    content: string,
    count: number,
    couponsCount?: number
}

// let shop = page.createService(ShoppingService);
// let { id } = page.data
// let panelElement = document.createElement('div');
// page.element.appendChild(panelElement);

interface Props {
    product: Product,
    // active: chitu.Callback1<chitu.Page, chitu.PageData>,
    createService: <T extends chitu.Service>(type: chitu.ServiceConstructor<T>) => T,
}


export class ProductPage extends React.Component<Props, ProductPageState>{

    private shop: ShoppingService;
    private header: controls.PageHeader;
    private isShowIntroduceView = false;
    private isShowProductView = false;
    private shoppingCartIcon: HTMLElement;
    private mainView: HTMLElement;
    private productNameContainer: HTMLElement;

    constructor(props) {
        super(props);
        this.state = {
            content: `<div style="padding-top:100px;padding-bottom:200px;text-align:center">数据正在加载中...</div>`,
            isFavored: false,
            count: 1,
        };
        this.shop = this.props.createService(ShoppingService);
    }

    private favor() {
        let p: (productId: string) => Promise<any>
        if (this.state.isFavored) {
            p = this.shop.unfavorProduct;
        }
        else {
            p = this.shop.favorProduct;
        }

        return p.bind(this.shop)(this.props.product.Id).then(o => {
            this.state.isFavored = !this.state.isFavored;
            this.setState(this.state);
        })
    }

    addToShoppingCart(product: Product) {
        return shoppingCart.setItemCount(product, this.state.count);
    }

    settlement() {
        var items = shoppingCart.items.value;
        if (items.length <= 0)
            return;

        var productIds = items.map(o => o.ProductId);
        var quantities = items.map(o => o.Count);

        let result = this.shop.createOrder(productIds, quantities)
            .then((order) => {
                let target = siteMap.nodes.shopping_orderProducts;
                app.redirect(target, { id: order.Id })
            })

        return result;
    }

    componentDidMount() {

        this.shop.isFavored(this.props.product.Id).then((isFavored) => {
            this.state.isFavored = isFavored;
            this.setState(this.state);
        });


        this.shop.storeCouponsCount().then(count => {
            this.state.couponsCount = count;
            this.setState(this.state);
        })

        shoppingCart.onChanged(this, () => {
            this.setState(this.state);
        })

        this.shop.productIntroduce(this.props.product.Id).then(data => {
            this.state.content = data;
            this.setState(this.state);
        });

        let productNameContainerOffsetTop: number;
        this.mainView.onscroll = (event) => {
            if (productNameContainerOffsetTop == null)
                productNameContainerOffsetTop = this.productNameContainer.offsetTop;

            let deltaY = this.mainView.scrollTop - productNameContainerOffsetTop;
            if (deltaY >= 0) {
                this.productNameContainer.style.position = 'fixed';
                this.productNameContainer.style.top = '0';
            }
            else {
                this.productNameContainer.style.removeProperty('position')
                this.productNameContainer.style.removeProperty('top');
                productNameContainerOffsetTop = null;
            }
        };

        // this.props.active.add((sender, args) => {
        //     debugger;
        // })

    }

    render() {
        let p = this.props.product;
        let { couponsCount } = this.state;
        let productsCount = shoppingCart.productsCount;
        if (p == null) {
            return null;
        }
        return (
            <div className="page">
                <section className="main" ref={(e: HTMLElement) => this.mainView = e || this.mainView}>
                    <div name="productImages" className="swiper-container">
                        <div className="swiper-wrapper">
                            <div key={p.ImagePath} className="swiper-slide" style={{ textAlign: "center" }}>
                                <img src={imageUrl(p.ImagePath)} className="img-responsive-100 img-full">
                                </img>
                            </div>
                        </div>
                    </div>

                    <div className="productName box"
                        ref={(e: HTMLElement) => this.productNameContainer = e || this.productNameContainer}>
                        <AddToShoppingCart className={"pull-right"} product={p}
                            shoppingCartIcon={() => this.shoppingCartIcon} />
                        <div style={{ paddingTop: 6 }}>
                            <span>{p.Name}</span>
                            <strong className="price">￥{p.Price.toFixed(2)}</strong>
                        </div>
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

                    <div className="container" style={{ background: 'whitesmoke' }} dangerouslySetInnerHTML={{ __html: this.state.content }}>
                    </div>

                </section>
                <footer style={{ position: 'absolute' }}>
                    <nav>
                        <a href={'#shopping_shoppingCartNoMenu'} className="pull-left">
                            <i className="icon-shopping-cart" ref={(e: HTMLElement) => this.shoppingCartIcon = e}></i>
                            {productsCount ?
                                <span className="badge bg-primary">{productsCount}</span>
                                : null
                            }
                        </a>
                        <a className="btn btn-primary pull-right" style={{ width: 100 }}
                            ref={(e: HTMLButtonElement) => e ? e.onclick = ui.buttonOnClick(() => this.settlement()) : null} >去结算</a>
                    </nav>
                </footer>
            </div>

        );
    }
}

export default async function (page: chitu.Page) {
    let shop = page.createService(ShoppingService);
    let product = await shop.product(page.data.id);
    let props = {
        shop,
        product,
        createService: page.createService,
    } as Props;

    ReactDOM.render(<ProductPage {...props} />, page.element);

}


// let product = await shop.product(id);
// let productPage = ReactDOM.render(
//     <ProductPage product={product} />,
//     page.element
// );
// }

