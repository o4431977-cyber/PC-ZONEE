
/* =========================================
   PC-ZONE ADMIN DASHBOARD
   Products + Multiple Images
========================================= */

const SUPABASE_URL =
    "https://ufasbgipvfweqanczvdb.supabase.co";

const SUPABASE_KEY =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVmYXNiZ2lwdmZ3ZXFhbmN6dmRiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYyNzg1MzYsImV4cCI6MjEwMTg1NDUzNn0.IsDj4gOjRRoO2KGJD8-JQTS19_OvYrVJcsubsVaW8WY";

const supabaseClient =
    window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_KEY
    );


/* =========================================
   ELEMENTS
========================================= */

const loginPage =
    document.getElementById("loginPage");

const dashboard =
    document.getElementById("dashboard");

const loginForm =
    document.getElementById("loginForm");

const loginError =
    document.getElementById("loginError");

const productForm =
    document.getElementById("productForm");

const productImages =
    document.getElementById("productImages");

const imagePreview =
    document.getElementById("imagePreview");

const productsList =
    document.getElementById("productsList");


/* =========================================
   LOGIN / ADMIN CHECK
========================================= */

async function checkAdmin() {

    const {
        data: { user }
    } = await supabaseClient.auth.getUser();

    if (!user) {
        showLogin();
        return;
    }

    const { data, error } =
        await supabaseClient
            .from("admins")
            .select("user_id")
            .eq("user_id", user.id)
            .maybeSingle();

    if (error || !data) {

        await supabaseClient.auth.signOut();

        showLogin();

        if (loginError) {
            loginError.textContent =
                "Access denied • ليس لديك صلاحية Admin";
        }

        return;
    }

    showDashboard();
}


/* =========================================
   LOGIN
========================================= */

if (loginForm) {

    loginForm.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();

            if (loginError) {
                loginError.textContent = "";
            }

            const email =
                document
                    .getElementById("email")
                    .value
                    .trim();

            const password =
                document
                    .getElementById("password")
                    .value;

            const { error } =
                await supabaseClient.auth
                    .signInWithPassword({
                        email,
                        password
                    });

            if (error) {

                if (loginError) {
                    loginError.textContent =
                        error.message;
                }

                return;
            }

            await checkAdmin();
        }
    );
}


/* =========================================
   SHOW / HIDE
========================================= */

function showLogin() {

    if (loginPage) {
        loginPage.style.display = "flex";
    }

    if (dashboard) {
        dashboard.style.display = "none";
    }
}


function showDashboard() {

    if (loginPage) {
        loginPage.style.display = "none";
    }

    if (dashboard) {
        dashboard.style.display = "flex";
    }

    loadProducts();
}


/* =========================================
   IMAGE PREVIEW
========================================= */

if (productImages) {

    productImages.addEventListener(
        "change",
        function () {

            if (!imagePreview) return;

            imagePreview.innerHTML = "";

            const files =
                Array.from(this.files);

            files.forEach(file => {

                if (
                    !file.type.startsWith(
                        "image/"
                    )
                ) {
                    return;
                }

                const reader =
                    new FileReader();

                reader.onload =
                    function (event) {

                        const div =
                            document.createElement(
                                "div"
                            );

                        div.className =
                            "preview-item";

                        div.innerHTML = `
                            <img
                                src="${event.target.result}"
                                alt="Product image"
                            >
                        `;

                        imagePreview.appendChild(
                            div
                        );
                    };

                reader.readAsDataURL(file);
            });
        }
    );
}


/* =========================================
   UPLOAD IMAGES TO SUPABASE STORAGE
========================================= */

async function uploadImages(
    files,
    productId
) {

    const imageUrls = [];

    for (const file of files) {

        const extension =
            file.name
                .split(".")
                .pop()
                .toLowerCase();

        const fileName =
            `${crypto.randomUUID()}.${extension}`;

        const filePath =
            `${productId}/${fileName}`;


        console.log(
            "Uploading:",
            filePath
        );


        const {
            error: uploadError
        } =
            await supabaseClient
                .storage
                .from("product-images")
                .upload(
                    filePath,
                    file,
                    {
                        cacheControl: "3600",
                        upsert: false,
                        contentType:
                            file.type
                    }
                );


        if (uploadError) {

            console.error(
                "UPLOAD ERROR:",
                uploadError
            );

            throw new Error(
                "Image upload failed: " +
                uploadError.message
            );
        }


        const {
            data
        } =
            supabaseClient
                .storage
                .from("product-images")
                .getPublicUrl(
                    filePath
                );


        if (!data ||
            !data.publicUrl) {

            throw new Error(
                "Could not create image URL"
            );
        }


        imageUrls.push(
            data.publicUrl
        );
    }


    return imageUrls;
}


/* =========================================
   ADD / EDIT PRODUCT
========================================= */

