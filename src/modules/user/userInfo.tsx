import { Page, defaultNavBar, app } from 'site';
import { ShoppingService, MemberService } from 'services';
import * as ui from 'ui';

export default async function (page: Page) {
    let member = page.createService(MemberService);
    let userInfo = await member.userInfo();

    type ValueSelectorValueType = string | number | Date;
    type ValueSelectorItem = { name: string, value: ValueSelectorValueType };
    interface ValueSelectorProps extends React.Props<ValueSelector> {
        items: Array<{ name: string, value: ValueSelectorValueType }>;
        value: ValueSelectorValueType,
        title?: string
    }

    interface ValueSelectorState {
        value: ValueSelectorValueType
    }

    class ValueSelector extends React.Component<ValueSelectorProps, ValueSelectorState>{

        private element: HTMLElement;
        valueChanged: (item: ValueSelectorItem) => void;

        constructor(props) {
            super(props);
            this.state = { value: this.props.value };
        }

        private changeValue(item: ValueSelectorItem) {
            this.state.value = item.value;
            this.setState(this.state);
            if (this.valueChanged != null) {
                this.valueChanged(item)
            }
        }
        show() {
            this.element.style.removeProperty('display');
        }
        hide() {
            this.element.style.display = 'none';
        }
        render() {
            let value = this.state.value;
            let items = this.props.items;
            let title = this.props.title || '';

            return (
                <div ref={(o: HTMLElement) => this.element = this.element || o} style={{ display: 'none' }}>
                    <div className="modal fade in" style={{ display: 'block' }}
                        onClick={() => { this.hide(); }}>
                        <div className="list-group " style={{ position: 'absolute', bottom: 0, width: '100%' }}
                            onClick={(e) => {
                                e.stopPropagation();
                            }}>
                            <div className="list-group-item">
                                <span style={{ fontWeight: '700' }}>{title}</span>
                                <i className="icon-remove pull-right" onClick={() => this.hide()}>
                                </i>
                            </div>
                            {items.map(item =>
                                <div key={item.name} className="list-group-item"
                                    onClick={() => {
                                        this.changeValue(item);
                                        setTimeout(() => this.hide(), 200);
                                    }}>
                                    <span>{item.name}</span>
                                    <i className="pull-right icon-ok"
                                        style={{ display: value == item.value ? 'block' : 'none' }} />
                                </div>

                            )}
                        </div>
                    </div>
                    <div className="modal-backdrop fade in" />
                </div>
            );
        }
    }

    class UserInfoPage extends React.Component<{}, { userInfo: UserInfo }>{
        private genderSelector: ValueSelector;
        private userImage: HTMLImageElement;

        constructor(props) {
            super(props);
            this.state = { userInfo };
        }
        showGenderSelector() {
            this.genderSelector.show();
        }
        saveUserInfo() {
            debugger;
            return member.saveUserInfo(this.state.userInfo);
        }
        /** 将图片文件转换为 base64 字符串 */
        imageFileToBase64(file: File): Promise<string> {
            return new Promise<string>((resolve, reject) => {
                if (!(/image/i).test(file.type)) {
                    console.log("File " + file.name + " is not an image.");
                    reject();
                }

                var reader = new FileReader();
                reader.readAsArrayBuffer(file);
                reader.onload = (ev: Event) => {
                    var blob = new Blob([event.target['result']]);
                    var blobURL = URL.createObjectURL(blob);
                    var image = new Image();

                    let width = 100;
                    let height = 100;

                    image.style.width = `${width}px`;
                    image.style.height = `${height}px`;
                    image.src = blobURL;
                    image.onload = () => {
                        var canvas = document.createElement('canvas');
                        canvas.width = width;
                        canvas.height = height;
                        var ctx = canvas.getContext("2d");
                        ctx.drawImage(image, 0, 0, width, height);

                        let data = canvas.toDataURL("/jpeg", 0.1);
                        resolve(data);
                    }
                }
            })
        }
        componentDidMount() {
            this.genderSelector.valueChanged = (item) => {
                this.state.userInfo.Gender = item.value as string;
                this.setState(this.state);
            }

            ui.renderImage(this.userImage);
        }
        render() {
            let userInfo = this.state.userInfo;
            return (
                <div>
                    <header>
                        {defaultNavBar({ title: '用户信息' })}
                    </header>
                    <section className="container">
                        <div className="form-group">
                            <div className="list-group">
                                <div className="list-group-item row">
                                    <div className="col-xs-3">
                                        <label style={{ position: 'relative', top: 30 }}>
                                            头像
                                        </label>
                                    </div>
                                    <div className="col-xs-9">
                                        <div className="pull-right" style={{ paddingLeft: 10, position: 'relative', top: 30 }}>
                                            <i className="icon-chevron-right"></i>
                                        </div>
                                        <img className="img-circle pull-right" style={{ width: 70, height: 70 }}
                                            src={userInfo.HeadImageUrl} title="上传头像"
                                            ref={(e: HTMLImageElement) => this.userImage = e || this.userImage} />
                                        <input type="file" style={{ position: 'absolute', top: 0, left: 0, opacity: 0, width: '100%', height: 90 }} accept="images/*" multiple={false}
                                            onChange={(e) => {
                                                let file = (e.target as HTMLInputElement).files[0];
                                                if (!file) return;
                                                ui.imageFileToBase64(file, { width: 100, height: 100 }).then(data => {
                                                    this.userImage.src = data.base64;
                                                    userInfo.HeadImageUrl = data.base64;
                                                })


                                            }} />
                                    </div>
                                </div>
                                <div className="list-group-item row">
                                    <label className="col-xs-3">
                                        昵称
                                    </label>
                                    <div data-bind="click:$root.edit('NickName'),tap:$root.edit('NickName')" className="col-xs-9"
                                        style={{ paddingLeft: 0 }}>
                                        <input className="form-control" placeholder="请输入昵称" style={{ textAlign: 'right' }}
                                            value={userInfo.NickName || ''}
                                            onChange={(e) => {
                                                this.state.userInfo.NickName = (e.target as HTMLInputElement).value;
                                                this.setState(this.state);
                                            }} />
                                    </div>
                                </div>
                                <div className="list-group-item row">
                                    <label className="col-xs-3">
                                        性别
                                    </label>
                                    <div className="col-xs-9" style={{ paddingLeft: 0, textAlign: 'right' }}>
                                        <span style={{ color: 'gray' }} className="form-control"
                                            onClick={() => {
                                                this.showGenderSelector();
                                            }}>
                                            {userInfo.Gender == 'Male' ? '男' : null}
                                            {userInfo.Gender == 'Female' ? '女' : null}
                                            {userInfo.Gender == 'None' || !userInfo.Gender ? '请选择性别' : null}
                                        </span>
                                    </div>
                                </div>
                                <div className="list-group-item row">
                                    <label className="col-xs-3">
                                        地区
                                    </label>
                                    <div className="col-xs-9" style={{ paddingLeft: 0 }}>
                                        <div className="pull-right" style={{ paddingLeft: 10 }}>
                                            <i className="icon-chevron-right"></i>
                                        </div>
                                        <div className="pull-right"></div>
                                        <div className="pull-right text-danger pull-right">未填写</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="form-group">
                            <button className="btn btn-success btn-block"
                                ref={(e: HTMLButtonElement) => {
                                    if (!e) return;
                                    e.onclick = ui.buttonOnClick(() => this.saveUserInfo(), { toast: '用户信息保存成功' })
                                }}>
                                保存
                            </button>
                        </div>
                        <ValueSelector ref={(o) => this.genderSelector = o || this.genderSelector} items={[{ name: '男', value: 'Male' }, { name: '女', value: 'Female' }]}
                            value={userInfo.Gender} title="请选择性别" />
                    </section>
                </div>
            )
        }
    }

    ReactDOM.render(<UserInfoPage />, page.element);
} 