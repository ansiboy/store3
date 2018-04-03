import { Page, defaultNavBar } from 'site';
import * as ui from 'ui';
import * as services from 'services';
import { app } from 'site';
import FormValidator = require('core/formValidator');

// export function (page: Page) {
//     let member = page.createService(services.MemberService);
//     let usernameInput: HTMLInputElement;
//     let passwordInput: HTMLInputElement;
//     let formElement: HTMLFormElement;
//     let validator: FormValidator;

//     let returnString = page.data.return || 'user_index';
//     //===================================
//     // 如果跳转页面为登录页面，则设为首页
//     if (returnString == 'user_login') {
//         returnString = 'home_index';
//     }
//     //===================================
//     var jsx =
//         <div>
//             <header>
//                 {defaultNavBar({ title: "登录" })}
//             </header>
//             <footer></footer>
//             <section>
//                 <form className="form-horizontal container"
//                     ref={(e: HTMLFormElement) => formElement = e || formElement}>
//                     <div className="form-group">
//                         <div className="col-xs-12">
//                             <input type="text" name="username" className="form-control" placeholder="手机号码"
//                                 ref={(e: HTMLInputElement) => usernameInput = e || usernameInput} />
//                         </div>
//                     </div>
//                     <div className="form-group">
//                         <div className="col-xs-12">
//                             <input type="password" name="password" className="form-control" placeholder="密码"
//                                 ref={(e: HTMLInputElement) => passwordInput = e || passwordInput} />
//                         </div>
//                     </div>
//                     <div className="form-group">
//                         <div className="col-xs-12">
//                             <button id="Login" type="button" className="btn btn-primary btn-block"
//                                 ref={(e: HTMLButtonElement) => {
//                                     if (!e) return;
//                                     e.onclick = ui.buttonOnClick(async () => {
//                                         if (!validator) {
//                                             validator = new FormValidator(formElement, {
//                                                 username: {
//                                                     rules: ['required', 'mobile'],
//                                                     display: '手机号码'
//                                                 },
//                                                 password: { rules: ['required'], display: '密码' }
//                                             });
//                                         }

//                                         if (!validator.validateForm())
//                                             return;

//                                         await member.login(usernameInput.value, passwordInput.value);
//                                         app.redirect(returnString);
//                                     });
//                                 }}>立即登录</button>
//                         </div>
//                         <div className="col-xs-12 text-center" style={{ marginTop: 10 }}>
//                             <a href="#user_register" className="pull-left">我要注册</a>
//                             <a href="#user_resetPassword" className="pull-right">忘记密码</a>
//                         </div>
//                     </div>
//                 </form>
//             </section>
//         </div>;

//     ReactDOM.render(jsx, page.element);
// }

interface Props {
    member: services.MemberService,
    data
}

export default class LoginPage extends React.Component<Props, any>{
    validator: any;
    passwordInput: any;
    usernameInput: any;
    formElement: any;
    render() {
        let returnString = this.props.data.return || 'user_index';
        var jsx =
            <div>
                <header>
                    {defaultNavBar({ title: "登录" })}
                </header>
                <footer></footer>
                <section>
                    <form className="form-horizontal container"
                        ref={(e: HTMLFormElement) => this.formElement = e || this.formElement}>
                        <div className="form-group">
                            <div className="col-xs-12">
                                <input type="text" name="username" className="form-control" placeholder="手机号码"
                                    ref={(e: HTMLInputElement) => this.usernameInput = e || this.usernameInput} />
                            </div>
                        </div>
                        <div className="form-group">
                            <div className="col-xs-12">
                                <input type="password" name="password" className="form-control" placeholder="密码"
                                    ref={(e: HTMLInputElement) => this.passwordInput = e || this.passwordInput} />
                            </div>
                        </div>
                        <div className="form-group">
                            <div className="col-xs-12">
                                <button id="Login" type="button" className="btn btn-primary btn-block"
                                    ref={(e: HTMLButtonElement) => {
                                        if (!e) return;
                                        e.onclick = ui.buttonOnClick(async () => {
                                            if (!this.validator) {
                                                this.validator = new FormValidator(this.formElement, {
                                                    username: {
                                                        rules: ['required', 'mobile'],
                                                        display: '手机号码'
                                                    },
                                                    password: { rules: ['required'], display: '密码' }
                                                });
                                            }

                                            if (!this.validator.validateForm())
                                                return;

                                            await this.props.member.login(this.usernameInput.value, this.passwordInput.value);
                                            app.redirect(returnString);
                                        });
                                    }}>立即登录</button>
                            </div>
                            <div className="col-xs-12 text-center" style={{ marginTop: 10 }}>
                                <a href="#user_register" className="pull-left">我要注册</a>
                                <a href="#user_resetPassword" className="pull-right">忘记密码</a>
                            </div>
                        </div>
                    </form>
                </section>
            </div>;

        return jsx;
    }
}

export async function props(page: chitu.Page): Promise<Props> {
    return {
        member: page.createService(services.MemberService),
        data: page.data
    };
}