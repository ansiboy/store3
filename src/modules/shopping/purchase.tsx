import { Page, defaultNavBar, app, formatDate, siteMap } from 'site';
import { ShoppingService, AccountService, WeiXinService } from 'services';
import * as ui from 'ui';
import { ProductPage } from '../home/product';

// export default function (page: Page) {

// let shopping = page.createService(ShoppingService);
// let accout = page.createService(AccountService);
// let weixin = page.createService(WeiXinService);

interface Props {
    shopping: ShoppingService,
    accout: AccountService,
    weixin: WeiXinService,
    order: Order,
}

type PayType = 'balance' | 'weixin' | 'alipay';
export class PurchasePage extends React.Component<Props, { payType: PayType }> {
    constructor(props) {
        super(props);
        this.state = { payType: 'weixin' };
    }
    private balancePurchase(order: Order) {
        console.assert(order.Sum != null);
        console.assert(order.Sum == order.Amount + order.Freight);
        if (this.state.payType == 'weixin') {
            return this.props.weixin.purchaseOrder(order.Id, order.Sum);
        }
        return this.props.accout.payOrder(order.Id, order.Sum);
    }
    render() {
        let order = this.props.order;
        let { shopping } = this.props;
        return (
            <div>
                <header>
                    {defaultNavBar({
                        title: '订单概况',
                        back: () => {
                            // if (page.previous != null && page.previous.name == 'shopping.orderList') {
                            //     app.back();
                            //     return;
                            // }
                            // app.redirect('shopping_orderList');
                            app.back();
                        }
                    })}
                </header>
                <section>
                    <div className="container">
                        <div className="row" style={{ paddingBottom: 10 }}>
                            <label className="col-xs-3" style={{ paddingRight: 0 }}>订单状态</label>
                            <div className="col-xs-9" style={{ color: '#f70' }}>
                                {shopping.orderStatusText(order.Status)}
                            </div>
                        </div>
                        <div className="row" style={{ paddingBottom: 10 }}>
                            <label className="col-xs-3" style={{ paddingRight: 0 }}>订单编号</label>
                            <div className="col-xs-9">{order.Serial}</div>
                        </div>
                        <div className="row" style={{ paddingBottom: 10 }}>
                            <label className="col-xs-3" style={{ paddingRight: 0 }}>订单总计</label>
                            <div className="col-xs-9 price">￥{order.Sum.toFixed(2)}</div>
                        </div>
                        <div className="row" style={{ paddingBottom: 10 }}>
                            <label className="col-xs-3" style={{ paddingRight: 0 }}>收货信息</label>
                            <div className="col-xs-9">{order.ReceiptAddress}</div>
                        </div>
                        <div className="row" style={{ paddingBottom: 10 }}>
                            <label className="col-xs-3" style={{ paddingRight: 0 }}>发票信息</label>
                            <div className="col-xs-9">{order.Invoice}</div>
                        </div>
                        <div className="row" style={{ paddingBottom: 10 }}>
                            <label className="col-xs-3" style={{ paddingRight: 0 }}>下单时间</label>
                            <div className="col-xs-9" data-bind="text:['{0:g}', order.OrderDate]">
                                {formatDate(order.OrderDate)}
                            </div>
                        </div>
                        {order.Remark ?
                            <div data-bind="visible:ko.unwrap(order.Remark)" className="row" style={{ paddingBottom: 10 }}>
                                <label className="col-xs-3" style={{ paddingRight: 0 }}>订单备注</label>
                                <div className="col-xs-9">
                                    {order.Remark}
                                </div>
                            </div> : null}
                        <div style={{ marginBottom: 10 }}>
                            提示：请在下单24小时内付款，过期后订单将自动取消。
                            </div>
                        <hr className="row" />
                        {/* <button className="cust-prop selected">
                                余额支付
                            </button> */}
                        <button className="cust-prop selected">
                            微信支付
                            </button>
                    </div>
                </section>
                <footer>
                    {order.Status == 'WaitingForPayment' ?
                        <div className="container">
                            <div className="form-group">
                                <button className="btn btn-block btn-primary"
                                    ref={(o: HTMLButtonElement) => {
                                        if (!o) return;
                                        o.onclick = ui.buttonOnClick(() => {
                                            return this.balancePurchase(order).then(() => {
                                                app.redirect(siteMap.nodes.shopping_orderList);//'shopping_orderList'
                                            });
                                        })
                                    }}>立即支付</button>
                            </div>
                        </div> : null}
                </footer>
            </div >
        );
    }
}

// export async function props(page: chitu.Page): Promise<Props> {

// }

//     shopping.order(page.data.id).then(order => {
//         ReactDOM.render(<PurchasePage order={order} />, page.element);
//     })
// }

export default async function (page: chitu.Page) {

    let shopping = page.createService(ShoppingService);
    let accout = page.createService(AccountService);
    let weixin = page.createService(WeiXinService);
    let order = await shopping.order(page.data.id);
    let props: Props = {
        shopping,
        accout,
        weixin,
        order,
        // page,
    };

    ReactDOM.render(<PurchasePage {...props} />, page.element);
}