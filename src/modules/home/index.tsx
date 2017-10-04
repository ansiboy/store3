import { Page, Menu, app } from 'site';
import { StationService, ShoppingCartService, ShoppingService, imageUrl } from 'services';
// let { PageComponent, PageHeader, PageFooter, PageView, ImageBox, DataList, createHammerManager } = controls;
import Carousel = require('core/carousel');
import Hammer = require('hammer');
import * as ui from 'ui';

interface MyHomeProduct extends HomeProduct {
    Count: number;
}


export default async function (page: Page) {
    let station = page.createService(StationService);
    let shoppingCart = page.createService(ShoppingCartService);

    class IndexPage extends React.Component<{ products: MyHomeProduct[] }, {}>{

        private dataView: HTMLElement;
        private header: HTMLElement;

        constructor(props) {
            super(props);

            this.state = {};
        }

        private async loadData(pageIndex): Promise<MyHomeProduct[]> {
            let products = await station.proudcts(pageIndex);
            return products as MyHomeProduct[];
        }

        protected componentDidMount() {
        }

        addToShoppingCart(product: MyHomeProduct) {
            product.Count = (product.Count || 0) + 1;
            this.setState(this.state);
        }

        removeFormShoppingCart(product: MyHomeProduct) {
            if (product.Count < 1)
                return;

            product.Count = (product.Count || 0) - 1;
            this.setState(this.state);
        }

        redirect(o: HomeProduct) {
            location.hash = `#home_product?id=${o.ProductId}`;
            return;
        }

        settlement() {
            let products = this.props.products.filter(o => o.Count);
            let productIds = products.map(o => o.ProductId);
            let counts = products.map(o => o.Count);
            return shoppingCart.addItems(productIds, counts).then(() => this.buy());
        }

        buy() {
            var items = this.props.products.filter(o => o.Count);
            if (items.length <= 0)
                return;

            var productIds = items.map(o => o.ProductId);
            var quantities = items.map(o => o.Count);

            let shop = new ShoppingService();
            let result = shop.createOrder(productIds, quantities)
                .then((order) => {
                    app.redirect(`shopping_orderProducts?id=${order.Id}`)
                })

            return result;
        }

        render() {
            let products = this.props.products;
            let count = 0;
            let total = 0;
            products.filter(o => o.Count).forEach(o => {
                count = count + o.Count;
                total = total + o.Price * o.Count;
            });

            return (
                <div className="page">
                    <section className="main">
                        <div className="header">
                            <i className="icon-user pull-right" onClick={() => location.hash = `#user_index`}></i>
                        </div>
                        <div className="products container">
                            {products.map(o => [
                                <div key={o.Id} className="row">
                                    <div className='col-xs-3' onClick={() => this.redirect(o)}>
                                        <img src={imageUrl(o.ImagePath, 100)} className="img-responsive" />
                                    </div>
                                    <div className='col-xs-9 pull-left'>
                                        <div className="name interception" onClick={() => this.redirect(o)}>{o.Name}</div>
                                        <div className="title interception">{o.Title}</div>
                                        <div className="select">
                                            <div className='pull-left price'>￥{o.Price.toFixed(2)}</div>
                                            <div className='pull-right'>
                                                {!o.Count ?
                                                    <button className='btn-link'
                                                        ref={(e: HTMLButtonElement) => e ? e.onclick = () => this.addToShoppingCart(o) : null}>
                                                        <i className='icon-shopping-cart' />
                                                    </button> :
                                                    <div>
                                                        <i className="icon-minus-sign text-primary" onClick={() => this.removeFormShoppingCart(o)} />
                                                        <input className="number" type="number" value={o.Count as any}
                                                            onChange={(e) => {
                                                                let value = Number.parseInt((e.target as HTMLInputElement).value);
                                                                if (!value) return;

                                                                o.Count = value;
                                                                this.setState(this.state);
                                                            }} />
                                                        <i className="icon-plus-sign text-primary" onClick={() => this.addToShoppingCart(o)} />
                                                    </div>
                                                }
                                            </div>
                                        </div>
                                    </div>
                                </div>,
                                <hr />
                            ])}
                        </div >
                    </section>
                    <footer>
                        <div className="settlement">
                            <div className="pull-left">
                                <i className="icon-shopping-cart" />
                                {count ? <span className="badge bg-primary">{count}</span> : null}
                            </div>
                            <div className="pull-right">
                                <label>
                                    总计：<span className="price">￥{total.toFixed(2)}</span>
                                </label>
                                <button className="btn btn-primary" disabled={count == 0}
                                    ref={(e: HTMLButtonElement) => e ? e.onclick = ui.buttonOnClick(() => this.settlement()) : null}>
                                    结算
                                </button>
                            </div>

                        </div>
                    </footer>
                </div>
            );
        }
    }

    let products = await station.proudcts() as MyHomeProduct[];

    ReactDOM.render(<IndexPage products={products} />, page.element);
}

