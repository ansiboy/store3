
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
    appKey: '59a0d63ab58cf427f90c7d3e',// remote //'59c8e00a675d1b3414f83fc3',//
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

    let url = 'http://image.alinq.cn' + path;
    if (width) {
        url = url + '?width=' + width;
    }
    return url;
}

// 公用函数 模块结束
//==========================================================
// 服务以及实体类模块 开始

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
        options.headers['application-key'] = config.appKey
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
                    err.message = '网络连接超时';
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

        console.assert(url.indexOf('?') < 0);

        if (data) {
            url = url + '?' + JSON.stringify(data);
        }

        return this.ajaxByJSON<T>(url, null, 'get');
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
    private ajaxByJSON<T>(url: string, data: Object, method: string) {

        // data = data || {};
        let headers = {};
        headers['content-type'] = 'application/json';
        let body: any;
        if (data)
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

    proudcts(pageIndex?: number): Promise<Product[]> {
        pageIndex = pageIndex === undefined ? 0 : pageIndex;
        let url = StationService.url('Home/GetHomeProducts');
        return this.get<HomeProduct[]>(url, { pageIndex }).then(items => {
            return items.map(o => ({
                Id: o.ProductId, Name: o.Name, Price: o.Price,
                ImagePath: o.ImagePath
            } as Product));
        });
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
        return this.get<Product>(url, { productId });
    }
    productByProperies(groupId: string, properties: { [propName: string]: string }): Promise<Product> {
        type t = { key: string };
        var d = { groupId, filter: JSON.stringify(properties) };
        return this.get<Product>(this.url('Product/GetProductByPropertyFilter'), d);
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

        return this.get<Order[]>(this.url('Order/GetMyOrderList'), { args });
    }
    order(orderId: string) {
        return this.get<Order>(this.url('Order/GetOrder'), { orderId });
        // .then(o => {
        //     o.OrderDetails.forEach(c => c.ImageUrl = imageUrl(c.ImageUrl));
        //     return o;
        // });
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

// const SHOPPING_CART_STORAGE_NAME = 'shoppingCart';
/**
 * 购买车逻辑
 * 1. 用户未登录时，数据保存在本机的 localstorage
 * 2. 用户登录后，从服务端加载购物车数据，并且和本机 localstorage 中
 * 保存的数据进行合并。然后清空 localstorage 中的数据
 */
export class ShoppingCartService extends Service {
    private SHOPPING_CART_STORAGE_NAME = 'shoppingCart';
    private _items: ValueStore<ShoppingCartItem[]>;
    itemChanged: chitu.Callback<ShoppingCartService, ShoppingCartItem>;
    private isLogin: boolean;

    constructor() {
        super();
        this._items = new ValueStore([]);
        this.itemChanged = chitu.Callbacks();
        let str = localStorage.getItem(this.SHOPPING_CART_STORAGE_NAME);

        this.isLogin = userData.userToken.value != null && userData.userToken.value != '';
        userData.userToken.add(value => {
            this.isLogin = value != null && value != '';
            //================================
            // 退出登录，清空本地数据
            if (!this.isLogin) {
                localStorage.removeItem(this.SHOPPING_CART_STORAGE_NAME);
            }
            //================================
        })

        this.initData();
    }

    private async initData() {

        let localItems = this.loadLoaclItems();

        if (!this.isLogin) {
            this._items.value = localItems;
            return;
        }

        let url = this.url('ShoppingCart/Get');
        let items = await this.get<ShoppingCartItem[]>(url)//.then(items => {

        for (let i = 0; i < localItems.length; i++) {
            let item = items.filter(o => o.ProductId == localItems[i].ProductId)[0];
            if (item != null) {
                item.Count = localItems[i].Count + item.Count;
            }
            else {
                items.push(localItems[i]);
            }
        }

        localStorage.removeItem(this.SHOPPING_CART_STORAGE_NAME);
        this._items.value = items;
        if (localItems.length > 0) {
            this.save();
        }
    }

    private url(path: string) {
        return `${config.service.shop}${path}`;
    }

    private save() {
        if (this.isLogin) {
            let url = this.url('ShoppingCart/Save');
            return this.post(url, { items: this._items.value })
        }

        var str = JSON.stringify(this._items.value);
        localStorage.setItem(this.SHOPPING_CART_STORAGE_NAME, str);
        return Promise.resolve();
    }

    private saveItem(item: ShoppingCartItem) {
        return this.save();
    }

    private async addItemByProduct(product: Product, count?: number) {
        count = count || 1;

        let shoppingCartItems = this._items.value;
        let shoppingCartItem = shoppingCartItems.filter(o => o.ProductId == product.Id && o.Type == null)[0];
        if (!shoppingCartItem) {
            shoppingCartItem = {
                Amount: product.Price * count,
                Count: count,
                ImagePath: product.ImagePath,
                Name: product.Name,
                ProductId: product.Id,
                Selected: true,
                Price: product.Price,
            };
            shoppingCartItems.push(shoppingCartItem);
        }
        else {
            shoppingCartItem.Count = shoppingCartItem.Count + count;
        }

        this.itemChanged.fire(this, shoppingCartItem);
        this._items.value = shoppingCartItems;
        return this.saveItem(shoppingCartItem);
    }

    private loadLoaclItems(): ShoppingCartItem[] {
        let str = localStorage.getItem(this.SHOPPING_CART_STORAGE_NAME);
        if (!str)
            return [];

        var items = JSON.parse(str);
        return items;
    }

    get items() {
        return this._items;
    }

    onChanged(component: React.Component<any, any>, callback: (value: ShoppingCartItem[]) => void) {
        let func = this.items.add(callback);
        let componentWillUnmount = (component as any).componentWillUnmount as () => void;
        let items = this.items;
        (component as any).componentWillUnmount = function () {
            items.remove(func);
            componentWillUnmount();
        }
    }

    updateItem(item: ShoppingCartItem) {
        let product = {
            Id: item.ProductId, ImagePath: item.ImagePath,
            Price: item.Price, Name: item.Name,

        } as Product;

        var shoppingCartItems = this.items.value;
        let itemIndex: number;// = this.items.value.filter(o=>o.Id == item.Id);
        shoppingCartItems.forEach((o, i) => {
            if (o.ProductId == item.ProductId) {
                itemIndex = i;
                return;
            }
        })

        if (itemIndex != null)
            shoppingCartItems[itemIndex] = item;
        else
            shoppingCartItems.push(item);

        this.items.value = shoppingCartItems;

        return this.saveItem(item);
    }

    /**
     * 设置购物车中商品数量
     * @param product 要设置的商品 
     * @param count 商品数量
     */
    setItemCount(product: Product, count: number) {
        let item = this.items.value.filter(o => o.ProductId == product.Id)[0];
        if (item) {
            item.Count = count;
            return this.updateItem(item);
        }

        return this.addItemByProduct(product, count);

    }

    setItems(items: ShoppingCartItem[]) {
        let promises = new Array<Promise<any>>();
        for (let i = 0; i < items.length; i++) {
            let p = this.updateItem(items[i]);
            promises.push(p)
        }

        return Promise.all(promises);
    }

    selectAll() {
        let shoppingCartItems = this._items.value;
        for (let i = 0; i < shoppingCartItems.length; i++) {
            shoppingCartItems[i].Selected = true;
        }
        this._items.value = shoppingCartItems;
        this.save();
        return Promise.resolve();
    }

    unselectAll() {
        let shoppingCartItems = this._items.value;
        shoppingCartItems.forEach(o => o.Selected = false);
        this._items.value = shoppingCartItems;
        this.save();
        return Promise.resolve();
    }

    removeAll() {
        this._items.value = [];
        this.save();
        return Promise.resolve();
    }

    get productsCount() {
        let count = 0;
        this._items.value.forEach(o => count = count + o.Count);
        return count;
    }

    get selectedCount() {
        let count = 0;
        this._items.value.filter(o => o.Selected).forEach(o => count = count + o.Count);
        return count;
    }

    /*移除购物车中的多个产品*/
    removeItems(productIds: string[]): Promise<any> {
        this._items.value = this._items.value.filter(o => productIds.indexOf(o.ProductId) < 0);
        return this.save();
    }
}


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

export class LocationService extends Service {
    private url(path: string) {
        return `${config.service.shop}${path}`;
    }

    getLocation = (data) => {
        return this.get<Province[]>("http://restapi.amap.com/v3/ip", data).then(function (result) {
            return result;
        });
    }
    getProvinces = () => {
        return this.get<Province[]>(this.url('Address/GetProvinces')).then(function (result) {
            return result;
        });
    }

    getCities = (provinceId) => {
        return this.get<City[]>(this.url('Address/GetCities'), { provinceId: provinceId }).then((result) => {
            return result;
        });
    }

    getProvincesAndCities = () => {
        return this.get<any>(this.url('Address/GetProvinces'), { includeCities: true }).then(function (result) {
            return result;
        });
    }
}

// 服务以及实体类模块 结束
//==========================================================

/** 实现数据的存储，以及数据修改的通知 */
export class ValueStore<T> {
    private funcs = new Array<(args: T) => void>();
    private _value: T;

    constructor(value?: T) {
        this._value = value;
    }
    add(func: (value: T) => any): (args: T) => any {
        this.funcs.push(func);
        return func;
    }
    subscribe(component: React.Component<any, any>, callback: (value: T) => void) {
        let func = this.add(callback);
        let componentWillUnmount = (component as any).componentWillUnmount as () => void;
        (component as any).componentWillUnmount = () => {
            this.remove(func);
            componentWillUnmount();
        }
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
        // if (this._value == value)
        //     return;

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

    // /** 购物车中的商品数 */
    // get productsCount() {
    //     return this._productsCount;
    // }

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

    // get shoppingCartItems() {
    //     return this._shoppingCartItems;
    // }

    get userToken() {
        return this._userToken;
    }
}



export let userData = new UserData();;
userData.userToken.add((value) => {
    if (!value)
        return;

    let ShoppingCart = new ShoppingCartService();

    // ShoppingCart.getItems().then((value) => {
    //     userData.shoppingCartItems.value = value;
    // })

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

    // userData.shoppingCartItems.add(value => {
    //     //==============================================
    //     // Price >0 的为商品，<= 0 的为赠品，折扣
    //     let sum = 0;
    //     value.filter(o => o.Price > 0).forEach(o => sum = sum + o.Count);
    //     userData.productsCount.value = sum;
    //     //==============================================
    // })
});

userData.userToken.value = localStorage.getItem('userToken');


