
import chitu = require('chitu');

const REMOTE_HOST = 'service.alinq.cn';

let config = {
    service: {
        host: REMOTE_HOST,
        shop: `https://${REMOTE_HOST}/UserShop/`,
        site: `https://${REMOTE_HOST}/UserSite/`,
        member: `https://${REMOTE_HOST}/UserMember/`,
        weixin: `https://${REMOTE_HOST}/UserWeiXin/`,
        account: `https://${REMOTE_HOST}/UserAccount/`,
    },
    appToken: '59a0d63ab58cf427f90c7d3e',
    /** 调用服务接口超时时间，单位为秒 */
    ajaxTimeout: 30,
    pageSize: 10
}

//==========================================================
// 公用函数 模块开始

export function imageUrl(path: string, width?: number) {
    if (!path) return path;

    let HTTP = 'http://'
    if (path.startsWith(HTTP)) {
        path = path.substr(HTTP.length);
        let index = path.indexOf('/');
        console.assert(index > 0);
        path = path.substr(index);
    }
    else if (path[0] != '/') {
        path = '/' + path;
    }

    let urlParams = new Array<{ name: string, value: string }>();
    let url = 'http://image.alinq.cn' + path;
    if (width) {
        // url = url + '?width=' + width;
        urlParams.push({ name: 'width', value: width.toString() });
    }

    if (navigator.userAgent.indexOf('chrome') < 0) {
        urlParams.push({ name: 'type', value: 'jpeg' })
    }

    if (urlParams.length > 0) {
        url = url + '?' + urlParams.map(o => `${o.name}=${o.value}`).join('&');
    }

    return url;
}

// 公用函数 模块结束
//==========================================================
// 服务以及实体类模块 开始



export type News = { Id: string, Title: string, ImgUrl: string, Date: Date, Content: string };


async function ajax<T>(url: string, options: RequestInit): Promise<T> {
    let response = await fetch(url, options);

    let responseText = response.text();
    let p: Promise<string>;
    if (typeof responseText == 'string') {
        p = new Promise<string>((reslove, reject) => {
            reslove(responseText);
        })
    }
    else {
        p = responseText as Promise<string>;
    }


    let text = await responseText;
    let textObject;
    let isJSONContextType = (response.headers.get('content-type') || '').indexOf('json') >= 0;
    if (isJSONContextType) {
        textObject = JSON.parse(text);
        textObject = travelJSON(textObject);
    }
    else {
        textObject = text;
    }


    if (response.status >= 300) {
        let err = new Error();
        err.name = `${response.status}`;
        err.message = isJSONContextType ? (textObject.Message || textObject.message) : textObject;
        err.message = err.message || response.statusText;

        throw err
    }

    return textObject;


    /**
     * 遍历 JSON 对象各个字段，将日期字符串转换为 Date 对象
     * @param result yao转换的 JSON 对象
     */
    function travelJSON(result: any) {
        const datePattern = /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/;
        if (typeof result === 'string' && value.match(this.datePattern)) {
            return new Date(result);
        }
        var stack = new Array();
        stack.push(result);
        while (stack.length > 0) {
            var item = stack.pop();
            for (var key in item) {
                var value = item[key];
                if (value == null)
                    continue;

                if (value instanceof Array) {
                    for (var i = 0; i < value.length; i++) {
                        stack.push(value[i]);
                    }
                    continue;
                }
                if (typeof value == 'object') {
                    stack.push(value);
                    continue;
                }
                if (typeof value == 'string' && value.match(datePattern)) {
                    item[key] = new Date(value);
                }
            }
        }
        return result;
    }
}

export abstract class Service {
    // private datePrefix = '/Date(';
    error = chitu.Callbacks<Service, Error>();
    ajax<T>(url: string, options: RequestInit): Promise<T> {

        options.headers = options.headers || {};
        let user_token: string = userData.userToken.value;
        if (user_token) {
            options.headers['user-token'] = user_token;
        }

        return new Promise<T>((reslove, reject) => {
            let timeId: number;
            if (options.method == 'get') {
                timeId = setTimeout(() => {
                    let err = new Error(); //new AjaxError(options.method);
                    err.name = 'timeout';
                    reject(err);
                    this.error.fire(this, err);
                    clearTimeout(timeId);

                }, config.ajaxTimeout * 1000)
            }

            ajax<T>(url, options)
                .then(data => {
                    reslove(data);
                    if (timeId)
                        clearTimeout(timeId);
                })
                .catch(err => {
                    reject(err);
                    this.error.fire(this, err);

                    if (timeId)
                        clearTimeout(timeId);
                });

        })
    }



