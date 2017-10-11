import { shoppingCart } from 'services';

interface Props extends React.Props<AddToShoppingCart> {
    className?: string;

    product: Product,

    /** 购物车图标，用于动画效果 */
    shoppingCartIcon: () => HTMLElement,

    // shoppingCartService: ShoppingCartService
}

interface State {
    count: number;
}

export class AddToShoppingCart extends React.Component<Props, State> {

    constructor(props) {
        super(props);
        this.state = { count: 0 };
    }

    setCount(items: ShoppingCartItem[]) {
        let shoppingCartItem = items.filter(o => o.ProductId == this.props.product.Id)[0];
        if (shoppingCartItem != null) {
            this.state.count = shoppingCartItem.Count;
            this.setState(this.state);
        }
    }

    private onAddButtonClick(e: HTMLElement) {
        if (!e) return;

        e.onclick = (event) => {
            this.state.count = this.state.count + 1;
            this.setState(this.state);

            this.setShoppingCartItemCount();

            let shoppingCartElement = this.props.shoppingCartIcon();
            console.assert(shoppingCartElement != null);
            playAnimation(shoppingCartElement, event.pageX, event.pageY);
        }
    }

    private onMinusButtonClick(e: HTMLElement) {
        if (!e) return;

        e.onclick = (event) => {
            this.state.count = this.state.count - 1;
            this.setState(this.state);

            this.setShoppingCartItemCount();
        }
    }

    private setShoppingCartItemCount() {

        // let shoppingCart = this.props.shoppingCartService;
        let product = this.props.product;
        let count = this.state.count;
        shoppingCart.setItemCount(product, count);
    }

    componentDidMount() {
        // let shoppingCart = this.props.shoppingCartService;
        shoppingCart.onChanged(this, (value) => this.setCount(value));
        this.setCount(shoppingCart.items.value);
    }

    render() {
        let count = this.state.count;
        return <div className={this.props.className} ref={this.props.ref as any} key={this.props.key} >
            <div style={{ display: count == 0 ? 'block' : 'none' }}>
                <button className="btn btn-primary"
                    ref={(e: HTMLButtonElement) => this.onAddButtonClick(e)} >加入购物车</button>
            </div>
            <div style={{ display: count > 0 ? 'block' : 'none', position: 'relative', top: 4 }}>
                <i className="icon-minus-sign text-primary" ref={(e: HTMLButtonElement) => this.onMinusButtonClick(e)} />
                <input type="number" value={count as any}
                    onChange={(e) => {
                        let value = Number.parseInt((e.target as HTMLInputElement).value);
                        if (!value) return;

                        this.state.count = value;
                        this.setState(this.state);
                    }} />
                <i className="icon-plus-sign text-primary" ref={(e: HTMLButtonElement) => this.onAddButtonClick(e)} />
            </div>
        </div>
    }

}

let pointer: HTMLElement;
function playAnimation(shoppingCartElement: HTMLElement, startX: number, startY: number) {
    requirejs(['parabola'], (funParabola) => {
        if (pointer == null) {
            pointer = document.createElement("div");
            pointer.style.position = 'absolute';
            pointer.style.width = '12px'
            pointer.style.height = '12px';
            pointer.style.borderRadius = '6px';
            pointer.style.backgroundColor = '#bf0705';
            pointer.style.zIndex = `1000`;
        }

        pointer.style.left = `${startX}px`;
        pointer.style.top = `${startY}px`;

        pointer.style.removeProperty('display');
        document.body.appendChild(pointer);
        var myParabola = funParabola(pointer, shoppingCartElement, {
            speed: 600,
            curvature: 0.005,
            complete: function () {
                pointer.style.display = 'none';
            }
        });

        myParabola.position().move();

    });
}
