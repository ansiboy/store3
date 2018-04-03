import { Page, Menu, app } from 'site';
import { MemberService, userData } from 'services';


import * as ui from 'ui';

// export default async function (page: Page) {

// let member = page.createService(MemberService);
let userInfo = userData.userInfo.value || {} as UserInfo; //await member.userInfo();

interface PageState {
    userInfo: UserInfo;
    notPaidCount: number;
    sendCount: number;
    toEvaluateCount: number;
    balance: number;
    nickName: string;
}

interface Props {
    member: MemberService
}

export default class UserIndexPage extends React.Component<Props, PageState>{
    private notPaidCountSubscribe: (value: number) => void;
    private sendCountSubscribe: (value: number) => void;
    private toEvaluateCountSubscribe: (value: number) => void;
    private balanceSubscribe: (value: number) => void;
    private nickNameSubscribe: (value: string) => void;

    constructor(props) {
        super(props);

        this.state = {
            // userInfo: {
            notPaidCount: userData.notPaidCount.value,
            sendCount: userData.sendCount.value,
            toEvaluateCount: userData.toEvaluateCount.value,
            balance: userData.balance.value,
            nickName: userData.nickName.value,
            // }
            userInfo,
        };

        this.createSubscribes();
    }

    private createSubscribes() {
        this.notPaidCountSubscribe = userData.notPaidCount.add((value) => {
            this.state.notPaidCount = value;
            this.setState(this.state);
        })

        this.sendCountSubscribe = userData.sendCount.add((value) => {
            this.state.sendCount = value;
            this.setState(this.state);
        })

        this.toEvaluateCountSubscribe = userData.toEvaluateCount.add(value => {
            this.state.toEvaluateCount = value;
            this.setState(this.state);
        })

        this.balanceSubscribe = userData.balance.add(value => {
            this.state.balance = value;
            this.setState(this.state);
        })

        this.nickNameSubscribe = userData.nickName.add(value => {
            this.state.nickName = value;
            this.setState(this.state);
        })
    }

    private logout() {
        this.props.member.logout();
        app.redirect('home_index');
    }

    componentDidMount() {
        userData.userInfo.subscribe(this, (value) => {
            this.state.userInfo = value;
            this.setState(this.state);
        })
    }

    render() {
        let userInfo = this.state.userInfo;
        let balance = this.state.balance;
        let notPaidCount = this.state.notPaidCount;
        let sendCount = this.state.sendCount;
        let toEvaluateCount = this.state.toEvaluateCount;

        return (
            <div>
                <section>
                    <div className="user-info text-center">
                        <a href="#user_userInfo">
                            <img src={userInfo.HeadImageUrl} className="img-circle img-full"
                                title="上传头像" ref={(e: HTMLImageElement) => e ? ui.renderImage(e) : null} />
                        </a>
                        <div className="nick-name">
                            {userInfo.NickName == null ? '未填写' : userInfo.NickName}
                        </div>
                        {/* {balance != null ?
                                <div className="balance text-right">
                                    <span>余额</span>
                                    <span className="price">￥{balance.toFixed(2)}</span>
                                </div> : null
                            } */}
                    </div>
                    <div className="order-bar">
                        <div className="col-xs-3">
                            <a href="#shopping_orderList" style={{ color: 'black' }}>
                                <i className="icon-list icon-3x"></i>
                                <div className="name">全部订单</div>
                            </a>
                        </div>
                        <div className="col-xs-3 ">
                            <a href="#shopping_orderList?type=WaitingForPayment" style={{ color: 'black' }}>
                                {notPaidCount ? <sub className="sub">{notPaidCount}</sub> : null}
                                <i className="icon-credit-card icon-3x"></i>
                                <div className="name">待付款</div>
                            </a>
                        </div>
                        <div className="col-xs-3">
                            <a href="#shopping_orderList?type=Send" style={{ color: 'black' }}>
                                {sendCount ? <sub className="sub">{sendCount}</sub> : null}
                                <i className="icon-truck icon-3x"></i>
                                <div className="name">待收货</div>
                            </a>
                        </div>
                        <div className="col-xs-3">
                            <a href="#shopping_evaluation" style={{ color: 'black' }}>
                                {toEvaluateCount ?
                                    <sub className="sub">{toEvaluateCount}</sub> : null}
                                <i className="icon-star icon-3x"></i>
                                <div className="name">待评价</div>
                            </a>
                        </div>
                        <div className="clearfix"></div>
                    </div>
                    <div className="list-group">
                        <a className="list-group-item" href="#user_receiptList">
                            <span className="icon-chevron-right pull-right"></span>
                            <span className="pull-right value" style={{ display: 'none' }}></span>
                            <strong>收货地址</strong>
                        </a>

                        {/* <a className="list-group-item" href="#user_favors">
                                <span className="icon-chevron-right pull-right"></span>
                                <span className="pull-right value" style={{ display: 'none' }}></span>
                                <strong>我的收藏</strong>
                            </a> */}

                        <a className="list-group-item" href="#user_scoreList">
                            <span className="icon-chevron-right pull-right"></span>
                            <span className="pull-right value" style={{ display: 'none' }}>0</span>
                            <strong>我的积分</strong>
                        </a>

                        <a className="list-group-item" href="#user_coupon">
                            <span className="icon-chevron-right pull-right"></span>
                            <span className="pull-right value" style={{ display: 'none' }}>undefined</span>
                            <strong>我的优惠券</strong>
                        </a>
                    </div>

                    <div className="list-group">
                        <a className="list-group-item" href="#user_accountSecurity_index">
                            <span className="icon-chevron-right pull-right"></span>
                            <span className="pull-right value" style={{ display: 'none' }}></span>
                            <strong>账户安全</strong>
                        </a>

                        <a className="list-group-item" href="javascript:"
                            onClick={() => this.logout()}>
                            <span className="icon-chevron-right pull-right"></span>
                            <span className="pull-right value" style={{ display: 'none' }}></span>
                            <strong>退出</strong>
                        </a>
                    </div>
                </section>

            </div>
        );
    }
}

export async function props(page: chitu.Page): Promise<Props> {
    let member = page.createService(MemberService);
    return {
        member
    };
}

// ReactDOM.render(<UserIndexPage />, page.element);
// }


{/* <div>
                                <div style={{ width: '100%' }}>
                                    <a className="nick-name" href="#user_userInfo">
                                        {userInfo.NickName == null ? '未填写' : userInfo.NickName}
                                    </a>
                                </div>
                                <div className="pull-left">
                                    <h5 style={{ color: 'white' }}>普通用户</h5>
                                </div>
                                {balance != null ?
                                    <div className="pull-right">
                                        <a href="#user_rechargeList" style={{ color: 'white' }}>
                                            <h5>余额&nbsp;&nbsp;
                                        <span className="price">￥{balance.toFixed(2)}</span>&nbsp;&nbsp;
                                        <span className="icon-chevron-right"></span>
                                            </h5>
                                        </a>
                                    </div>
                                    : null}
                            </div>
                            <div className="clearfix"></div> */}