if (productForm) {

    productForm.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();


            const message =
                document.getElementById(
                    "formMessage"
                );


            if (message) {
                message.textContent =
                    "Saving product...";
            }


            try {

                const existingId =
                    document.getElementById(
                        "productId"
                    ).value;


                /* -----------------------------
                   PRODUCT DATA
                ----------------------------- */

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


                /* -----------------------------
                   SELECTED IMAGES
                ----------------------------- */

                const files =
                    productImages
                        ? Array.from(
                            productImages.files
                        )
                        : [];


                /* =================================
                   EDIT EXISTING PRODUCT
                ================================= */

                if (existingId) {

                    let images = [];


                    const {
                        data: oldProduct,
                        error: oldError
                    } =
                        await supabaseClient
                            .from("products")
                            .select("images")
                            .eq(
                                "id",
                                existingId
                            )
                            .single();


                    if (oldError) {
                        throw oldError;
                    }


                    if (
                        Array.isArray(
                            oldProduct.images
                        )
                    ) {

                        images =
                            oldProduct.images;
                    }


                    /* Upload new images */

                    if (files.length > 0) {

                        if (message) {
                            message.textContent =
                                "Uploading images...";
                        }


                        const newImages =
                            await uploadImages(
                                files,
                                existingId
                            );


                        images = [
                            ...images,
                            ...newImages
                        ];
                    }


                    product.images =
                        images;


                    const {
                        error: updateError
                    } =
                        await supabaseClient
                            .from("products")
                            .update(product)
                            .eq(
                                "id",
                                existingId
                            );


                    if (updateError) {
                        throw updateError;
                    }


                    if (message) {
                        message.textContent =
                            "Product updated successfully!";
                    }
                }


                /* =================================
                   NEW PRODUCT
                ================================= */

                else {

                    /*
                       Generate ID ourselves so we can
                       upload images into the product
                       folder immediately.
                    */

                    const productId =
                        crypto.randomUUID();


                    product.id =
                        productId;


                    product.images = [];


                    /* First save product */

                    const {
                        error: insertError
                    } =
                        await supabaseClient
                            .from("products")
                            .insert(product);


                    if (insertError) {
                        throw insertError;
                    }


                    /* Upload images */

                    if (files.length > 0) {

                        if (message) {
                            message.textContent =
                                "Uploading images...";
                        }


                        try {

                            const imageUrls =
                                await uploadImages(
                                    files,
                                    productId
                                );


                            /* Save image URLs */

                            const {
                                error:
                                    imageUpdateError
                            } =
                                await supabaseClient
                                    .from("products")
                                    .update({
                                        images:
                                            imageUrls
                                    })
                                    .eq(
                                        "id",
                                        productId
                                    );


                            if (
                                imageUpdateError
                            ) {
                                throw imageUpdateError;
                            }

                        }

                        catch (imageError) {

                            /*
                               Product was created but
                               image upload failed.
                            */

                            console.error(
                                imageError
                            );

                            throw new Error(
                                "Product saved, but image upload failed: " +
                                imageError.message
                            );
                        }
                    }


                    if (message) {
                        message.textContent =
                            "Product saved successfully!";
                    }
                }


                /* =================================
                   RESET FORM
                ================================= */

                productForm.reset();


                document.getElementById(
                    "productId"
                ).value = "";


                if (imagePreview) {
                    imagePreview.innerHTML = "";
                }


                const formTitle =
                    document.getElementById(
                        "formTitle"
                    );

                if (formTitle) {
                    formTitle.textContent =
                        "Add Product";
                }


                await loadProducts();

            }

            catch (error) {

                console.error(
                    "PRODUCT ERROR:",
                    error
                );


                if (message) {

                    message.textContent =
                        "Error: " +
                        error.message;

                    message.style.color =
                        "#ff6262";
                }
            }
        }
    );
}


/* =========================================
   LOAD PRODUCTS
========================================= */

async function loadProducts() {

    if (!productsList) return;


    productsList.innerHTML =
        "<p>Loading products...</p>";


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

        console.error(error);

        productsList.innerHTML =
            `<p>Error: ${escapeHTML(
                error.message
            )}</p>`;

        return;
    }


    updateStats(data);


    if (!data.length) {

        productsList.innerHTML =
            "<p>No products yet.</p>";

        return;
    }


    productsList.innerHTML =
        data.map(product => {

            const firstImage =
                Array.isArray(
                    product.images
                ) &&
                product.images.length
                    ? product.images[0]
                    : "";


            return `

                <div class="product-row">

                    ${
                        firstImage
                        ? `
                            <img
                                src="${escapeHTML(
                                    firstImage
                                )}"
                                class="product-thumb"
                                alt=""
                            >
                        `
                        : ""
                    }

                    <div class="product-info">

                        <h3>
                            ${escapeHTML(
                                product.name
                            )}
                        </h3>

                        <p>
                            ${escapeHTML(
                                product.category
                            )}
                            •
                            ${Number(
                                product.price
                            ).toLocaleString()}
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
            `;

        }).join("");
}


/* =========================================
   STATS
========================================= */

