import { SiteMap, SiteMapNode, Page } from "chitu";

const UserIndexWeight = 20;
const UserReceiptListWeight = UserIndexWeight + 10;
const UserReceiptEditWeight = UserReceiptListWeight + 10;

let nodes = {
    home_index: {
        action: 'modules/home/index',
        cache: true,
    },
    home_class: {
        action: 'modules/home/class',
        cache: true,
        weight: 1,
    },
    home_location: {
        action: 'modules/home/location',
        cache: true,
    },
    home_product: {
        action: 'modules/home/product',
        weight: 10,
    },
    shopping_shoppingCartNoMenu: {
        action: 'modules/shopping/shoppingCartNoMenu',
        weight: 20,
    },
    shopping_orderProducts: {
        action: 'modules/shopping/orderProducts'
    },
    shopping_orderList: {
        action: 'modules/shopping/orderList',
        weight: UserIndexWeight + 10,
    },
    shopping_purchase: {
        action: 'modules/shopping/purchase',
    },
    shopping_invoice: {
        action: 'modules/shopping/invoice',
    },
    user_index: {
        action: 'modules/user/index',
        weight: UserIndexWeight,
    },
    user_regions: {
        action: 'modules/user/regions'
    },
    user_receiptList: {
        action: 'modules/user/receiptList',
        weight: UserReceiptListWeight,
    },
    user_receiptEdit: {
        action: 'modules/user/receiptEdit',
        weight: UserReceiptEditWeight,
    },
    user_login: {
        action: 'modules/user/login',
        cache: true,
    },
    user_scoreList: {
        action: 'modules/user/scoreList',
    },
    user_userInfo: {
        action: 'modules/user/userInfo',
    },
    user_coupon: {
        action: 'modules/user/coupon',
    },

    user_accountSecurity_index: {
        action: 'modules/user/accountSecurity/index',
    },
    user_accountSecurity_loginPassword: {
        action: 'modules/user/accountSecurity/loginPassword'
    },
    user_accountSecurity_mobileBinding: {
        action: 'modules/user/accountSecurity/mobileBinding',
    },
    AccountSecurity_Setting_PaymentPassword: {
        action: 'modules/accountSecurity/paymentPassword'
    }
}

nodes['index'] = nodes.home_index;

let siteMap = {
    nodes
};

export interface PageProps {
    createService<T extends chitu.Service>(type?: chitu.ServiceConstructor<T>): T,
    element: HTMLElement,
    name: string,
}


function createAction(path: string): (page: Page) => void {
    return function (page: Page) {
        requirejs([path], async function (exports) {
            let pageProps: PageProps = {
                createService: page.createService.bind(page),
                element: page.element,
                name: page.name
            }

            let props = exports.props;
            if (typeof props == 'function') {
                let obj = await props(page);
                pageProps = Object.assign(pageProps, obj);
            }

            console.assert(exports.default != null);
            let reactElement = React.createElement(exports.default, { ...pageProps })
            ReactDOM.render(reactElement, page.element);
        })
    }
}

export default siteMap;