    get<T>(url: string, data?: any) {

        // console.assert(storeId() != null);

        data = data || {};
        let headers = {
            'application-key': config.appToken,
        };

        if (userData.userToken.value) {
            headers['user-token'] = userData.userToken.value;
        }

        let urlParams = '';
        for (let key in data) {
            urlParams = urlParams + `&${key}=${data[key]}`;
        }

        if (urlParams)
            url = url.indexOf('?') < 0 ? url + '?' + urlParams : url + '&' + urlParams;

        let options = {
            headers,
            method: 'get',
        }
        return this.ajax<T>(url, options);
    }

    post<T>(url: string, data?: Object) {
        return this.ajaxByJSON<T>(url, data, 'post');
    }
    delete<T>(url: string, data?: Object) {
        return this.ajaxByJSON<T>(url, data, 'delete');
    }
    put<T>(url: string, data?: Object) {
        return this.ajaxByJSON<T>(url, data, 'put');
    }
    private ajaxByJSON<T>(url: string, data?: Object, method?: string) {

        data = data || {};
        let headers = {
            'application-key': config.appToken,
        };

        if (userData.userToken.value)
            headers['user-token'] = userData.userToken.value;

        headers['content-type'] = 'application/json';
        let body: any;
        body = JSON.stringify(data);
        let options = {
            headers,
            body,
            method
        }
        return this.ajax<T>(url, options);
    }
}

export class StationService extends Service {
    constructor() {
        super();
    }

    static url(path) {
        return `${config.service.site}${path}`;
    }

    newsList(pageIndex: number) {
        let url = StationService.url('Info/GetNewsList');
        return this.get<News[]>(url, { pageIndex }).then(items => {
            items.forEach(o => o.ImgUrl = imageUrl(o.ImgUrl));
            return items;
        });
    }

    news(newsId: string): Promise<News> {
        let url = StationService.url('Info/GetNews');
        return this.get<News>(url, { newsId }).then(item => {
            item.ImgUrl = imageUrl(item.ImgUrl);
            let div = document.createElement('div');
            div.innerHTML = item.Content;
            let imgs = div.querySelectorAll('img');
            for (let i = 0; i < imgs.length; i++) {
                (imgs[i] as HTMLImageElement).src = imageUrl((imgs[i] as HTMLImageElement).src);
            }

            item.Content = div.innerHTML;

            return item;
        });
    }

    searchKeywords() {
        return this.get<Array<string>>(StationService.url('Home/GetSearchKeywords'));
    }

    historySearchWords() {
        return this.get<Array<string>>(StationService.url('Home/HistorySearchWords'));
    }

    advertItems(): Promise<{ ImgUrl: string, Id: string }[]> {
        return this.get<{ ImgUrl: string, Id: string }[]>(StationService.url('Home/GetAdvertItems')).then(items => {
            items.forEach(o => o.ImgUrl = imageUrl(o.ImgUrl));
            return items;
        });
    }

    proudcts(pageIndex?: number): Promise<HomeProduct[]> {
        pageIndex = pageIndex === undefined ? 0 : pageIndex;
        let url = StationService.url('Home/GetHomeProducts');
        return this.get<HomeProduct[]>(url, { pageIndex });
    }
}


