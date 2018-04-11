import { defaultNavBar, Menu, PageProps } from 'site';
import { ShoppingService, StationService } from 'services';

// export default function (page: chitu.Page) {
//     let shop = page.createService(ShoppingService);


//     ReactDOM.render(<ClassPage />, page.element);


// }

export class ClassPage extends React.Component<PageProps, { cateories: ProductCategory[] }>{
    constructor(props) {
        super(props);
        this.state = { cateories: [] };
    }
    componentDidMount() {
        let shop = this.props.createService(ShoppingService);
        shop.cateories().then(items => {
            this.state.cateories = items;
            this.setState(this.state);
        })
    }
    render() {
        let cateories = this.state.cateories;
        return (
            <div className="page">
                <header>
                    <nav className="bg-primary">
                        <a href="#home_search" className="search">
                            <div name="search_box" className="form-control" style={{ borderWidth: 0, borderRadius: 4 }}>
                                寻找商品、品牌、品类
                        </div>
                            <div className="search-icon">
                                <i className="icon-search"></i>
                            </div>
                        </a>
                    </nav>
                </header>
                <footer>
                    <Menu pageName={this.props.name} />
                </footer>
                <section className="main">
                    <div className="row">
                        {cateories.map(item => (
                            <a key={item.Id} href={`#home_productList?categoryId=${item.Id}`} className="col-xs-3">
                                <img src={item.ImagePath} />
                                <span className="mini interception">{item.Name}</span>
                            </a>
                        ))}
                    </div>
                </section>
            </div>

        );
    }
}

export default function (page: chitu.Page) {
    let props: PageProps = {
        createService: page.createService,
        element: page.element,
        name: page.name,
    }

    ReactDOM.render(<ClassPage {...props} />, page.element);
}