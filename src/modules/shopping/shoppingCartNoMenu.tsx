import { Page } from 'site';
// export { default } from 'modules/shopping/shoppingCart';
import func from 'modules/shopping/shoppingCart';
// export default function (page: Page) {
//     createShoppingCartPage(page, true);
// }

export default function (page: chitu.Page) {
    return func(page, true)
}