export class ShoppingService extends Service {
    constructor() {
        super();
    }
    private url(path: string) {
        return `${config.service.shop}${path}`;
    }
    product(productId): Promise<Product> {
        let url = this.url('Product/GetProduct');
        return this.get<Product>(url, { productId })
            .then(product => this.processProduct(product));
    }
    productByProperies(groupId: string, properties: { [propName: string]: string }): Promise<Product> {
        type t = { key: string };
        var d = { groupId, filter: JSON.stringify(properties) };
        return this.get<Product>(this.url('Product/GetProductByPropertyFilter'), d)
            .then(o => this.processProduct(o));
    }
    private processProduct(product: Product): Product {
        // if (!product.ImageUrls && product.ImageUrl != null)
        //     product.ImageUrls = (<string>product.ImageUrl).split(',').map(o => imageUrl(o));

        product.ImagePath = product.ImagePaths[0];
        product.Arguments = product.Arguments || [];
        product.Fields = product.Fields || [];

        return product;
    }
    productIntroduce(productId: string): Promise<string> {
        let url = this.url('Product/GetProductIntroduce');
        return this.get<{ Introduce: string }>(url, { productId }).then(o => o.Introduce);
    }
    products(categoryId: string, pageIndex: number) {
        let url = this.url('Product/GetProducts');
        return this.get<{ Products: Array<Product> }>(url, {
            filter: `ProductCategoryId=Guid.Parse('${categoryId}')`,
            startRowIndex: pageIndex * 20
        }).then(o => {
            o.Products.forEach(o => {
                o.ImagePath = imageUrl(o.ImagePath);
            });
            return o.Products;
        });
    }
    category(categoryId: string) {
        let url = this.url('Product/GetCategory');
        return this.get<ProductCategory>(url, { categoryId });
    }
    cateories() {
        let url = this.url('Product/GetCategories');
        return this.get<ProductCategory[]>(url).then(items => {
            items.forEach(o => o.ImagePath = imageUrl(o.ImagePath));
            return items;
        });
    }
    toCommentProducts() {
        var result = this.get<ProductComent[]>(this.url('Product/GetToCommentProducts'))
            .then(items => {
                items.forEach(o => o.ImageUrl = imageUrl(o.ImageUrl));
                return items;
            });
        return result;
    }
    commentedProducts() {
        var result = this.get<ProductComent[]>(this.url('Product/GetCommentedProducts'))
            .then(items => {
                items.forEach(o => o.ImageUrl = imageUrl(o.ImageUrl));
                return items;
            });
        return result;
    }
    //=====================================================================
    // 收藏夹
    favorProducts() {
        return this.get<FavorProduct[]>(this.url('Product/GetFavorProducts')).then(items => {
            items.forEach(o => o.ImageUrl = imageUrl(o.ImageUrl))
            return items;
        });
    }
    unfavorProduct(productId: string) {
        return this.post(this.url('Product/UnFavorProduct'), { productId });
    }
    isFavored(productId: string) {
        return this.get<boolean>(this.url('Product/IsFavored'), { productId });
    }
    favorProduct(productId: string) {
        return this.post(this.url('Product/FavorProduct'), { productId });
    }
    //=====================================================================
    // 订单
    // balancePay(orderId: string, amount: number) {
    //     type TResult = { Id: string, Amount: number, BalanceAmount: number };
    //     return this.post<TResult>(this.url('Order/BalancePay'), { orderId: orderId, amount: amount });
    // }
    confirmOrder(orderId: string, remark: string, invoice: string) {
        let args = { orderId, remark, invoice };
        var result = this.post<Order>(this.url('Order/ConfirmOrder'), args);
        return result;
    }
    myOrderList(pageIndex, type?: 'WaitingForPayment' | 'Send') {
        let args = {} as DataSourceSelectArguments;
        args.startRowIndex = config.pageSize * pageIndex;
        args.maximumRows = config.pageSize;
        if (type)
            args.filter = `Status="${type}"`

        return this.get<Order[]>(this.url('Order/GetMyOrderList'), args)
            .then(orders => {
                orders.forEach(o => {
                    o.OrderDetails.forEach(c => c.ImageUrl = imageUrl(c.ImageUrl));
                });
                return orders;
            });
    }
    order(orderId: string) {
        return this.get<Order>(this.url('Order/GetOrder'), { orderId }).then(o => {
            o.OrderDetails.forEach(c => c.ImageUrl = imageUrl(c.ImageUrl));
            return o;
        });
    }
    createOrder(productIds: string[], quantities: number[]) {
        var result = this.post<Order>(this.url('Order/CreateOrder'), { productIds: productIds, quantities: quantities })
            .then(function (order) {
                return order;
            });
        return result;
    }
    cancelOrder(orderId: string) {
        let url = this.url('Order/CancelOrder');
        return this.put<{ Id, Status }>(url, { orderId });
    }
    ordersSummary() {
        type OrdersSummaryResult = { NotPaidCount: number, SendCount: number, ToEvaluateCount: number };
        return this.get<OrdersSummaryResult>(this.url('Order/GetOrdersSummary'));
    }

