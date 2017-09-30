interface DataSourceSelectArguments {
    startRowIndex?: number,
    maximumRows?: number,
    filter?: string
}

interface DataSourceSelectResult<T> {
    DataItems: T[],
    MaximumRows?: number,
    StartRowIndex?: number,
    TotalRowCount: number
}

interface HomeProduct {
    Id: string, Name: string, ImagePath: string,
    ProductId: string, Price: number, PromotionLabel: string,
    Title: string
}

interface CustomProperty {
    Name: string,
    Options: Array<{ Name: string, Selected: boolean, Value: string }>
}

interface Product {
    Id: string, Arguments: Array<{ key: string, value: string }>,
    BrandId: string, BrandName: string, Price: number,
    Score: number, Unit: string, MemberPrice: number,
    Fields: Array<{ key: string, value: string }>,
    GroupId: string, ImagePath: string, ImagePaths: Array<string>,
    ProductCategoryId: string, Name: string, //IsFavored?: boolean,
    ProductCategoryName: string,
    CustomProperties: Array<CustomProperty>,
    Promotions: Promotion[],
    Title: string
}

interface Promotion {
    Type: 'Given' | 'Reduce' | 'Discount',
    Contents: {
        Id: string,
        Description: string
    }[],
}
type FavorProduct = {
    Id: string;
    ProductId: string,
    ProductName: string,
    ImageUrl: string
}
interface ProductCategory {
    Id: string, Name: string, ImagePath: string
}
interface Order {
    Id: string,
    Amount: number,
    CouponTitle: string,
    Discount: number,
    Freight: number,
    Invoice: string,
    OrderDate: Date,
    OrderDetails: OrderDetail[],
    ReceiptAddress: string,
    Remark: string,
    Serial: string,
    Status: string,
    Sum: number,
}
interface OrderDetail {
    // Id: string,
    ImageUrl: string,
    ProductId: string,
    ProductName: string,
    Price: number,
    Quantity: number,
    Score: number
}
interface ReceiptInfo {
    Address: string,
    CityId: string,
    CityName: string,
    Consignee: string,
    CountyId: string,
    CountyName: string,
    FullAddress: string,
    Id: string,
    IsDefault: boolean,
    Mobile: string,
    Name: string,
    Phone: string,
    PostalCode: string,
    ProvinceId: string,
    ProvinceName: string,
    RegionId: string
}
interface Region {
    Id: string,
    Name: string
}
interface ProductComent {
    Id: string,
    Name: string,
    ImageUrl: string,
    Status: 'Evaluated' | 'ToEvaluate',
    OrderDetailId: string,
}
interface Coupon {
    Id: string,
    Amount: number,
    Discount: number,
    Remark: string,
    Title: string,
    ValidBegin: Date,
    ValidEnd: Date,
}
interface CouponCode {
    Id: string,
    Amount: number,
    Code: string,
    Discount: number,
    CouponId: string,
    Remark: string,
    ReceiveBegin: Date,
    ReceiveEnd: Date,
    Title: string,
    ValidBegin: Date,
    ValidEnd: Date,
    UsedDateTime: Date,
    CreateDateTime: Date,
}

interface ShoppingCartItem {
    Id: string,
    Amount: number,
    Count: number,
    ImagePath: string,
    Name: string,
    ProductId: string,
    Remark?: string,
    Selected: boolean,
    // Unit: string,
    Price: number,

    /**
     * 优惠类型，Reduce 为满减, Discount 为满折，Given 为满赠
     */
    Type?: 'Given' | 'Reduce' | 'Discount'
}

interface News {
    Id: string,
    Title: string,
    ImgUrl: string,
    Date: Date,
    Content: string
}

interface UserInfo {
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

interface RegisterModel {
    user: { mobile: string, password: string },
    smsId: string,
    verifyCode: string
}

type VerifyCodeType = 'reigster' | 'changeMobile';

interface BalanceDetail {
    Amount: number,
    Balance: number,
    CreateDateTime: Date,
    RelatedId: string,
    RelatedType: string,
    Type: string
}

interface ScoreDetail {
    Score: number,
    Type: string,
    CreateDateTime: Date,
    Balance: number,
}

interface Account {
    UserId: string;
    Balance: number;
}

interface Province {
    Id: string,
    Name: string
    Cities: Array<City>
}

interface City {
    Id: string,
    Name: string,
}

