import { Page, defaultNavBar } from 'site';
import { ShoppingService } from 'services';
import{ImageFileSelector} from 'components/ImageFileSelector';
// let { PageComponent, PageHeader, PageFooter, PageView, Button, ImageFileSelector, ImageBox } = controls;

export type RouteValues = { orderDetailId: string, productImageUrl: string };
export default function (page: Page) {

    let shop = page.createService(ShoppingService);

    class Start extends React.Component<React.Props<Start> & { selected: boolean }, { selected: boolean }>{
        constructor(props) {
            super(props);
            this.state = { selected: this.props.selected };
        }
        get selected() {
            return this.state.selected;
        }
        render() {
            let selected = this.state.selected;
            return (
                <i className={selected ? "icon-star" : 'icon-star-empty'}
                    onClick={() => {
                        this.state.selected = !this.state.selected;
                        this.setState(this.state);
                    }} />
            );
        }
    }

    const minWordCount = 10, maxWordCount = 100;
    let starts = new Array<JSX.Element>();
    let startObjects = new Array<Start>();
    for (let i = 0; i < 5; i++) {
        starts.push(<Start ref={o => startObjects.push(o)} key={i} selected={true} />)
    }

    class ProductEvaluate extends React.Component<RouteValues,
        { evaluation: string, anonymous: boolean }>{

        private imageFileSelector: ImageFileSelector;

        constructor(props) {
            super(props);
            this.state = { evaluation: '', anonymous: true };
        }
        submit() {
            let score = startObjects.filter(o => o.selected).length;
            let { evaluation, anonymous } = this.state;
            let imageDatas = this.imageFileSelector.imageDatas;//.join(',');
            shop.evaluateProduct(orderDetailId, score, evaluation, anonymous, imageDatas);
            return Promise.resolve();
        }
        componentDidMount() {
        }
        render() {
            let evaluation = this.state.evaluation || '';
            return (
                <div className="page">
                    <header>
                        {defaultNavBar({ title: '商品评价' })}
                    </header>
                    <footer>
                        <div className="container" style={{ paddingTop: 10, paddingBottom: 10, height: 50 }}>
                            <button className="btn btn-primary btn-block"
                                ref={(e: HTMLButtonElement) => {
                                    if (!e) return;
                                    ui.buttonOnClick(() => this.submit(), { confirm: '确定要发表评价吗？' })
                                }}>提交</button>
                        </div>
                    </footer>
                    <section>
                        <div className="container">
                            <div className="row">
                                <div className="col-xs-4">
                                    <img src={this.props.productImageUrl} className="img-responsive img-thumbnail"
                                        ref={(e: HTMLImageElement) => e ? ui.renderImage(e) : null} />
                                </div>
                                <div className="col-xs-8" style={{ paddingLeft: 0 }}>
                                    <label>评分</label>
                                    <div>{starts}</div>
                                </div>
                            </div>
                            <div className="row evaluation">
                                <div className="col-xs-12">
                                    <textarea className="form-control" placeholder={`长度在${minWordCount}至${maxWordCount}字之间`}
                                        value={evaluation}
                                        onChange={(e) => {
                                            this.state.evaluation = (e.target as HTMLTextAreaElement).value;
                                            this.setState(this.state);
                                        }} />
                                    <div className="word-num">{maxWordCount - evaluation.length}</div>
                                </div>
                            </div>
                            <div className="row anonymous">
                                <div className="col-xs-12 checkbox">
                                    <label>
                                        <input checked={this.state.anonymous} type="checkbox"
                                            onChange={(e) => {
                                                this.state.anonymous = !this.state.anonymous;
                                                this.setState(this.state);
                                            }}
                                        />
                                        匿名评价
                                </label>
                                </div>
                            </div>
                            <div className="row pictures">
                                <div className="col-xs-12">
                                    <ImageFileSelector ref={(o) => this.imageFileSelector = o} />
                                </div>
                            </div>
                        </div>
                    </section>
                </div>
            );
        }
    }

    let { orderDetailId, productImageUrl } = page.data as RouteValues;
    ReactDOM.render(<ProductEvaluate orderDetailId={orderDetailId} productImageUrl={productImageUrl} />, page.element);
}