    changeReceipt(orderId, receiptId) {
        var result = this.post<Order>(this.url('Order/ChangeReceipt'), { orderId, receiptId });
        return result;
    }
    orderStatusText(status: string) {
        switch (status) {
            case 'Created':
                return '已创建';
            case 'WaitingForPayment':
                return '待付款';
            case 'Paid':
                return '已付款';
            case 'Send':
                return '已发货';
            case 'Received':
                return '已收货';
            case 'Canceled':
                return '已取消';
            case 'WaitingForSend':
                return '待发货';
            case 'Evaluated':
                return '已评价';
        }
    }

    //=====================================================================
    // 优惠券
    couponStatusText(status: 'available' | 'used' | 'expired') {
        switch (status) {
            case 'available':
                return '未使用'
            case 'used':
                return '已使用';
            case 'expired':
                return '已过期';
            default:
                return ''
        }
    }
    /** 获取个人优惠码 */
    myCoupons(pageIndex: number, status: string) {
        let url = this.url('Coupon/GetMyCoupons');
        return this.get<CouponCode[]>(url, { pageIndex, status });
    }
    storeCoupons() {
        let url = this.url('Coupon/GetCoupons');
        return this.get<Coupon[]>(url);
    }
    /** 领取优惠卷 */
    receiveCoupon(couponId: string) {
        let url = this.url('Coupon/ReceiveCouponCode');
        return this.post(url, { couponId });
    }

    /** 获取订单可用的优惠劵 */
    orderAvailableCoupons(orderId: string) {
        let url = this.url('Coupon/GetAvailableCouponCodes');
        return this.get<CouponCode[]>(url, { orderId });
    }

    /** 获取店铺优惠劵数量 */
    storeCouponsCount() {
        let url = this.url('Coupon/GetStoreCouponsCount');
        return this.get<number>(url, {});
    }

    private resizeImage(img: HTMLImageElement, max_width: number, max_height: number): string {

        var canvas = document.createElement('canvas');

        var width: number = img.width;
        var height: number = img.height;

        // calculate the width and height, constraining the proportions
        if (width > height) {
            if (width > max_width) {
                height = Math.round(height *= max_width / width);
                width = max_width;
            }
        } else {
            if (height > max_height) {
                width = Math.round(width *= max_height / height);
                height = max_height;
            }
        }

        canvas.width = width;
        canvas.height = height;
        var ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);

        return canvas.toDataURL("/jpeg", 0.7);

    }

    /**
     * 评价晒单
     * @param score: 评分
     * @param evaluation: 评价
     * @param anonymous: 是否匿名评价
     * @param imageDatas: 多个上传的图片，用 ',' 连接
     * @param imageThumbs: 多个缩略图，用 ',' 连接
     */
    evaluateProduct(orderDetailId: string, score: number, evaluation: string, anonymous: boolean, imageDatas: string[]) {
        //let imageString = imageDatas.join(',');
        let imageThumbs = imageDatas.map(o => {
            var image = new Image();
            image.src = o;
            return this.resizeImage(image, 200, 200);
        });
        var data = {
            orderDetailId, evaluation,
            score, anonymous,
            imageDatas: imageDatas.join(','),
            imageThumbs: imageThumbs.join(','),
        };
        var result = this.post<any>(this.url('Product/EvaluateProduct'), data)
        return result;
    }
    //=====================================================================
    // Address
    receiptInfos() {
        return this.get<ReceiptInfo[]>(this.url('Address/GetReceiptInfos'));
    }
    receiptInfo(id: string) {
        return this.get<ReceiptInfo>(this.url('Address/GetReceiptInfo'), { id })
            .then(o => {
                o.RegionId = o.CountyId;
                return o;
            });
    }
    provinces(): Promise<Region[]> {
        var result = this.get<Region[]>(this.url('Address/GetProvinces'))
        return result;
    }
    cities(province: string): Promise<Region[]> {
        var guidRule = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        if (guidRule.test(province))
            return this.get<Region[]>(this.url('Address/GetCities'), { provinceId: province });

        return this.get<Region[]>(this.url('Address/GetCities'), { provinceName: province });;
    }
    counties = (cityId: string) => {
        var result = this.get<Region[]>(this.url('Address/GetCounties'), { cityId: cityId });
        return result;
    }
    saveReceiptInfo(receiptInfo: ReceiptInfo) {
        var self = this;
        let url = this.url('Address/SaveReceiptInfo');
        var result = this.post<{ Id: string, IsDefault: boolean }>(url, receiptInfo);
        return result;
    }
    setDefaultReceiptInfo(receiptInfoId: string) {
        let url = this.url('Address/SetDefaultReceiptInfo');
        return this.put(url, { receiptInfoId });
    }
    deleteReceiptInfo(receiptInfoId: string) {
        let url = this.url('Address/DeleteReceiptInfo');
        return this.delete(url, { receiptInfoId });
    }
}

