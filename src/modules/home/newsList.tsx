import { Page, defaultNavBar, Menu, app, siteMap } from 'site';
import { StationService } from 'services';
import { DataList } from 'components/dataList';

export default function (page: Page) {
    let station = page.createService(StationService);

    class NewsListView extends React.Component<{}, {}>{
        private dataView: HTMLElement;
        loadNewsList(pageIndex: number): Promise<News[]> {
            return station.newsList(pageIndex).then(o => {
                return o;
            });
        }
        render() {
            return (
                <div className="page">
                    <header>
                        {(defaultNavBar({ title: '微资讯', showBackButton: false }))}
                    </header>
                    <footer>
                        <Menu pageName={page.name} />
                    </footer>
                    <section className="main">
                        <DataList loadData={(i) => this.loadNewsList(i)}
                            dataItem={(o: News) =>
                                <a key={o.Id} className="item" onClick={() => app.redirect(siteMap.nodes.home_news, { id: o.Id })}>
                                    <img src={o.ImgUrl} className="img-responsive" ref={(e: HTMLImageElement) => e ? ui.renderImage(e) : null} />
                                    <div className="title">{o.Title}</div>
                                </a>
                            }
                        />
                    </section>
                </div>
            );
        }
    }

    ReactDOM.render(<NewsListView />, page.element);
}

