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
        spec: "Full HD • Night vision"
    },
    {
        name: "Wi-Fi Router",
        cat: "Networking",
        price: 1400,
        icon: "📡",
        spec: "Dual Band • High Speed"
    }
];

let cart = [];


/* =========================
   PRODUCTS
========================= */

const grid = document.getElementById("productGrid");
const filter = document.getElementById("filter");


function money(number) {
    return number.toLocaleString("en-EG") + " EGP";
}


function renderProducts(list = products) {

    grid.innerHTML = "";

    list.forEach((product) => {

        const index = products.indexOf(product);

        grid.innerHTML += `
            <article class="product">

                <div class="product-img">
                    <div>${product.icon}</div>
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
                            + Cart
                        </button>

                    </div>

                </div>

            </article>
        `;
    });
}


/* =========================
   ADD TO CART
========================= */

function addToCart(index) {

    cart.push(products[index]);

    updateCart();

    showToast();
}


/* =========================
   UPDATE CART
========================= */

function updateCart() {

    const cartCount =
        document.getElementById("cartCount");

    const cartItems =
        document.getElementById("cartItems");

    const cartTotal =
        document.getElementById("cartTotal");


    cartCount.textContent = cart.length;


    if (cart.length === 0) {

        cartItems.innerHTML = `
            <p class="empty">
                Your cart is empty.
            </p>
        `;

    } else {

        cartItems.innerHTML = cart.map((product, index) => {

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

        }).join("");
    }


    const total = cart.reduce(
        (sum, product) => sum + product.price,
        0
    );

    cartTotal.textContent = money(total);
}


/* =========================
   REMOVE FROM CART
========================= */

function removeFromCart(index) {

    cart.splice(index, 1);

    updateCart();
}


/* =========================
   TOAST MESSAGE
========================= */

function showToast() {

    const toast =
        document.getElementById("toast");

    toast.classList.add("show");

    setTimeout(() => {

        toast.classList.remove("show");

    }, 1300);
}


/* =========================
   CATEGORY FILTER
========================= */

filter.addEventListener("change", function () {

    const selected = filter.value;


    if (selected === "All") {

        renderProducts(products);

    } else {

        const filtered =
            products.filter(
                product => product.cat === selected
            );

        renderProducts(filtered);
    }

});


/* =========================
   CATEGORY BUTTONS
========================= */

document
    .querySelectorAll(".category")
    .forEach(button => {

        button.addEventListener("click", () => {

            const category =
                button.dataset.cat;

            filter.value = category;


            const filtered =
                products.filter(
                    product => product.cat === category
                );

            renderProducts(filtered);


            document
                .getElementById("products")
                .scrollIntoView({
                    behavior: "smooth"
                });

        });

    });


/* =========================
   SEARCH BUTTON
========================= */

document
    .getElementById("searchBtn")
    .addEventListener("click", () => {

        document
            .getElementById("searchPanel")
            .classList.toggle("show");

    });


/* =========================
   SEARCH
========================= */

document
    .getElementById("searchInput")
    .addEventListener("input", function () {

        const search =
            this.value.toLowerCase().trim();


        const filtered =
            products.filter(product => {

                const text =
                    `${product.name}
                     ${product.cat}
                     ${product.spec}`
                    .toLowerCase();

                return text.includes(search);

            });


        renderProducts(filtered);

    });


/* =========================
   OPEN CART
========================= */

document
    .getElementById("cartBtn")
    .addEventListener("click", () => {

        document
            .getElementById("drawer")
            .classList.add("show");

    });


/* =========================
   CLOSE CART
========================= */

document
    .getElementById("closeCart")
    .addEventListener("click", () => {

        document
            .getElementById("drawer")
            .classList.remove("show");

    });


/* =========================
   CLOSE CART BY CLICKING OUTSIDE
========================= */

document
    .getElementById("drawer")
    .addEventListener("click", function (event) {

        if (event.target === this) {

            this.classList.remove("show");

        }

    });


/* =========================
   MOBILE MENU
========================= */

document
    .getElementById("menuBtn")
    .addEventListener("click", () => {

        const nav =
            document.querySelector("nav");


        if (nav.style.display === "flex") {

            nav.style.display = "none";

        } else {

            nav.style.display = "flex";

        }

    });


/* =========================
   CHECKOUT
========================= */

document
    .getElementById("checkout")
    .addEventListener("click", () => {

        alert(
            "Add your WhatsApp number in script.js to activate ordering."
        );

    });


/* =========================
   START WEBSITE
========================= */

renderProducts();

updateCart();
