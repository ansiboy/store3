import { userData } from 'services';

const loadingClassName = 'loading';

let isLoginPage = false;
export default function (app: chitu.Application, err: Error) {
    
    var currentPage = app.currentPage;    
    switch (err.name) {
        case '600':     //600 为未知异常
        default:
            ui.alert({ title: '错误', message: err.message });
            console.log(err);
            break;
        case '601':     //601 为用户未登录异常
            if (isLoginPage) {
                return;
            }
            isLoginPage = true;
            app.showPage('user_login', { return: currentPage.routeData.routeString });
            setTimeout(() => {
                isLoginPage = false;
                currentPage.close();
            }, 800);
            break;
        case '724':
        //59a0d63ab58cf427f90c7d3e
            userData.userToken.value = null;
            
            app.showPage('user_login', { return: currentPage.routeData.routeString });
            break;
    }
}