export type ShoppingCartItem = {
    Id: string,
    Amount: number,
    Count: number,
    ImageUrl: string,
    IsGiven: boolean,
    Name: string,
    ProductId: string,
    Remark: string,
    Score: number,
    Selected: boolean,
    Unit: number,
    Price: number,
    Type: 'Reduce' | 'Discount'
}

export class ShoppingCartService extends Service {
    constructor() {
        super();
    }
    private url(path: string) {
        return `${config.service.shop}${path}`;
    }
    private processShoppingCartItems(items: ShoppingCartItem[]) {
        for (let i = 0; i < items.length; i++) {
            items[i].ImageUrl = imageUrl(items[i].ImageUrl);
            if (items[i].Remark) {
                Object.assign(items[i], JSON.parse(items[i].Remark));
            }
        }

        return items;
    }

    addItem(productId: string, count?: number) {
        count = count || 1;
        return this.post<ShoppingCartItem[]>(this.url('ShoppingCart/AddItem'), { productId, count })
            .then((result) => this.processShoppingCartItems(result))
            .then((result) => userData.shoppingCartItems.value = result);
    }

    addItems(productIds: string[], counts?: number[]) {
        return this.post<ShoppingCartItem[]>(this.url('ShoppingCart/AddItems'), { productIds, counts })
            .then((result) => this.processShoppingCartItems(result))
            .then((result) => userData.shoppingCartItems.value = result);
    }

    updateItem(productId: string, count: number, selected: boolean) {
        let data = { productId: productId, count: count, selected: selected };
        return this.post<ShoppingCartItem[]>(this.url('ShoppingCart/UpdateItem'), data)
            .then(items => this.processShoppingCartItems(items))
            .then((result) => userData.shoppingCartItems.value = result);
    }

    updateItems(productIds: string[], quantities: number[]) {
        let data = { productIds, quantities };
        return this.post<ShoppingCartItem[]>(this.url('ShoppingCart/UpdateItems'), data)
            .then(items => this.processShoppingCartItems(items))
            .then(items => userData.shoppingCartItems.value = items);
    }

    items() {
        return this.get<ShoppingCartItem[]>(this.url('ShoppingCart/GetItems'))
            .then(items => this.processShoppingCartItems(items));
    }

    selectAll = () => {
        return this.post<ShoppingCartItem[]>(this.url('ShoppingCart/SelectAll'))
            .then(items => this.processShoppingCartItems(items))
            .then(items => userData.shoppingCartItems.value = items);
    }

    unselectAll = () => {
        return this.post<ShoppingCartItem[]>(this.url('ShoppingCart/UnselectAll'))
            .then(items => this.processShoppingCartItems(items))
            .then(items => userData.shoppingCartItems.value = items);
    }

    /*移除购物车中的多个产品*/
    removeItems(productIds: string[]): Promise<any> {
        var result = this.post<ShoppingCartItem[]>(this.url('ShoppingCart/RemoveItems'), { productIds })
            .then(items => this.processShoppingCartItems(items))
            .then(items => userData.shoppingCartItems.value = items);

        return result;
    }
}

export interface UserInfo {
    Id: string;
    NickName: string;
    Country: string;
    Province: string;
    City: string;
    HeadImageUrl: string;
    Gender: string;
    UserId: string;
    CreateDateTime: string;
    Mobile: string
}

