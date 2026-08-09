const SUPABASE_URL =
    "https://ufasbgipvfweqanczvdb.supabase.co";

const SUPABASE_KEY =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVmYXNiZ2lwdmZ3ZXFhbmN6dmRiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYyNzg1MzYsImV4cCI6MjEwMTg1NDUzNn0.IsDj4gOjRRoO2KGJD8-JQTS19_OvYrVJcsubsVaW8WY";


const supabaseClient =
    window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_KEY
    );


const loginPage =
    document.getElementById("loginPage");

const dashboard =
    document.getElementById("dashboard");

const loginForm =
    document.getElementById("loginForm");

const loginError =
    document.getElementById("loginError");


// ========================================
// AUTH CHECK
// ========================================

async function checkAdmin() {

    const {
        data: {
            user
        }
    } =
        await supabaseClient.auth.getUser();


    if (!user) {

        showLogin();

        return false;

    }


    const {
        data,
        error
    } =
        await supabaseClient
            .from("admins")
            .select("user_id")
            .eq("user_id", user.id)
            .maybeSingle();


    if (error || !data) {

        await supabaseClient.auth.signOut();

        showLogin();

        loginError.textContent =
            "Access denied • ليس لديك صلاحية Admin";

        return false;

    }


    showDashboard();

    return true;

}


// ========================================
// LOGIN
// ========================================

loginForm.addEventListener(
    "submit",
    async function(event) {

        event.preventDefault();


        loginError.textContent = "";


        const email =
            document.getElementById(
                "email"
            ).value.trim();


        const password =
            document.getElementById(
                "password"
            ).value;


        const {
            error
        } =
            await supabaseClient.auth.signInWithPassword({
                email,
                password
            });


        if (error) {

            loginError.textContent =
                "Invalid email or password • البيانات غير صحيحة";

            return;

        }


        await checkAdmin();

    }
);


// ========================================
// SHOW LOGIN
// ========================================

function showLogin() {

    loginPage.style.display =
        "flex";

    dashboard.style.display =
        "none";

}


// ========================================
// SHOW DASHBOARD
// ========================================

function showDashboard() {

    loginPage.style.display =
        "none";

    dashboard.style.display =
        "flex";


    loadProducts();

}


// ========================================
// NAVIGATION
// ========================================

document
    .querySelectorAll(".nav-btn")
    .forEach(button => {

        button.addEventListener(
            "click",
            function() {

                const section =
                    this.dataset.section;


                document
                    .querySelectorAll(
                        ".nav-btn"
                    )
                    .forEach(btn =>
                        btn.classList.remove(
                            "active"
                        )
                    );


                this.classList.add(
                    "active"
                );


                document
                    .querySelectorAll(
                        ".section"
                    )
                    .forEach(sec =>
                        sec.classList.remove(
                            "active"
                        )
                    );


                document
                    .getElementById(section)
                    .classList.add(
                        "active"
                    );


                if (
                    section === "products"
                ) {

                    loadProducts();

                }

            }
        );

    });


// ========================================
// ADD PRODUCT BUTTON
// ========================================

document
    .getElementById("addProductBtn")
    .addEventListener(
        "click",
        () => {

            openAddProduct();

        }
    );


// ========================================
// IMAGE PREVIEW
// ========================================

document
    .getElementById("productImages")
    .addEventListener(
        "change",
        function() {

            const preview =
                document.getElementById(
                    "imagePreview"
                );


            preview.innerHTML = "";


            Array
                .from(this.files)
                .forEach(file => {

                    const reader =
                        new FileReader();


                    reader.onload =
                        function(event) {

                            const div =
                                document.createElement(
                                    "div"
                                );


                            div.className =
                                "preview-item";


                            div.innerHTML = `
                                <img
                                    src="${event.target.result}"
                                >
                            `;


                            preview.appendChild(
                                div
                            );

                        };


                    reader.readAsDataURL(file);

                });

        }
    );


// ========================================
// LOAD PRODUCTS
// ========================================

async function loadProducts() {

    const list =
        document.getElementById(
            "productsList"
        );


    list.innerHTML =
        "<p>Loading...</p>";


    const {
        data,
        error
    } =
        await supabaseClient
            .from("products")
            .select("*")
            .order(
                "created_at",
                {
                    ascending: false
                }
            );


    if (error) {

        list.innerHTML =
            "<p>Could not load products.</p>";

        console.error(error);

        return;

    }


    updateStats(data);


    if (!data.length) {

        list.innerHTML =
            "<p>No products yet.</p>";

        return;

    }


    list.innerHTML =
        data.map(product => `

            <div class="product-row">

                <div class="product-info">

                    <h3>
                        ${escapeHTML(product.name)}
                    </h3>

                    <p>
                        ${escapeHTML(product.category)}
                        •
                        ${Number(product.price).toLocaleString()}
                        EGP
                    </p>

                </div>


                <div class="product-actions">

                    <button
                        class="edit"
                        onclick="editProduct('${product.id}')"
                    >
                        Edit
                    </button>


                    <button
                        class="delete"
                        onclick="deleteProduct('${product.id}')"
                    >
                        Delete
                    </button>

                </div>

            </div>

        `).join("");

}


// ========================================
// STATS
// ========================================

function updateStats(products) {

    document.getElementById(
        "totalProducts"
    ).textContent =
        products.length;


    document.getElementById(
        "totalOffers"
    ).textContent =
        products.filter(
            product => product.offer
        ).length;


    document.getElementById(
        "totalFeatured"
    ).textContent =
        products.filter(
            product => product.featured
        ).length;

}


