declare interface jweixin {
    config(value);
    ready(callback: Function)
    error(callback: (res: { errMsg: string }) => void)
    onMenuShareTimeline(value)
    onMenuShareAppMessage(value)
    getLocation(args: {
        type: 'wgs84',
        success: (res: {
            latitude: number,
            longitude: number,
            speed: number,
            accuracy: number
        }) => void,
        fail(err)
    });
}

declare module "jweixin" {
    export = jweixin;
}