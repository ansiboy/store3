import { Page, Menu, defaultNavBar } from 'site';
import { StationService } from 'services';
import * as site from 'site';

let { PageComponent, PageHeader, PageFooter, PageView, HtmlView } = controls;

// import Vue = require('vue');

export default function (page: Page) {
    let station = page.createService(StationService);
    let id = page.data.id;
    console.assert(id);

    class NewsPage extends React.Component<{ news: News }, {}>{
        render() {
            let news = this.props.news;
            return (
                <div>
                    <header>
                        {defaultNavBar({ title: '资讯详情' })}
                    </header>
                    <section>
                        <div className="container">
                            <h2>{news.Title}</h2>
                            <div className="small">
                                {news.Date.toLocaleDateString()}
                            </div>
                            <HtmlView content={news.Content} />
                        </div>
                    </section>
                </div>
            );
        }
    }

    station.news(id).then(news => {
        ReactDOM.render(<NewsPage news={news} />, page.element);
    })

}

