import { SiteMap, SiteMapNode, Page } from "chitu";

let siteMap = {
    index: {
        action: createAction('modules/home/index'),
        children: {
            // 'home_index': 'modules/home/index',
            'home_class': {
                action: createAction('modules/home/class'),
            },
            'shopping_shoppingCart': createAction('modules/shopping/shoppingCart'),
            'shopping_shoppingCartNoMenu': createAction('modules/shopping/shoppingCartNoMenu'),
            /** 用户中心 */
            'user_index': {
                action: createAction('modules/user/index'),
                children: {
                    user_receiptList: createAction('modules/user/receiptList'),
                    shopping_orderList: createAction('modules/shopping/orderList'),
                    user_scoreList: createAction('modules/user/scoreList'),
                    user_userInfo: createAction('modules/user/userInfo'),
                    user_coupon: createAction('modules/user/coupon'),
                    user_accountSecurity_index: {
                        action: createAction('modules/user/accountSecurity/index'),
                        children: {
                            user_accountSecurity_loginPassword: createAction('modules/user/accountSecurity/loginPassword'),
                            user_accountSecurity_mobileBinding: createAction('modules/user/accountSecurity/mobileBinding'),
                            AccountSecurity_Setting_PaymentPassword: createAction('modules/accountSecurity/paymentPassword')
                        }
                    },
                }
            },
            'home_product': {
                action: createAction('modules/home/product'),
                children: {
                    'shopping_shoppingCartNoMenu': createAction('modules/shopping/shoppingCartNoMenu')
                }
            },
            'user_login': createAction('modules/user/login'),
            shopping_orderProducts: createAction('modules/shopping/orderProducts'),
        }
    }
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

export default siteMap as SiteMap<SiteMapNode>;