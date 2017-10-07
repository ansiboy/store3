import { Page, Menu, defaultNavBar, app } from 'site';
import { ShoppingCartService, ShoppingService, imageUrl } from 'services';
import * as ui from 'ui';

export default async function (page: Page, hideMenu: boolean = false) {

    let shoppingCart = page.createService(ShoppingCartService);

    type ShoppingCartItemExt = ShoppingCartItem & { InputCount: number };
    interface ShoppingCartState {
        items?: ShoppingCartItem[],
        status?: 'normal' | 'edit',
        totalAmount?: number,
        deleteItems: Array<ShoppingCartItem>
    }

    let shop = page.createService(ShoppingService);

    class ShoppingCartPage extends React.Component<
        { hideMenu: boolean, pageName: string },
        ShoppingCartState>{

        private dialog: controls.Dialog;

        constructor(props) {
            super(props);
            this.state = { deleteItems: [], items: shoppingCart.items.value, status: 'normal' };
            shoppingCart.onChanged(this, (value) => {
                this.state.items = value;
                this.setState(this.state);
            })
        }

        private selectItem(item: ShoppingCartItem) {
            if (this.state.status == 'edit') {
                let itemIndex = this.state.deleteItems.indexOf(item);
                if (itemIndex >= 0)
                    this.state.deleteItems = this.state.deleteItems.filter((o, i) => i != itemIndex);
                else
                    this.state.deleteItems.push(item);

                this.setState(this.state);
                return;
            }

            let p = item.Selected ? shoppingCart.unselectItem(item.Id) : shoppingCart.selectItem(item.Id);
            return p;
        }
        private deleteSelectedItems() {
            return shoppingCart.removeAll();
        }
        private decreaseCount(item: ShoppingCartItemExt) {
            if (item.Count == 1) {
                return;
            }
            this.changeItemCount(item, `${(item.InputCount) - 1}`);
        }
        private increaseCount(item: ShoppingCartItemExt) {
            this.changeItemCount(item, `${item.InputCount + 1}`);
        }
        private changeItemCount(item: ShoppingCartItemExt, value: string) {
            let count = Number.parseInt(value);
            if (!count) return;

            item.InputCount = count;
            this.setState(this.state);
        }
        private onEditClick() {
            if (this.state.status == 'normal') {
                this.state.status = 'edit';
                this.setState(this.state);
                return Promise.resolve();
            }

            let shoppingCartItems = new Array<ShoppingCartItem>();
            let items = this.state.items as ShoppingCartItemExt[];
            let changeItems = items.filter(o => o.InputCount != o.Count);
            let counts = changeItems.map(o => o.InputCount);

            let result: Promise<any> = shoppingCart.setItemsCount(changeItems, counts);
            result.then(o => {
                this.state.status = 'normal';
                this.setState(this.state);
            });

            return result;
        }
        private checkAll() {
            if (this.state.status == 'normal') {
                let p: Promise<any>;
                if (this.isCheckedAll()) {
                    p = shoppingCart.unselectAll();
                }
                else {
                    p = shoppingCart.selectAll();
                }

                // p.then((items) => {
                //     this.setStateByItems(items);
                // })

                return p;
            }

            if (this.isCheckedAll()) {
                this.state.deleteItems = [];
            }
            else {
                this.state.deleteItems = this.state.items;
            }
            this.setState(this.state);

        }
        private buy() {
            if (shoppingCart.selectedCount <= 0)
                return;


            var items = this.state.items.filter(o => o.Selected);
            var productIds = items.map(o => o.ProductId);
            var quantities = items.map(o => o.Count);

            let result = shop.createOrder(productIds, quantities)
                .then((order) => {
                    app.redirect(`shopping_orderProducts?id=${order.Id}`)
                })

            return result;
        }
        private isChecked(item: ShoppingCartItem) {
            if (this.state.status == 'normal') {
                return item.Selected;
            }
            return this.state.deleteItems.indexOf(item) >= 0;
        }
        private isCheckedAll() {
            let items = this.state.items;
            if (this.state.status == 'normal') {
                let selectedItems = items.filter(o => o.Selected);
                return selectedItems.length == items.length;
            }

            return this.state.deleteItems.length == items.length;

        }
        private deleteConfirmText(items: ShoppingCartItem[]) {
            let str = "是否要删除？<br/> " + items.map(o => '<br/>' + o.Name);
            return str;
        }

        render() {
            let items = this.state.items as ShoppingCartItemExt[];
            items.forEach(o => o.InputCount = o.InputCount || o.Count);
            let selectedCount = shoppingCart.selectedCount;
            let total = 0;

            let selectItems = items.filter(o => o.Selected);
            let totalAmount = 0;
            selectItems.forEach(o => {
                totalAmount = totalAmount + o.Amount;
            })

            return (
                <div>
                    <header>
                        {defaultNavBar({
                            title: '购物车',
                            showBackButton: this.props.hideMenu,
                            right: items.length > 0 ?
                                <button onClick={this.onEditClick.bind(this)} className="right-button" style={{ width: 'unset' }}>
                                    {(this.state.status == 'edit') ? '完成' : '编辑'}
                                </button> : null
                        })}
                    </header>
                    <footer>
                        {items.length > 0 ?
                            <div className="settlement" style={{ bottom: this.props.hideMenu ? 0 : null, paddingLeft: 0 }}>
                                <div className="pull-right">
                                    {this.state.status == 'normal' ?
                                        <button className="btn btn-primary" onClick={() => this.buy()} disabled={shoppingCart.selectedCount == 0}>
                                            {selectedCount > 0 ? `结算（${selectedCount}）` : '结算'}
                                        </button>
                                        :
                                        <button className="btn btn-primary" disabled={this.state.deleteItems.length == 0}
                                            ref={(e: HTMLButtonElement) => {
                                                if (!e) return;
                                                e.onclick = ui.buttonOnClick(o => this.deleteSelectedItems(), {
                                                    confirm: this.deleteConfirmText(this.state.deleteItems)
                                                });
                                            }}
                                        >
                                            删除
                                        </button>
                                    }
                                </div>
                                <div style={{ width: '100%', paddingTop: 8 }}>
                                    <button className="select-all pull-left" onClick={() => this.checkAll()}>
                                        {this.isCheckedAll() ?
                                            <i className="icon-ok-sign"></i>
                                            :
                                            <i className="icon-circle-blank"></i>
                                        }
                                        <span className="text">全选</span>
                                    </button>
                                    {this.state.status == 'normal' ?
                                        <label className="pull-right" style={{ paddingRight: 10, paddingTop: 2 }}>
                                            总计：<span className="price">￥{totalAmount.toFixed(2)}</span>
                                        </label>
                                        : null
                                    }
                                </div>

                            </div>
                            : null
                        }
                        {(!this.props.hideMenu ? <Menu pageName={this.props.pageName} /> : null)}
                    </footer>
                    <section className="main container">
                        {items.length > 0 ?
                            <ul className="list-group">
                                {items.map(o =>
                                    <li key={o.ProductId} className="list-group-item row">
                                        {!(o.Type == 'Given') ?
                                            <button onClick={() => this.selectItem(o)} className="pull-left icon">
                                                <i className={this.isChecked(o) ? 'icon-ok-sign' : 'icon-circle-blank'}></i>
                                            </button> : null}
                                        <a href={`#home_product?id=${o.ProductId}`} className="pull-left pic">
                                            {o.Type == 'Reduce' || o.Type == 'Discount' ?
                                                <div className={o.Type}>
                                                    {o.Type == 'Reduce' ? '减' : '折'}
                                                </div>
                                                :
                                                <img src={imageUrl(o.ImagePath, 100)} className="img-responsive" />}

                                        </a>
                                        <div style={{ marginLeft: 110 }}>
                                            <a href={`#home_product?id=${o.ProductId}`} >{o.Name}</a>
                                            <div style={{ height: 42, paddingTop: 4 }}>
                                                <div className="price pull-left" style={{ marginTop: 10 }}>￥{o.Price.toFixed(2)}</div>
                                                <div className="pull-right" style={{ marginTop: 4 }}>
                                                    {this.state.status == 'normal' || (o.Type == 'Given') ?
                                                        <div style={{ paddingLeft: 6 }}>X {o.Count}</div>
                                                        :
                                                        <div className="input-group" style={{ width: 120, display: o.Type as string == 'Given' ? 'none' : 'table' }}>
                                                            <span onClick={() => this.decreaseCount(o)} className="input-group-addon">
                                                                <i className="icon-minus"></i>
                                                            </span>
                                                            <input value={`${o.InputCount}`} className="form-control" type="text" style={{ textAlign: 'center' }}
                                                                onChange={(e) => (this.changeItemCount(o, (e.target as HTMLInputElement).value))} />
                                                            <span onClick={() => this.increaseCount(o)} className="input-group-addon">
                                                                <i className="icon-plus"></i>
                                                            </span>
                                                        </div>
                                                    }
                                                </div>
                                            </div>
                                        </div>
                                    </li>
                                )}
                            </ul>
                            :
                            <div className="norecords">
                                <div className="icon">
                                    <i className="icon-shopping-cart">

                                    </i>
                                </div>
                                <h4 className="text">你的购买车空空如也</h4>
                            </div>
                        }
                    </section>
                </div>
            )
        }
    }

    ReactDOM.render(<ShoppingCartPage hideMenu={hideMenu} pageName={page.name} />, page.element);
}

