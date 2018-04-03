import { Page, defaultNavBar, app } from 'site';
import { LocationService, ShoppingService, userData } from 'services';
import { ReceiptEditPageArguments } from 'modules/user/receiptEdit';

// export type AddressSelected = (address: string) => void;
export interface Argumnets {
    onAddressSelected: (address: string) => void,
    currentAddress: string
}

interface State {
    /** 搜索出来的位置 */
    searchAddresses: string[],
    /** 当前位置 */
    currentAddress: string,
    /** 是否正在检测地址 */
    detectingAddrress: boolean,
    /** receiptAddress */
    receiptInfos: ReceiptInfo[],
    /** 附近地址 */
    nearAddress: string[],
}

export default function (page: Page, args: Argumnets) {
    args = args || {} as any;
    let location = page.createService(LocationService);
    let shopping = page.createService(ShoppingService);

    class LocationPage extends React.Component<{}, State>{
        private locationInput: HTMLInputElement;

        constructor(props) {
            super(props);
            this.state = {
                searchAddresses: [], currentAddress: args.currentAddress || '',
                detectingAddrress: false, receiptInfos: null,
                nearAddress: []
            };
        }

        setAddress(address: string) {
            if (args.onAddressSelected) {
                args.onAddressSelected(address);
            }
        }

        async detcetLocation() {
            if (this.state.detectingAddrress == true)
                return;

            this.state.detectingAddrress = true;
            this.setState(this.state);

            try {
                let o = await location.address();
                this.state.currentAddress = o.address;
            }
            catch (err) {
                this.state.currentAddress = (err as Error).message;
            }
            finally {
                this.state.detectingAddrress = false;
                this.setState(this.state);
            }
        }

        /** 启用百度地图 */
        enableBMap() {
            //==========================================================
            // 百度地图使用异步加载，如果网络不好，加载速度慢会导致 BMap 为空。
            // 延时后再次尝试
            if (!window['BMap']) {
                let timeoutId = window.setTimeout(() => {
                    this.enableBMap();
                }, 3000);

                return;
            }
            //==========================================================

            let local = new BMap.LocalSearch('上海市', {
                onSearchComplete: (result: BMap.LocalResult) => {
                    //==========================================
                    // 输入框已经清空，不需要结果了
                    if (!this.locationInput.oninput) {
                        return;
                    }
                     //==========================================
                    this.state.searchAddresses = (result.vr || []).filter(o => o.type == 0).map(o => o.address);
                    this.setState(this.state);
                }
            });
            this.locationInput.oninput = () => {
                if (!this.locationInput.value) {
                    this.state.searchAddresses = [];
                    this.setState(this.state);
                    return;
                }
                local.search(this.locationInput.value);
            }
        }

        showReceiptEditPage(receiptId?: string) {
            if (!userData.userToken.value) {
                return app.redirect("user_login", { return: page.data })
            }

            let args: ReceiptEditPageArguments = {
                id: receiptId,
                onSaved: (receiptInfo: ReceiptInfo) => {

                    let receiptInfos = this.state.receiptInfos;
                    let itemIndex: number;
                    for (let i = 0; i < receiptInfos.length; i++) {
                        if (receiptInfo.Id == receiptInfos[i].Id) {
                            itemIndex = i;
                            break;
                        }
                    }
                    if (itemIndex != null) {
                        receiptInfos[itemIndex] = receiptInfo;
                    }
                    else {
                        this.state.receiptInfos.push(receiptInfo);
                    }
                    this.setState(this.state);

                    app.back();
                }
            };

            app.redirect('user_receiptEdit', args);
        }

        componentDidMount() {
            this.enableBMap();
            if (!this.state.currentAddress) {
                this.detcetLocation();
            }

            // 如果处于登录状态，获取用户收货信息
            let q = userData.userToken.value ? shopping.receiptInfos() : Promise.resolve([]);
            q.then(items => {
                this.state.receiptInfos = items;
                this.setState(this.state);
            })


        }

        render() {
            let searchAddresses = this.state.searchAddresses;
            let detecting = this.state.detectingAddrress;
            let receiptInfos = this.state.receiptInfos;// || [];
            let nearAddress = this.state.nearAddress;
            return (
                <div className="page">
                    <section>
                        <div className="list-group form-group">
                            <div className="list-group-item">
                                <div className="pull-left" style={{ paddingTop: 6 }}>上海市</div>
                                <div style={{ paddingLeft: 60 }}>
                                    <input className="form-control" ref={(e: HTMLInputElement) => this.locationInput = e || this.locationInput} />
                                </div>
                            </div>
                            {searchAddresses.map((o, i) => (
                                <div className="list-group-item" key={i} onClick={() => this.setAddress(o)}>
                                    {o}
                                </div>
                            ))}
                        </div>
                        <div className="list-group">
                            <div className="list-group-item">
                                当前位置
                            </div>
                            <div className="list-group-item">
                                <div className="pull-left">{this.state.currentAddress}</div>
                                <div className="pull-right">
                                    <i className={detecting ? 'icon-spinner icon-spin' : "icon-map-marker"}></i>
                                </div>
                                <div className="clearfix"></div>
                            </div>
                        </div>
                        <div className="list-group">
                            <div className="list-group-item">
                                我的收货地址
                            </div>
                            {
                                (receiptInfos == null || receiptInfos.length == 0) ?
                                    <div className="list-group-item">
                                        <div style={{ padding: '100px 0 100px 0', textAlign: 'center' }}>
                                            {receiptInfos == null ?
                                                <span>
                                                    数据正在加载中...
                                                </span> :
                                                <span>暂无收货地址</span>
                                            }
                                        </div>
                                    </div> :
                                    receiptInfos.map(o =>
                                        <div key={o.Id} className="list-group-item">
                                            <div className="pull-right" style={{ width: 60, paddingTop: 10, textAlign: 'right' }}
                                                onClick={() => this.showReceiptEditPage(o.Id)}>
                                                <span className="icon-pencil" style={{ fontSize: 18 }}></span>
                                                <span style={{ marginLeft: 4 }}>编辑</span>
                                            </div>
                                            <div>
                                                <div onClick={() => this.setAddress(o.Address)}>
                                                    <span>{o.Consignee}</span>
                                                    <span className="badge" style={{ marginLeft: 4 }}>{o.Name}</span>
                                                    <span style={{ marginLeft: 4 }}>{o.Mobile}</span>
                                                </div>
                                                <div style={{ fontSize: 12, color: '#ccc' }}>
                                                    {o.FullAddress}
                                                </div>
                                            </div>
                                        </div>
                                    )
                            }
                        </div>
                    </section>
                    <footer>
                        <div className="form-group container">
                            <button className="btn btn-block btn-primary" onClick={() => this.showReceiptEditPage()}>
                                添加收货地址
                            </button>
                        </div>
                    </footer>
                </div>
            )
        }
    }
    ReactDOM.render(<LocationPage />, page.element);
}