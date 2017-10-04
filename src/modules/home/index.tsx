import { Page, Menu, app } from 'site';
import { StationService, ShoppingCartService, ShoppingService, imageUrl } from 'services';
import Carousel = require('core/carousel');
import Hammer = require('hammer');
import * as ui from 'ui';

interface ProductExt extends Product {
    Count: number;
}


export default async function (page: Page) {
    let station = page.createService(StationService);
    let shoppingCart = page.createService(ShoppingCartService);
    let shop = page.createService(ShoppingService);

    interface IndexPageStatus {
        shoppingCartItems: ShoppingCartItem[]
    }

    interface IndexPageProps {
        products: ProductExt[]
    }

    class IndexPage extends React.Component<IndexPageProps, IndexPageStatus>{

        private dataView: HTMLElement;
        private header: HTMLElement;

        constructor(props) {
            super(props);

            this.state = { shoppingCartItems: shoppingCart.items.value };
            // shoppingCart.itemChanged.add(() => {

            //     debugger;
            // });
            shoppingCart.onChanged(this, (value) => {
                this.state.shoppingCartItems = value;
                this.setState(this.state);
            })
        }

        private async loadData(pageIndex): Promise<ProductExt[]> {
            let products = await station.proudcts(pageIndex);
            return products as ProductExt[];
        }

        protected componentDidMount() {
        }

        addToShoppingCart(product: ProductExt) {
            product.Count = (product.Count || 0) + 1;
            shoppingCart.setItemCount(product, product.Count);
            this.setState(this.state);
        }

        removeFormShoppingCart(product: ProductExt) {
            if (product.Count < 1)
                return;

            product.Count = (product.Count || 0) - 1;
            shoppingCart.setItemCount(product, product.Count);
            this.setState(this.state);
        }

        redirect(o: Product) {
            location.hash = `#home_product?id=${o.Id}`;
            return;
        }

        settlement() {
            var items = this.props.products.filter(o => o.Count);
            if (items.length <= 0)
                return;

            var productIds = items.map(o => o.Id);
            var quantities = items.map(o => o.Count);

            let result = shop.createOrder(productIds, quantities)
                .then((order) => {
                    app.redirect(`shopping_orderProducts?id=${order.Id}`)
                })

            return result;
        }

        render() {
            let products = this.props.products;
            let shoppingCartItems = this.state.shoppingCartItems;
            products.forEach(o => {
                o.Count = shoppingCartItems.filter(p => p.ProductId == o.Id).map(o => o.Count)[0] || 0;
            })

            let count = 0;
            let total = 0;
            shoppingCartItems.filter(o=>o.Count).filter(o=>{
                count = count + o.Count;
                total = total + o.Price * o.Count;
            })
            
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
                                            <div className='pull-right' style={{ height: 28 }}>
                                                <div style={{ display: o.Count == 0 ? 'block' : 'none' }}>
                                                    <button className='btn-link'
                                                        ref={(e: HTMLButtonElement) => e ? e.onclick = () => this.addToShoppingCart(o) : null}>
                                                        <i className='icon-shopping-cart' />
                                                    </button>
                                                </div>
                                                <div style={{ display: o.Count > 0 ? 'block' : 'none' }}>
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
                                                {/* } */}
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
                                <i className="icon-shopping-cart" onClick={() => app.redirect('shopping_shoppingCartNoMenu')} />
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

    let shoppingCartItems: ShoppingCartItem[];
    // let products = await Promise.all([station.proudcts(), shoppingCart.getItems()])
    //     .then(data => {
    //         let products = data[0] as ProductExt[];
    //         shoppingCartItems = data[1];
    //         products.forEach(o => {
    //             o.Count = shoppingCartItems.filter(p => p.ProductId == o.Id).map(o => o.Count)[0] || 0;
    //         })
    //         return products;
    //     })
    let products = await station.proudcts() as ProductExt[];

    ReactDOM.render(<IndexPage products={products} />, page.element);
}

