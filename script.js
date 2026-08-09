
const products = [
    {
        name: "HP EliteBook 640 G8",
        cat: "Laptops",
        price: 18500,
        icon: "💻",
        spec: "Core i5 • 16GB RAM • 256GB SSD"
    },
    {
        name: "Dell Precision 5560",
        cat: "Laptops",
        price: 28500,
        icon: "💻",
        spec: "Core i7 • 32GB RAM • 1TB SSD"
    },
    {
        name: "PC-ZONE Gaming Build",
        cat: "PCs",
        price: 32500,
        icon: "🖥️",
        spec: "Core i5 • RTX Graphics • 16GB RAM"
    },
    {
        name: "Gaming Keyboard",
        cat: "Accessories",
        price: 1250,
        icon: "⌨️",
        spec: "RGB • Mechanical • USB"
    },
    {
        name: "Wireless Gaming Mouse",
        cat: "Gaming",
        price: 850,
        icon: "🖱️",
        spec: "High precision • RGB"
    },
    {
        name: "Gaming Headset",
        cat: "Gaming",
        price: 1650,
        icon: "🎧",
        spec: "Surround sound • Mic"
    },
    {
        name: "Security Camera",
        cat: "Cameras",
        price: 2200,
        icon: "📷",
        spec: "Full HD • Night Vision"
    },
    {
        name: "Wi-Fi Router",
        cat: "Networking",
        price: 1400,
        icon: "📡",
        spec: "Dual Band • High Speed"
    }
];


// ===============================
// CART
// ===============================

let cart = [];

const grid = document.getElementById("productGrid");
const filter = document.getElementById("filter");


// ===============================
// PRICE FORMAT
// ===============================

function money(number) {

    return number.toLocaleString("en-EG") + " EGP";

}


// ===============================
// DISPLAY PRODUCTS
// ===============================

function renderProducts(list = products) {

    if (!grid) return;

    if (list.length === 0) {

        grid.innerHTML = `
            <div class="empty">
                No products found • مفيش منتجات مطابقة
            </div>
        `;

        return;
    }


    grid.innerHTML = list.map(product => {

        const index = products.indexOf(product);

        return `

        <article class="product">

            <div class="product-img">

                <div>
                    ${product.icon}
                </div>

            </div>


            <div class="product-body">

                <span class="tag">
                    ${product.cat.toUpperCase()}
                </span>


                <h3>
                    ${product.name}
                </h3>


                <p class="spec">
                    ${product.spec}
                </p>


                <div class="price">

                    <strong>
                        ${money(product.price)}
                    </strong>


                    <button
                        class="add"
                        onclick="addToCart(${index})"
                    >
                        + Cart • أضف
                    </button>

                </div>

            </div>

        </article>

        `;

    }).join("");

}


// ===============================
// ADD PRODUCT TO CART
// ===============================

function addToCart(index) {

    if (!products[index]) return;

    cart.push(products[index]);

    updateCart();

    showToast();

}


// ===============================
// UPDATE CART
// ===============================

function updateCart() {

    const cartCount =
        document.getElementById("cartCount");

    const cartItems =
        document.getElementById("cartItems");

    const cartTotal =
        document.getElementById("cartTotal");


    if (cartCount) {

        cartCount.textContent = cart.length;

    }


    if (cartItems) {

        if (cart.length === 0) {

            cartItems.innerHTML = `
                <p class="empty">
                    Your cart is empty • السلة فارغة
                </p>
            `;

        } else {

            cartItems.innerHTML = cart.map(
                (product, index) => {

                    return `

                    <div class="cart-item">

                        <div>

                            <b>
                                ${product.name}
                            </b>

                            <br>

                            <small>
                                ${money(product.price)}
                            </small>

                        </div>


                        <button
                            onclick="removeFromCart(${index})"
                        >
                            ✕
                        </button>

                    </div>

                    `;

                }
            ).join("");

        }

    }


    const total = cart.reduce(
        (sum, product) =>
            sum + product.price,
        0
    );


    if (cartTotal) {

        cartTotal.textContent =
            money(total);

    }

}


// ===============================
// REMOVE FROM CART
// ===============================

function removeFromCart(index) {

    cart.splice(index, 1);

    updateCart();

}


// ===============================
// TOAST
// ===============================

function showToast() {

    const toast =
        document.getElementById("toast");


    if (!toast) return;


    toast.classList.add("show");
