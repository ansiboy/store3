import { Page, Menu, app, env } from 'site';
import { StationService, shoppingCart, ShoppingService, WeiXinService, imageUrl, LocationService } from 'services';
import Carousel = require('core/carousel');
import Hammer = require('hammer');
import * as ui from 'ui';
import wx = require('jweixin');
import { Argumnets as LocationPageArguments } from 'modules/home/location'

export default async function (page: Page) {
    let station = page.createService(StationService);
    let shop = page.createService(ShoppingService);

    interface IndexPageStatus {
        shoppingCartItems: ShoppingCartItem[],
        address: string,
        activeCategory: string
    }

    interface IndexPageProps {
        products: Product[],
        categories: string[]
    }

    class IndexPage extends React.Component<IndexPageProps, IndexPageStatus>{
        private coordinate: { lon: number; lat: number; };

        private mainView: HTMLElement;
        private header: HTMLElement;
        private footer: HTMLElement;
        private shoppingCartElement: HTMLElement;
        private locationing: boolean;

        private elementCategoryAttr = 'data-category';

        constructor(props) {
            super(props);

            this.state = {
                shoppingCartItems: shoppingCart.items.value,
                address: '',
                activeCategory: this.props.categories[0]
            };

            shoppingCart.onChanged(this, (value) => {
                this.state.shoppingCartItems = value;
                this.setState(this.state);
            });
        }

        location() {
            if (this.locationing == true)
                return;

            this.locationing = true;
            let location = new LocationService();
            this.state.address = '正在定位中...';
            this.setState(this.state);
            location.address()
                .then(o => {
                    this.state.address = o.address;
                    this.coordinate = o.coordinate;
                    this.setState(this.state);
                    this.locationing = false;
                })
                .catch(err => {
                    this.state.address = (err as Error).message;
                    this.setState(this.state);
                    this.locationing = false;
                })

        }

        showLocationPage() {
            let args: LocationPageArguments = {
                onAddressSelected: (address: string) => {
                    this.state.address = address;
                    this.setState(this.state);
                    app.back();

                },
                currentAddress: this.state.address,
            };

            let locationPage = app.redirect('home_location', args);
        }

        scrollTo(categoryName: string) {
            let element = page.element.querySelector(`[${this.elementCategoryAttr}=${categoryName}]`) as HTMLElement;
            console.assert(element != null);
            let y = element.offsetTop;

            let HEADER_HEIGHT = 40;
            let PADDING = 16;

            // this.mainView.scrollTop = element.offsetTop - (HEADER_HEIGHT + PADDING);
            let to = element.offsetTop - (HEADER_HEIGHT + PADDING);
            animateScrollTo(this.mainView, to, 100);
            this.state.activeCategory = categoryName;
            this.setState(this.state);
            // page.element.scrollTo(0, y);
        }

        private async loadData(pageIndex): Promise<Product[]> {
            let products = await station.proudcts(pageIndex);
            return products as Product[];
        }

        addToShoppingCart(product: Product, count: number) {
            count = count + 1;
            shoppingCart.setItemCount(product, count);
        }

        minusFormShoppingCart(product: Product, count: number) {
            if (count < 1)
                return;

            count = (count || 0) - 1;
            shoppingCart.setItemCount(product, count);
        }

        redirect(o: Product) {
            location.hash = `#home_product?id=${o.Id}`;
            return;
        }

        settlement() {
            var items = shoppingCart.items.value.filter(o => o.Count > 0);
            if (items.length <= 0)
                return;

            var productIds = items.map(o => o.ProductId);
            var quantities = items.map(o => o.Count);

            let result = shop.createOrder(productIds, quantities)
                .then((order) => {
                    app.redirect(`shopping_orderProducts?id=${order.Id}`)
                })

            return result;
        }

        componentDidMount() {

            this.mainView.ontouchend = (event) => {
                console.log('touch end');
            }
            this.mainView.ontouchmove = (event) => {
                console.log('touch move');
            }
            this.mainView.onscroll = (event) => {

                let element = document.elementFromPoint(300, 80);
                let itemElement: Element;

                do {
                    if ((element.className || '').indexOf('row') >= 0) {
                        itemElement = element;
                        break;
                    }

                    element = element.parentElement;
                }
                while (element != null);

                if (itemElement) {
                    let category = itemElement.getAttribute(this.elementCategoryAttr);
                    if (category == this.state.activeCategory && category != null)
                        return;
                    this.state.activeCategory = category;
                    this.setState(this.state);
                }
            }

            this.location();
        }

        onAddButtonClick(e: HTMLButtonElement, o: Product, count: number) {
            if (!e) return;

            e.onclick = (event) => {
                this.addToShoppingCart(o, count);
                playAnimation(this.shoppingCartElement, event.pageX, event.pageY);
            }
        }

        render() {
            let products = this.props.products;
            let shoppingCartItems = this.state.shoppingCartItems;

            let count = 0;
            let total = 0;
            shoppingCartItems.filter(o => o.Count).filter(o => {
                count = count + o.Count;
                total = total + o.Price * o.Count;
            })

            let position = this.state.address;

            return (
                <div className="page">
                    <header>
                        <i className="icon-user pull-right" onClick={() => location.hash = `#user_index`}></i>
                        <div className="position interception" onClick={() => this.showLocationPage()}>
                            <i className="icon-map-marker" />
                            {position}
                            <i className="icon-sort-down" style={{ margin: 0, position: 'relative', left: 6, top: -2 }} />
                        </div>
                    </header>
                    <section className="main" ref={(e: HTMLElement) => this.mainView = e || this.mainView}>
                        <div className="products container">
                            {products.map(o => {
                                var itemCount = shoppingCartItems.filter(s => s.ProductId == o.Id).map(s => s.Count)[0] || 0;
                                return [
                                    <div key={o.Id} className="row"
                                        ref={(e: HTMLElement) => {
                                            if (!e) return;
                                            e.setAttribute(this.elementCategoryAttr, o.CategoryName);
                                        }}>
                                        <div className='col-xs-3' onClick={() => this.redirect(o)}>
                                            <img src={imageUrl(o.ImagePath, 100)} className="img-responsive" />
                                        </div>
                                        <div className='col-xs-9 pull-left'>
                                            <div className="name interception" onClick={() => this.redirect(o)}>{o.Name}</div>
                                            <div className="title interception">{o.Title}</div>
                                            <div className="select">
                                                <div className='pull-left price'>￥{o.Price.toFixed(2)}</div>
                                                <div className='pull-right' style={{ height: 28 }}>
                                                    <div style={{ display: itemCount == 0 ? 'block' : 'none' }}>
                                                        <button className='btn-link'
                                                            ref={(e: HTMLButtonElement) => this.onAddButtonClick(e, o, itemCount)}>
                                                            <i className='icon-shopping-cart' />
                                                        </button>
                                                    </div>
                                                    <div style={{ display: itemCount > 0 ? 'block' : 'none' }}>
                                                        <i className="icon-minus-sign text-primary" onClick={() => this.minusFormShoppingCart(o, itemCount)} />
                                                        <input type="number" value={itemCount as any}
                                                            onChange={(e) => {
                                                                let value = Number.parseInt((e.target as HTMLInputElement).value);
                                                                if (!value) return;
                                                                shoppingCart.setItemCount(o, value);
                                                            }} />
                                                        <i className="icon-plus-sign text-primary" ref={(e: HTMLButtonElement) => this.onAddButtonClick(e, o, itemCount)} />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>,
                                    <hr className="row" />
                                ]
                            })}
                        </div >
                    </section>
                    <aside style={{ width: 80 }}>
                        <ul className="list-group">
                            {categires.map(o =>
                                <li className={o == this.state.activeCategory ? 'list-group-item active' : 'list-group-item'} key={o}>
                                    <button onClick={() => this.scrollTo(o)}>{o}</button>
                                </li>
                            )}
                        </ul>
                    </aside>
                    <footer ref={(e: HTMLElement) => this.footer = e || this.footer}>
                        <div className="settlement">
                            <div className="pull-left">
                                <i className="icon-shopping-cart" onClick={() => app.redirect('shopping_shoppingCartNoMenu')}
                                    ref={(e: HTMLElement) => this.shoppingCartElement = e || this.shoppingCartElement} />
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
                </div >
            );
        }
    }

    let shoppingCartItems: ShoppingCartItem[];
    let products = await station.proudcts() as Product[];
    let categires = getCategories(products);

    ReactDOM.render(<IndexPage products={products} categories={categires} />, page.element);
}

