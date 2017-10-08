import { Page, Menu, app, env } from 'site';
import { StationService, ShoppingCartService, ShoppingService, WeiXinService, imageUrl, LocationService } from 'services';
import Carousel = require('core/carousel');
import Hammer = require('hammer');
import * as ui from 'ui';
import wx = require('jweixin');

interface ProductExt extends Product {
    Count: number;
}

export default async function (page: Page) {
    let station = page.createService(StationService);
    let shoppingCart = page.createService(ShoppingCartService);
    let shop = page.createService(ShoppingService);

    interface IndexPageStatus {
        shoppingCartItems: ShoppingCartItem[],
        position: string,
        activeCategory: string
    }

    interface IndexPageProps {
        products: ProductExt[],
        categories: string[]
    }

    class IndexPage extends React.Component<IndexPageProps, IndexPageStatus>{

        private mainView: HTMLElement;
        private header: HTMLElement;
        private footer: HTMLElement;
        private shoppingCartElement: HTMLElement;

        constructor(props) {
            super(props);

            this.state = {
                shoppingCartItems: shoppingCart.items.value,
                position: '',
                activeCategory: this.props.categories[0]
            };

            shoppingCart.onChanged(this, (value) => {
                this.state.shoppingCartItems = value;
                this.setState(this.state);
            });

            let position = getPosition().then(o => {
                this.state.position = o;
                this.setState(this.state);
            })
        }

        private async loadData(pageIndex): Promise<ProductExt[]> {
            let products = await station.proudcts(pageIndex);
            return products as ProductExt[];
        }

        addToShoppingCart(product: ProductExt) {
            product.Count = (product.Count || 0) + 1;
            shoppingCart.setItemCount(product, product.Count);
        }

        removeFormShoppingCart(product: ProductExt) {
            if (product.Count < 1)
                return;

            product.Count = (product.Count || 0) - 1;
            shoppingCart.setItemCount(product, product.Count);
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
                    let category = itemElement.getAttribute('data-category');
                    if (category == this.state.activeCategory && category != null)
                        return;
                    this.state.activeCategory = category;
                    this.setState(this.state);
                }
            }
        }

        onAddButtonClick(e: HTMLButtonElement, o: ProductExt) {
            if (!e) return;

            e.onclick = (event) => {
                this.addToShoppingCart(o);
                playAnimation(this.shoppingCartElement, event.pageX, event.pageY);
            }
        }

        render() {
            let products = this.props.products;
            let shoppingCartItems = this.state.shoppingCartItems;
            products.forEach(o => {
                o.Count = shoppingCartItems.filter(p => p.ProductId == o.Id).map(o => o.Count)[0] || 0;
            })

            let count = 0;
            let total = 0;
            shoppingCartItems.filter(o => o.Count).filter(o => {
                count = count + o.Count;
                total = total + o.Price * o.Count;
            })

            let position = this.state.position;

            return (
                <div className="page">
                    <header>
                        <div className="position pull-left">{position}</div>
                        <i className="icon-user pull-right" onClick={() => location.hash = `#user_index`}></i>
                    </header>
                    <section className="main" ref={(e: HTMLElement) => this.mainView = e || this.mainView}>
                        <div className="products container">
                            {products.map(o => [
                                <div key={o.Id} className="row" data-category={o.CategoryName}>
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
                                                        ref={(e: HTMLButtonElement) => this.onAddButtonClick(e, o)}>
                                                        <i className='icon-shopping-cart' />
                                                    </button>
                                                </div>
                                                <div style={{ display: o.Count > 0 ? 'block' : 'none' }}>
                                                    <i className="icon-minus-sign text-primary" onClick={() => this.removeFormShoppingCart(o)} />
                                                    <input type="number" value={o.Count as any}
                                                        onChange={(e) => {
                                                            let value = Number.parseInt((e.target as HTMLInputElement).value);
                                                            if (!value) return;

                                                            o.Count = value;
                                                            this.setState(this.state);
                                                        }} />
                                                    <i className="icon-plus-sign text-primary" ref={(e: HTMLButtonElement) => this.onAddButtonClick(e, o)} />
                                                </div>
                                                {/* } */}
                                            </div>
                                        </div>
                                    </div>
                                </div>,
                                <hr className="row" />
                            ])}
                        </div >
                    </section>
                    <aside style={{ width: 80 }}>
                        <ul className="list-group">
                            {categires.map(o =>
                                <li className={o == this.state.activeCategory ? 'list-group-item active' : 'list-group-item'} key={o}>{o}</li>
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
    let products = await station.proudcts() as ProductExt[];
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

function getPosition(): Promise<string> {
    let location = new LocationService();
    return location.address();
    // return new Promise<string>((resolve, reject) => {
    //     navigator.geolocation.getCurrentPosition(
    //         (args) => {
    //             let lon = args.coords.longitude;    // 经度
    //             let lat = args.coords.latitude;     // 纬度

    //             var pt = new BMap.Point(lon, lat);
    //             var geoc = new BMap.Geocoder();

    //             var convertor = new BMap.Convertor();
    //             convertor.translate([pt], 1, 5, (rs) => {
    //                 geoc.getLocation(rs.points[0], (rs) => {
    //                     resolve(rs.address);
    //                 });
    //             });

    //         },
    //         (error) => {
    //             switch (error.code) {
    //                 case 1:
    //                     resolve("位置服务被拒绝");
    //                     break;

    //                 case 2:
    //                     resolve("暂时获取不到位置信息");
    //                     break;

    //                 case 3:
    //                     resolve("获取信息超时");
    //                     break;

    //                 default:
    //                 case 4:
    //                     resolve("未知错误");
    //                     break;
    //             }
    //         }
    //     )
    // });
}


let pointer: HTMLElement;
function playAnimation(shoppingCartElement: HTMLElement, startX: number, startY: number) {
    requirejs(['parabola'], (funParabola) => {
        if (pointer == null) {
            pointer = document.createElement("div");
            pointer.style.position = 'absolute';
            pointer.style.left = `${startX}px`;
            pointer.style.top = `${startY}px`;
            pointer.style.width = '12px'
            pointer.style.height = '12px';
            pointer.style.borderRadius = '6px';
            pointer.style.backgroundColor = 'red';
            pointer.style.zIndex = `1000`;
        }

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


