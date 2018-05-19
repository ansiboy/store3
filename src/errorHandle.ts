import { userData, ServiceError, Service } from 'services';
import * as ui from 'ui';
import { siteMap } from 'site';

const loadingClassName = 'loading';
// let isLoginPage = false;
export default function (app: chitu.Application<any>, err: ServiceError) {

    var currentPage = app.currentPage;
    switch (err.name) {
        case '600':     //600 为未知异常
        default:
            ui.alert({ title: '错误', message: err.message });
            console.log(err);
            break;
        case '724':     //724 为 token 失效
        case '601':     //601 为用户未登录异常
            if (err.name == '724') {
                userData.userToken.value = '';
            }
            let isLoginPage = currentPage.name == 'user.login';
            if (isLoginPage) {
                return;
            }
            //========================================================
            // 1. 如果在打开页面的过程中页面出现未登录，就关掉打开的页面    
            // 2. 如果是点击按钮的时候出现未登录，就调转登录页面       
            if ((err.method || 'get') == 'get') {
                app.showPage(siteMap.nodes.user_login, { return: currentPage.name });
                currentPage.close()
                // setTimeout(() => currentPage.close(), 100);
            }
            else {
                app.redirect(siteMap.nodes.user_login, { return: currentPage.name });
            }
            //========================================================
            break;
        case '725':
            ui.alert({ title: '错误', message: 'application-key 配置错误' });
            break;
    }
}