export interface RegisterModel {
    user: { mobile: string, password: string },
    smsId: string,
    verifyCode: string
}

export type VerifyCodeType = 'reigster' | 'changeMobile';

export class MemberService extends Service {
    constructor() {
        super();
    }

    private url(path: string) {
        return `${config.service.member}${path}`;
    }

    userInfo(): Promise<UserInfo> {
        let url1 = this.url('Member/CurrentUserInfo');
        let url2 = `https://${config.service.host}/user/userInfo`;
        return Promise.all([this.get<UserInfo>(url1), this.get<{ mobile }>(url2)])
            .then((data) => {
                data[0].Mobile = (data[1] || {} as any).mobile;
                return data[0];
            });
    }

    saveUserInfo(userInfo): Promise<any> {
        let url = this.url('Member/SaveUserInfo');
        return this.put(url, userInfo);
    }

    logout() {
        userData.userToken.value = '';
    }

    sentVerifyCode(mobile: string, type: VerifyCodeType): Promise<{ smsId: string }> {
        console.assert(mobile != null);
        let url = `https://${config.service.host}/sms/sendVerifyCode`;
        return this.get(url, { mobile, type });
    }

    checkVerifyCode(smsId: string, verifyCode: string) {
        let url = `https://${config.service.host}/sms/checkVerifyCode`;
        return this.get(url, { smsId, verifyCode });
    }


    /** 发送验证码到指定的手机 */
    sentRegisterVerifyCode(mobile: string): Promise<{ smsId: string }> {
        // console.assert(mobile != null);
        // let url = `http://${config.service.host}/sms/sendVerifyCode`;
        // return this.get(url, { mobile, type: 'register' });
        return this.sentVerifyCode(mobile, 'reigster');
    }

    /** 用户注册 */
    register(data: RegisterModel) {
        console.assert(data != null);
        let url = `https://${config.service.host}/user/register`;
        return this.post<{ token: string, userId: string }>(url, data).then((data) => {
            userData.userToken.value = data.token;
            return data;
        });
    }

    login(username: string, password: string): Promise<{ token: string, userId: string }> {
        let url = `https://${config.service.host}/user/login`;
        return this.post<{ token: string, userId: string }>(url, { username, password }).then((result) => {
            userData.userToken.value = result.token;
            return result;
        });
    }

    resetPassword(mobile: string, password: string, smsId: string, verifyCode: string) {
        let url = `https://${config.service.host}/user/resetPassword`;
        return this.put(url, { mobile, password, smsId, verifyCode }).then(data => {
            debugger;
            return data;
        });
    }

    changePassword(password: string, smsId: string, verifyCode: string) {
        let url = `https://${config.service.host}/user/changePassword`;
        return this.put(url, { password, smsId, verifyCode }).then(data => {
            debugger;
            return data;
        });
    }

    changeMobile(mobile: string, smsId: string, verifyCode: string) {
        let url = `https://${config.service.host}/user/changeMobile`;
        return this.put(url, { mobile, smsId, verifyCode });
    }

}

export interface BalanceDetail {
    Amount: number,
    Balance: number,
    CreateDateTime: Date,
    RelatedId: string,
    RelatedType: string,
    Type: string
}
export interface ScoreDetail {
    Score: number,
    Type: string,
    CreateDateTime: Date,
    Balance: number,
}
export interface Account {
    UserId: string;
    Balance: number;
}
export class AccountService extends Service {
    private url(path: string) {
        return `${config.service.account}${path}`;
    }

    /**
     * 获取用户账户的余额
     */
    balance = () => {
        return userData.balance
    }

    balanceDetails(): Promise<BalanceDetail[]> {
        return this.get<BalanceDetail[]>(this.url('Account/GetBalanceDetails'), {});
    }

    scoreDetails(): Promise<ScoreDetail[]> {
        return this.get<ScoreDetail[]>(this.url('Account/GetScoreDetails'), {});
    }

    account(): Promise<Account> {
        return this.get<Account>(this.url('Account/GetAccount'));
    }

    payOrder(orderId: string, amount: number) {
        let url = this.url('Account/PayOrder');
        return this.put(url, { orderId, amount });
    }
}

// 服务以及实体类模块 结束
//==========================================================