function getCategories(products: Product[]) {
    let categires = [];
    for (let i = 0; i < products.length; i++) {
        let category = products[i].CategoryName;
        if (categires.indexOf(category) >= 0)
            continue;

        categires.push(category);
    }
    return categires;
}

function getAddress(): Promise<string> {
    let location = new LocationService();
    return location.address().then(o => o.address);
}


let pointer: HTMLElement;
function playAnimation(shoppingCartElement: HTMLElement, startX: number, startY: number) {
    requirejs(['parabola'], (funParabola) => {
        if (pointer == null) {
            pointer = document.createElement("div");
            pointer.style.position = 'absolute';
            pointer.style.width = '12px'
            pointer.style.height = '12px';
            pointer.style.borderRadius = '6px';
            pointer.style.backgroundColor = 'red';
            pointer.style.zIndex = `1000`;
        }

        pointer.style.left = `${startX}px`;
        pointer.style.top = `${startY}px`;

        pointer.style.removeProperty('display');
        document.body.appendChild(pointer);
        var myParabola = funParabola(pointer, shoppingCartElement, {
            speed: 400,
            curvature: 0.005,
            complete: function () {
                pointer.style.display = 'none';
            }
        });

        myParabola.position().move();

    });
}

/**
 * 有动画效果的滚动
 * @param element 要滚动的元素
 * @param to 滚动到的位置
 * @param duration 滚动持续时间
 */
function animateScrollTo(element, to, duration) {
    if (duration <= 0) return;
    var difference = to - element.scrollTop;
    var perTick = difference / duration * 10;

    setTimeout(function () {
        element.scrollTop = element.scrollTop + perTick;
        if (element.scrollTop === to) return;
        animateScrollTo(element, to, duration - 10);
    }, 10);
}


