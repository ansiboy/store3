declare module "jweixin" {
    function config(value);
    function ready(callback: Function)
    function error(callback: Function)
    function onMenuShareTimeline(value)
    function onMenuShareAppMessage(value)
}