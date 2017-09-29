import { userData } from 'services';
import * as ui from 'ui';

const loadingClassName = 'loading';

// let isLoginPage = false;
export default function (app: chitu.Application, err: Error) {

    var currentPage = app.currentPage;
    switch (err.name) {
        case '600':     //600 为未知异常
        default:
            ui.alert({ title: '错误', message: err.message });
            console.log(err);
            break;
        case '601':     //601 为用户未登录异常
            let isLoginPage = currentPage.name == 'user.login';
            if (isLoginPage) {
                return;
            }
            app.redirect('user_login', { return: currentPage.routeData.routeString });
            break;
        case '724':
            userData.userToken.value = null;
            app.redirect('user_login', { return: currentPage.routeData.routeString });
            break;
        case '725':
            ui.alert({ title: '错误', message: 'application-key 配置错误' });
            break;
    }
}
