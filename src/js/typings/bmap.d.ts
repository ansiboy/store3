declare namespace BMap {
    class Convertor {
        translate(
            points: Array<Point>, from: number, to: number,
            callback: (rs: { status: number, points: Array<Point> }) => void
        );
    }
    class Point {
        constructor(x: number, y: number);
    }
    class Geocoder {
        getLocation(
            pt: Point,
            callback: (
                rs: {
                    address: string,
                    addressComponents: {
                        province: string, city: string, district: string,
                        street: string, streetNumber: string
                    }
                }
            ) => void);
    }
    interface LocalResult {
        /** 本次检索的关键词 */
        keyword: string;
        /** 周边检索的中心点（仅当周边检索时提供） */
        center: any;
        /** 周边检索的半径（仅当周边检索时提供） */
        radius: number;
        /** 范围检索的地理区域（仅当范围检索时提供） */
        bounds: any;
        /** 本次检索所在的城市 */
        city: string;
        /** 更多结果的链接，到百度地图进行搜索 */
        moreResultsUrl: string;
        /** 本次检索所在的省份 */
        province: string;
        /** 搜索建议列表。（当关键词是拼音或拼写错误时给出的搜索建议） */
        suggestions: Array<string>;
        /** 检索结果点 */
        vr: LocalResultPoi[]
    }
    interface LocalResultPoi {
        /** 结果的名称标题 */
        title: string;
        /** 该结果所在的地理位置 */
        point: Point;
        /** 在百度地图中展示该结果点的详情信息链接 */
        url: string;
        /* 地址（根据数据部分提供）。注：当结果点类型为公交站或地铁站时，地址信息为经过该站点的所有车次 */
        address: string;
        /* 所在城市 */
        city: string;
        /* 电话，根据数据部分提供 */
        phoneNumber: string;
        /* 邮政编码，根据数据部分提供 */
        postcode: string;
        /* 
         * 类型，根据数据部分提供 
         * 0 一般位置点
         * 1 公交车站位置点
         * 2 地铁车站位置点
         */
        type: 0 | 1 | 2;
    }
    class LocalSearch {
        constructor(location: Map | Point | String, opts: LocalSearchOptions);
        search(keyword: string);
        searchNearby(keyword: string | string[], center: LocalResultPoi | String | Point, radius: Number, option: Object)
    }

    interface LocalSearchOptions {
        /** 表示是否将搜索范围约束在当前城市 */
        forceLocal?: Boolean;
        onSearchComplete: (result: LocalResult | Array<LocalSearch>) => void;
    }

    class Map {

    }
}

