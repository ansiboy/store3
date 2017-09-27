import { ValueStore, imageUrl } from 'services';



const SHOPPING_CART_STORAGE_NAME = 'shoppingCart';
export class ShoppingCart {
    items: ValueStore<ShoppingCartItem[]>;

    constructor() {
        this.items = new ValueStore();
        let str = localStorage.getItem(SHOPPING_CART_STORAGE_NAME);
        this.items.value = str ? JSON.parse(str) : [];
    }

    private save() {
        var str = JSON.stringify(this.items.value);
        localStorage.setItem(SHOPPING_CART_STORAGE_NAME, str);
    }

    addItem(product: Product, count?: number) {
        count = count || 1;

        let shoppingCartItems = this.items.value;
        let shoppingCartItem = shoppingCartItems.filter(o => o.ProductId == product.Id && o.Type == null)[0];
        if (!shoppingCartItem) {
            shoppingCartItem = {
                Id: this.guid(),
                Amount: product.Price * count,
                Count: count,
                ImageUrl: imageUrl(product.ImagePath),
                Name: product.Name,
                ProductId: product.Id,
                Remark: '',
                Selected: true,
                Unit: product.Unit,
                Price: product.Price,
            };
            this.items.value.push(shoppingCartItem);
        }
        else {
            shoppingCartItem.Count = shoppingCartItem.Count + count;
        }

        this.items.value = shoppingCartItems;
        this.save();
        return Promise.resolve();
    }


    _updateItem(productId: string, count: number, selected?: boolean) {
        let shoppingCartItems = this.items.value;
        let shoppingCartItem = shoppingCartItems.filter(o => o.ProductId == productId)[0];
        if (!shoppingCartItem)
            return;

        if (count <= 0) {
            shoppingCartItems = shoppingCartItems.filter(o => o != shoppingCartItem);
        }
        else {
            shoppingCartItem.Count = count;
        }

        if (selected != null)
            shoppingCartItem.Selected = selected;

        this.items.value = shoppingCartItems;

        return Promise.resolve();
    }
    updateItem(productId: string, count: number, selected?: boolean) {
        this._updateItem(productId, count, selected);
        this.save();
        return Promise.resolve();
    }

    updateItems(productIds: string[], quantities: number[]) {
        for (let i = 0; i < productIds.length; i++) {
            this.updateItem(productIds[i], quantities[i]);
        }

        return Promise.resolve();
    }

    selectAll() {
        let shoppingCartItems = this.items.value;
        for (let i = 0; i < shoppingCartItems.length; i++) {
            shoppingCartItems[i].Selected = true;
        }
        this.items.value = shoppingCartItems;
        this.save();
        return Promise.resolve();
    }

    unselectAll() {
        let shoppingCartItems = this.items.value;
        shoppingCartItems.forEach(o => o.Selected = false);
        this.items.value = shoppingCartItems;
        this.save();
        return Promise.resolve();
    }

    removeAll() {
        this.items.value = [];
        this.save();
        return Promise.resolve();
    }

    get productsCount() {
        let count = 0;
        this.items.value.forEach(o => count = count + o.Count);
        return count;
    }

    get selectedCount() {
        let count = 0;
        this.items.value.filter(o => o.Selected).forEach(o => count = count + o.Count);
        return count;
    }

    private guid() {
        function s4() {
            return Math.floor((1 + Math.random()) * 0x10000)
                .toString(16)
                .substring(1);
        }
        return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
            s4() + '-' + s4() + s4() + s4();
    }
}




let shoppingCart = new ShoppingCart();
export default shoppingCart;