/** 实现数据的存储，以及数据修改的通知 */
export class ValueStore<T> {
    private funcs = new Array<(args: T) => void>();
    private _value: T;

    constructor() {
    }
    add(func: (value: T) => any): (args: T) => any {
        this.funcs.push(func);
        return func;
    }
    remove(func: (value: T) => any) {
        this.funcs = this.funcs.filter(o => o != func);
    }
    fire(value: T) {
        this.funcs.forEach(o => o(value));
    }
    get value(): T {
        return this._value;
    }
    set value(value: T) {
        if (this._value == value)
            return;

        this._value = value;
        this.fire(value);
    }
}

/** 与用户相关的数据 */
class UserData {
    private _productsCount = new ValueStore<number>();
    private _toEvaluateCount = new ValueStore<number>();
    private _sendCount = new ValueStore<number>();
    private _notPaidCount = new ValueStore<number>();
    private _balance = new ValueStore<number>();
    private _nickName = new ValueStore<string>();
    private _shoppingCartItems = new ValueStore<ShoppingCartItem[]>();
    private _userToken = new ValueStore<string>();

    constructor() {
        this.userToken.add((value) => {
            if (!value) {
                localStorage.removeItem('userToken');
                //TODO:ClearData
                return;
            }

            localStorage.setItem('userToken', value);
            //=================================
            // window.setTimeout(() => {
            //     this.loadData();
            // }, 100);
            //=================================
        });
    }

    /** 购物车中的商品数 */
    get productsCount() {
        return this._productsCount;
    }

    /** 待评价商品数 */
    get toEvaluateCount() {
        return this._toEvaluateCount;
    }

    /** 已发货订单数量 */
    get sendCount() {
        return this._sendCount;
    }

    /** 未付货订单数 */
    get notPaidCount() {
        return this._notPaidCount;
    }

    get balance() {
        return this._balance;
    }

    get nickName() {
        return this._nickName;
    }

    get shoppingCartItems() {
        return this._shoppingCartItems;
    }


    get userToken() {
        return this._userToken;
    }
}

export let userData = new UserData();;
userData.userToken.add(() => {
    let ShoppingCart = new ShoppingCartService();

    ShoppingCart.items().then((value) => {
        userData.shoppingCartItems.value = value;
    })

    let member = new MemberService();
    member.userInfo().then((o: UserInfo) => {
        // userData.toEvaluateCount.value = o.ToEvaluateCount;
        // userData.sendCount.value = o.SendCount;
        // userData.notPaidCount.value = o.NotPaidCount;
        // userData.balance.value = 0;
        userData.nickName.value = o.NickName;
    })

    let account = new AccountService();
    account.account().then(o => {
        userData.balance.value = o.Balance;
    });

    let shopping = new ShoppingService();
    shopping.ordersSummary().then(data => {
        userData.toEvaluateCount.value = data.ToEvaluateCount;
        userData.sendCount.value = data.SendCount;
        userData.notPaidCount.value = data.NotPaidCount;
    });

    userData.shoppingCartItems.add(value => {
        //==============================================
        // Price >0 的为山商品，<= 0 的为赠品，折扣
        let sum = 0;
        value.filter(o => o.Price > 0).forEach(o => sum = sum + o.Count);
        userData.productsCount.value = sum;
        //==============================================
    })
});

userData.userToken.value = localStorage.getItem('userToken');

export interface Provinces {
    Id: string,
    Name: string
    Cities: Array<Cities>
}
export interface Cities {
    Id: string,
    Name: string,
}
export class LocationService extends Service {
    private url(path: string) {
        return `${config.service.shop}${path}`;
    }

    getLocation = (data) => {
        return this.get<Provinces[]>("http://restapi.amap.com/v3/ip", data).then(function (result) {
            return result;
        });
    }
    getProvinces = () => {
        return this.get<Provinces[]>(this.url('Address/GetProvinces')).then(function (result) {
            return result;
        });
    }

    getCities = (provinceId) => {
        return this.get<Cities[]>(this.url('Address/GetCities'), { provinceId: provinceId }).then((result) => {
            return result;
        });
    }

    getProvincesAndCities = () => {
        return this.get<any>(this.url('Address/GetProvinces'), { includeCities: true }).then(function (result) {
            return result;
        });
    }
}