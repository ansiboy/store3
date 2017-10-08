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
                    address:string,
                    addressComponents:{
                        province: string, city: string, district: string,
                        street: string, streetNumber: string
                    }
                }
            ) => void);
    }
}