// ========================================
// ADD PRODUCT
// ========================================

const productForm =
    document.getElementById(
        "productForm"
    );


productForm.addEventListener(
    "submit",
    async function(event) {

        event.preventDefault();


        const message =
            document.getElementById(
                "formMessage"
            );


        message.textContent =
            "Saving product...";


        const productId =
            document.getElementById(
                "productId"
            ).value;


        const product = {

            name:
                document.getElementById(
                    "productName"
                ).value.trim(),

            category:
                document.getElementById(
                    "productCategory"
                ).value,

            price:
                Number(
                    document.getElementById(
                        "productPrice"
                    ).value
                ),

            old_price:
                Number(
                    document.getElementById(
                        "productOldPrice"
                    ).value
                ) || null,

            description:
                document.getElementById(
                    "productDescription"
                ).value.trim(),

            specifications: {

                processor:
                    document.getElementById(
                        "specProcessor"
                    ).value.trim(),

                ram:
                    document.getElementById(
                        "specRam"
                    ).value.trim(),

                storage:
                    document.getElementById(
                        "specStorage"
                    ).value.trim(),

                gpu:
                    document.getElementById(
                        "specGpu"
                    ).value.trim(),

                screen:
                    document.getElementById(
                        "specScreen"
                    ).value.trim()

            },

            featured:
                document.getElementById(
                    "productFeatured"
                ).checked,

            offer:
                document.getElementById(
                    "productOffer"
                ).checked,

            active:
                document.getElementById(
                    "productActive"
                ).checked

        };


        let result;


        if (productId) {

            result =
                await supabaseClient
                    .from("products")
                    .update(product)
                    .eq("id", productId);

        } else {

            result =
                await supabaseClient
                    .from("products")
                    .insert(product);

        }


        if (result.error) {

            console.error(
                result.error
            );


            message.textContent =
                "Error saving product.";

            return;

        }


        message.style.color =
            "#55d88a";


        message.textContent =
            "Product saved successfully!";


        productForm.reset();

        document.getElementById(
            "productId"
        ).value = "";


        document.getElementById(
            "imagePreview"
        ).innerHTML = "";


        await loadProducts();

    }
);


// ========================================
// DELETE PRODUCT
// ========================================

async function deleteProduct(id) {

    const confirmDelete =
        confirm(
            "Delete this product?\nهل تريد حذف المنتج؟"
        );


    if (!confirmDelete) return;


    const {
        error
    } =
        await supabaseClient
            .from("products")
            .delete()
            .eq("id", id);


    if (error) {

        alert(
            "Delete failed."
        );

        console.error(error);

        return;

    }


    loadProducts();

}


// ========================================
// EDIT PRODUCT
// ========================================

async function editProduct(id) {

    const {
        data,
        error
    } =
        await supabaseClient
            .from("products")
            .select("*")
            .eq("id", id)
            .single();


    if (error) {

        console.error(error);

        return;

    }


    document.getElementById(
        "productId"
    ).value = data.id;


    document.getElementById(
        "productName"
    ).value = data.name;


    document.getElementById(
        "productCategory"
    ).value = data.category;


    document.getElementById(
        "productPrice"
    ).value = data.price;


    document.getElementById(
        "productOldPrice"
    ).value =
        data.old_price || "";


    document.getElementById(
        "productDescription"
    ).value =
        data.description || "";


    const specs =
        data.specifications || {};


    document.getElementById(
        "specProcessor"
    ).value =
        specs.processor || "";


    document.getElementById(
        "specRam"
    ).value =
        specs.ram || "";


    document.getElementById(
        "specStorage"
    ).value =
        specs.storage || "";


    document.getElementById(
        "specGpu"
    ).value =
        specs.gpu || "";


    document.getElementById(
        "specScreen"
    ).value =
        specs.screen || "";


    document.getElementById(
        "productFeatured"
    ).checked =
        data.featured;


    document.getElementById(
        "productOffer"
    ).checked =
        data.offer;


    document.getElementById(
        "productActive"
    ).checked =
        data.active;


    document.getElementById(
        "formTitle"
    ).textContent =
        "Edit Product";


    document
        .querySelectorAll(".section")
        .forEach(sec =>
            sec.classList.remove(
                "active"
            )
        );


    document
        .getElementById("add")
        .classList.add("active");

}


// ========================================
// CANCEL EDIT
// ========================================

document
    .getElementById("cancelEdit")
    .addEventListener(
        "click",
        openAddProduct
    );


function openAddProduct() {

    productForm.reset();


    document.getElementById(
        "productId"
    ).value = "";


    document.getElementById(
        "imagePreview"
    ).innerHTML = "";


    document.getElementById(
        "formTitle"
    ).textContent =
        "Add Product";


    document
        .querySelectorAll(".section")
        .forEach(sec =>
            sec.classList.remove(
                "active"
            )
        );


    document
        .getElementById("add")
        .classList.add("active");

}


// ========================================
// LOGOUT
// ========================================

document
    .getElementById("logoutBtn")
    .addEventListener(
        "click",
        async () => {

            await supabaseClient.auth.signOut();

            showLogin();

        }
    );


// ========================================
// ESCAPE HTML
// ========================================

function escapeHTML(value) {

    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

}


// ========================================
// START
// ========================================

checkAdmin();