function updateStats(products) {

    const totalProducts =
        document.getElementById(
            "totalProducts"
        );

    const totalOffers =
        document.getElementById(
            "totalOffers"
        );

    const totalFeatured =
        document.getElementById(
            "totalFeatured"
        );


    if (totalProducts) {
        totalProducts.textContent =
            products.length;
    }


    if (totalOffers) {

        totalOffers.textContent =
            products.filter(
                product =>
                    product.offer === true
            ).length;
    }


    if (totalFeatured) {

        totalFeatured.textContent =
            products.filter(
                product =>
                    product.featured === true
            ).length;
    }
}


/* =========================================
   EDIT PRODUCT
========================================= */

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

        alert(
            "Error loading product: " +
            error.message
        );

        return;
    }


    document.getElementById(
        "productId"
    ).value = data.id;


    document.getElementById(
        "productName"
    ).value =
        data.name || "";


    document.getElementById(
        "productCategory"
    ).value =
        data.category || "";


    document.getElementById(
        "productPrice"
    ).value =
        data.price || "";


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
        !!data.featured;


    document.getElementById(
        "productOffer"
    ).checked =
        !!data.offer;


    document.getElementById(
        "productActive"
    ).checked =
        !!data.active;


    if (imagePreview) {

        imagePreview.innerHTML = "";

        if (
            Array.isArray(data.images)
        ) {

            data.images.forEach(url => {

                const div =
                    document.createElement(
                        "div"
                    );

                div.className =
                    "preview-item";

                div.innerHTML = `
                    <img
                        src="${escapeHTML(url)}"
                        alt=""
                    >
                `;

                imagePreview.appendChild(
                    div
                );
            });
        }
    }


    const formTitle =
        document.getElementById(
            "formTitle"
        );

    if (formTitle) {
        formTitle.textContent =
            "Edit Product";
    }


    showSection("add");
}


/* =========================================
   DELETE PRODUCT
========================================= */

async function deleteProduct(id) {

    const confirmed =
        confirm(
            "Delete this product?\nهل تريد حذف المنتج؟"
        );


    if (!confirmed) return;


    const {
        data: product,
        error: getError
    } =
        await supabaseClient
            .from("products")
            .select("images")
            .eq("id", id)
            .single();


    if (getError) {

        alert(
            "Error: " +
            getError.message
        );

        return;
    }


    /* Delete product images */

    if (
        Array.isArray(product.images) &&
        product.images.length > 0
    ) {

        const paths =
            product.images
                .map(url => {

                    const marker =
                        "/product-images/";

                    const index =
                        url.indexOf(
                            marker
                        );

                    if (index === -1) {
                        return null;
                    }

                    return url.substring(
                        index +
                        marker.length
                    );
                })
                .filter(Boolean);


        if (paths.length) {

            await supabaseClient
                .storage
                .from("product-images")
                .remove(paths);
        }
    }


    /* Delete product */

    const {
        error
    } =
        await supabaseClient
            .from("products")
            .delete()
            .eq("id", id);


    if (error) {

        alert(
            "Delete failed: " +
            error.message
        );

        return;
    }


    await loadProducts();
}


/* =========================================
   ADD PRODUCT
========================================= */

function openAddProduct() {

    if (productForm) {
        productForm.reset();
    }


    document.getElementById(
        "productId"
    ).value = "";


    if (imagePreview) {
        imagePreview.innerHTML = "";
    }


    const formTitle =
        document.getElementById(
            "formTitle"
        );

    if (formTitle) {
        formTitle.textContent =
            "Add Product";
    }


    showSection("add");
}


/* =========================================
   SECTION NAVIGATION
========================================= */

function showSection(sectionId) {

    document
        .querySelectorAll(".section")
        .forEach(section => {

            section.classList.remove(
                "active"
            );
        });


    const target =
        document.getElementById(
            sectionId
        );


    if (target) {
        target.classList.add("active");
    }
}


document
    .querySelectorAll(".nav-btn")
    .forEach(button => {

        button.addEventListener(
            "click",
            function () {

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


                showSection(section);


                if (
                    section ===
                    "products"
                ) {
                    loadProducts();
                }
            }
        );
    });


/* =========================================
   ADD PRODUCT BUTTON
========================================= */

const addProductBtn =
    document.getElementById(
        "addProductBtn"
    );


if (addProductBtn) {

    addProductBtn.addEventListener(
        "click",
        openAddProduct
    );
}


/* =========================================
   CANCEL
========================================= */

const cancelEdit =
    document.getElementById(
        "cancelEdit"
    );


if (cancelEdit) {

    cancelEdit.addEventListener(
        "click",
        openAddProduct
    );
}


/* =========================================
   LOGOUT
========================================= */

const logoutBtn =
    document.getElementById(
        "logoutBtn"
    );


if (logoutBtn) {

    logoutBtn.addEventListener(
        "click",
        async function () {

            await supabaseClient
                .auth
                .signOut();

            showLogin();
        }
    );
}


/* =========================================
   SECURITY
========================================= */

function escapeHTML(value) {

    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll(
            "'",
            "&#039;"
        );
}


/* =========================================
   START
========================================= */

checkAdmin();
