

 // ==========================================
// PC-ZONE - ADMIN.JS FINAL
// ==========================================

const SUPABASE_URL =
  "https://ufasbgipvfweqanczvdb.supabase.co";

const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzIiwicmVmIjoidWZhc2JnaXB2ZndlcWFxbmN6dmRiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYyNzg1MzYsImV4cCI6MjEwMTg1NDUzNiwic3ViIjoiIn0.IsDj4gOjRRoO2KGJD8-JQTS19_OvYrVJcsubsVaW8WY";

// ==========================================
// SUPABASE
// ==========================================

if (!window.supabase) {
  alert("Supabase library is missing.");
  throw new Error("Supabase library is missing.");
}

const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);

// ==========================================
// ELEMENTS
// ==========================================

const loginForm = document.getElementById("loginForm");
const logoutBtn = document.getElementById("logoutBtn");

const productForm = document.getElementById("productForm");
const productsList = document.getElementById("productsList");

const loginPage = document.getElementById("loginPage");
const dashboard = document.getElementById("dashboard");

const formMessage = document.getElementById("formMessage");

let editingProductId = null;

// ==========================================
// HELPERS
// ==========================================

function showMessage(message, success = false) {
  if (!formMessage) return;

  formMessage.textContent = message;
  formMessage.style.color = success ? "#22c55e" : "#ef4444";
}

function escapeHTML(value) {
  if (value === null || value === undefined) return "";

  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

// ==========================================
// GET CURRENT USER
// ==========================================

async function getUser() {
  try {
    const {
      data,
      error
    } = await supabaseClient.auth.getUser();

    if (error) {
      console.error("GET USER ERROR:", error);
      return null;
    }

    return data?.user || null;

  } catch (error) {
    console.error("GET USER EXCEPTION:", error);
    return null;
  }
}

// ==========================================
// CHECK ADMIN
// ==========================================

async function checkAdmin(showAlert = true) {

  const user = await getUser();

  if (!user) {
    if (showAlert) {
      alert("No logged-in user.");
    }

    return false;
  }

  console.log("CURRENT USER UID:", user.id);

  const {
    data,
    error
  } = await supabaseClient
    .from("admins")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {

    console.error("ADMIN CHECK ERROR:", error);

    if (showAlert) {
      alert(
        "Admin check error:\n\n" +
        error.message +
        "\n\nUID:\n" +
        user.id
      );
    }

    return false;
  }

  if (!data) {

    if (showAlert) {
      alert(
        "الحساب دخل بنجاح، لكن UID غير موجود في admins.\n\n" +
        "UID الحالي:\n" +
        user.id
      );
    }

    return false;
  }

  return true;
}

// ==========================================
// SHOW DASHBOARD
// ==========================================

function showDashboard() {

  if (loginPage) {
    loginPage.style.display = "none";
  }

  if (dashboard) {
    dashboard.style.display = "flex";
  }
}

// ==========================================
// SHOW LOGIN
// ==========================================

function showLogin() {

  if (loginPage) {
    loginPage.style.display = "flex";
  }

  if (dashboard) {
    dashboard.style.display = "none";
  }
}

// ==========================================
// LOGIN
// ==========================================

if (loginForm) {

  loginForm.addEventListener("submit", async function (e) {

    e.preventDefault();

    const emailElement =
      document.getElementById("email");

    const passwordElement =
      document.getElementById("password");

    const button =
      loginForm.querySelector(
        'button[type="submit"]'
      );

    const loginError =
      document.getElementById("loginError");

    const email =
      emailElement?.value.trim();

    const password =
      passwordElement?.value;

    if (!email || !password) {

      alert("اكتب الإيميل والباسورد.");

      return;
    }

    if (button) {
      button.disabled = true;
      button.textContent = "Logging in...";
    }

    if (loginError) {
      loginError.textContent = "";
    }

    try {

      console.log("START LOGIN:", email);

      const {
        data,
        error
      } =
        await supabaseClient.auth.signInWithPassword({
          email: email,
          password: password
        });

      // ======================================
      // AUTH ERROR
      // ======================================

      if (error) {

        console.error(
          "SUPABASE LOGIN ERROR:",
          error
        );

        alert(
          "Login failed:\n\n" +
          error.message
        );

        if (button) {
          button.disabled = false;
          button.textContent = "Login • دخول";
        }

        return;
      }

      // ======================================
      // AUTH SUCCESS
      // ======================================

      console.log(
        "LOGIN SUCCESS:",
        data.user
      );

      console.log(
        "USER UID:",
        data.user.id
      );

      // ======================================
      // ADMIN CHECK
      // ======================================

      const isAdmin =
        await checkAdmin(true);

      if (!isAdmin) {

        await supabaseClient.auth.signOut();

        if (button) {
          button.disabled = false;
          button.textContent = "Login • دخول";
        }

        return;
      }

      // ======================================
      // SUCCESS
      // ======================================

      showDashboard();

      await loadProducts();
      await loadStats();

      alert("✅ Login successful!");

    } catch (error) {

      console.error(
        "LOGIN EXCEPTION:",
        error
      );

      alert(
        "Unexpected login error:\n\n" +
        error.message
      );

      if (button) {
        button.disabled = false;
        button.textContent = "Login • دخول";
      }
    }

  });

}

// ==========================================
// LOGOUT
// ==========================================

if (logoutBtn) {

  logoutBtn.addEventListener(
    "click",
    async function () {

      const {
        error
      } =
        await supabaseClient.auth.signOut();

      if (error) {

        alert(
          "Logout failed:\n\n" +
          error.message
        );

        return;
      }

      showLogin();

    }
  );
}

// ==========================================
// NAVIGATION
// ==========================================

const navButtons =
  document.querySelectorAll(".nav-btn");

const sections =
  document.querySelectorAll(".section");

navButtons.forEach(button => {

  button.addEventListener("click", function () {

    const sectionId =
      this.dataset.section;

    navButtons.forEach(btn =>
      btn.classList.remove("active")
    );

    this.classList.add("active");

    sections.forEach(section =>
      section.classList.remove("active")
    );

    const section =
      document.getElementById(sectionId);

    if (section) {
      section.classList.add("active");
    }

    if (sectionId === "products") {
      loadProducts();
    }

    if (sectionId === "overview") {
      loadStats();
    }

  });

});

// ==========================================
// ADD PRODUCT BUTTON
// ==========================================

const addProductBtn =
  document.getElementById("addProductBtn");

if (addProductBtn) {

  addProductBtn.addEventListener(
    "click",
    function () {

      editingProductId = null;

      resetProductForm();

      showSection("add");

    }
  );
}

// ==========================================
// SHOW SECTION
// ==========================================

function showSection(sectionId) {

  navButtons.forEach(btn => {

    btn.classList.toggle(
      "active",
      btn.dataset.section === sectionId
    );

  });

  sections.forEach(section => {

    section.classList.toggle(
      "active",
      section.id === sectionId
    );

  });
}

// ==========================================
// LOAD STATS
// ==========================================

async function loadStats() {

  const {
    data,
    error
  } =
    await supabaseClient
      .from("products")
      .select(
        "id, offer, featured"
      );

  if (error) {

    console.error(
      "STATS ERROR:",
      error
    );

    return;
  }

  const total =
    data?.length || 0;

  const offers =
    data?.filter(
      product => product.offer === true
    ).length || 0;

  const featured =
    data?.filter(
      product => product.featured === true
    ).length || 0;

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
    totalProducts.textContent = total;
  }

  if (totalOffers) {
    totalOffers.textContent = offers;
  }

  if (totalFeatured) {
    totalFeatured.textContent =
      featured;
  }
}

// ==========================================
// GET PRODUCT FORM DATA
// ==========================================

function getProductFormData() {

  return {

    name:
      document.getElementById(
        "productName"
      )?.value.trim() || "",

    category:
      document.getElementById(
        "productCategory"
      )?.value || "",

    price:
      Number(
        document.getElementById(
          "productPrice"
        )?.value || 0
      ),

    old_price:
      Number(
        document.getElementById(
          "productOldPrice"
        )?.value || 0
      ) || null,

    description:
      document.getElementById(
        "productDescription"
      )?.value.trim() || "",

    processor:
      document.getElementById(
        "specProcessor"
      )?.value.trim() || "",

    ram:
      document.getElementById(
        "specRam"
      )?.value.trim() || "",

    storage:
      document.getElementById(
        "specStorage"
      )?.value.trim() || "",

    gpu:
      document.getElementById(
        "specGpu"
      )?.value.trim() || "",

    screen:
      document.getElementById(
        "specScreen"
      )?.value.trim() || "",

    featured:
      document.getElementById(
        "productFeatured"
      )?.checked || false,

    offer:
      document.getElementById(
        "productOffer"
      )?.checked || false,

    visible:
      document.getElementById(
        "productActive"
      )?.checked !== false

  };

}

// ==========================================
// ADD / UPDATE PRODUCT
// ==========================================

if (productForm) {

  productForm.addEventListener(
    "submit",
    async function (e) {

      e.preventDefault();

      showMessage("");

      // ====================================
      // ADMIN CHECK
      // ====================================

      const isAdmin =
        await checkAdmin(true);

      if (!isAdmin) {
        return;
      }

      const product =
        getProductFormData();

      // ====================================
      // VALIDATION
      // ====================================

      if (
        !product.name ||
        !product.category ||
        !product.price
      ) {

        showMessage(
          "Please complete Product Name, Category and Price."
        );

        alert(
          "Please complete the required fields."
        );

        return;
      }

      const imageInput =
        document.getElementById(
          "productImages"
        );

      const files =
        imageInput?.files || [];

      try {

        let productData;

        // ==================================
        // UPDATE
        // ==================================

        if (editingProductId) {

          const {
            data,
            error
          } =
            await supabaseClient
              .from("products")
              .update(product)
              .eq(
                "id",
                editingProductId
              )
              .select()
              .single();

          if (error) {

            console.error(
              "UPDATE PRODUCT ERROR:",
              error
            );

            alert(
              "Update failed:\n\n" +
              error.message
            );

            return;
          }

          productData = data;

        }

        // ==================================
        // INSERT
        // ==================================

        else {

          const {
            data,
            error
          } =
            await supabaseClient
              .from("products")
              .insert(product)
              .select()
              .single();

          if (error) {

            console.error(
              "INSERT PRODUCT ERROR:",
              error
            );

            alert(
              "Product could not be added:\n\n" +
              error.message
            );

            return;
          }

          productData = data;
        }

        // ==================================
        // UPLOAD IMAGES
        // ==================================

        if (
          files &&
          files.length > 0
        ) {

          const result =
            await uploadImages(
              files,
              productData.id
            );

          console.log(
            "UPLOADED IMAGES:",
            result
          );
        }

        // ==================================
        // SUCCESS
        // ==================================

        alert(
          editingProductId
            ? "✅ Product updated successfully!"
            : "✅ Product added successfully!"
        );

        resetProductForm();

        editingProductId = null;

        await loadProducts();
        await loadStats();

        showSection("products");

      } catch (error) {

        console.error(
          "PRODUCT ERROR:",
          error
        );

        alert(
          "Unexpected error:\n\n" +
          error.message
        );
      }

    }
  );
}

// ==========================================
// UPLOAD IMAGES
// ==========================================

async function uploadImages(
  files,
  productId
) {

  const uploadedImages = [];

  if (
    !files ||
    files.length === 0
  ) {

    return uploadedImages;
  }

  for (
    const file of files
  ) {

    if (
      !file.type.startsWith(
        "image/"
      )
    ) {

      continue;
    }

    const extension =
      file.name
        .split(".")
        .pop()
        .toLowerCase();

    const fileName =
      productId +
      "/" +
      Date.now() +
      "-" +
      Math.random()
        .toString(36)
        .substring(2) +
      "." +
      extension;

    console.log(
      "UPLOADING:",
      fileName
    );

    // ====================================
    // STORAGE
    // ====================================

    const {
      error: uploadError
    } =
      await supabaseClient.storage
        .from("product-images")
        .upload(
          fileName,
          file,
          {
            cacheControl: "3600",
            upsert: false
          }
        );

    if (uploadError) {

      console.error(
        "STORAGE UPLOAD ERROR:",
        uploadError
      );

      alert(
        "Image upload failed:\n\n" +
        uploadError.message
      );

      continue;
    }

    // ====================================
    // PUBLIC URL
    // ====================================

    const {
      data: publicData
    } =
      supabaseClient.storage
        .from("product-images")
        .getPublicUrl(
          fileName
        );

    const imageUrl =
      publicData.publicUrl;

    // ====================================
    // SAVE URL
    // ====================================

    const {
      error: databaseError
    } =
      await supabaseClient
        .from("product_images")
        .insert({
          product_id:
            productId,

          image_url:
            imageUrl
        });

    if (databaseError) {

      console.error(
        "PRODUCT IMAGE DB ERROR:",
        databaseError
      );

      alert(
        "Image uploaded but URL could not be saved:\n\n" +
        databaseError.message
      );

      continue;
    }

    uploadedImages.push(
      imageUrl
    );
  }

  return uploadedImages;
}

// ==========================================
// LOAD PRODUCTS
// ==========================================

async function loadProducts() {

  if (!productsList) {
    return;
  }

  productsList.innerHTML =
    "<p>Loading products...</p>";

  const {
    data,
    error
  } =
    await supabaseClient
      .from("products")
      .select(`
        *,
        product_images (
          id,
          image_url
        )
      `)
      .order(
        "created_at",
        {
          ascending: false
        }
      );

  if (error) {

    console.error(
      "LOAD PRODUCTS ERROR:",
      error
    );

    productsList.innerHTML =
      `<p>Failed to load products: ${escapeHTML(
        error.message
      )}</p>`;

    return;
  }

  productsList.innerHTML = "";

  if (
    !data ||
    data.length === 0
  ) {

    productsList.innerHTML =
      "<p>No products yet.</p>";

    return;
  }

  data.forEach(product => {

    const images =
      product.product_images || [];

    const firstImage =
      images.length
        ? images[0].image_url
        : "";

    const card =
      document.createElement("div");

    card.className =
      "admin-product-card";

    card.innerHTML = `

      ${
        firstImage
          ? `
            <img
              src="${escapeHTML(firstImage)}"
              alt="${escapeHTML(product.name)}"
            >
          `
          : `
            <div class="no-image">
              No Image
            </div>
          `
      }

      <h3>
        ${escapeHTML(product.name)}
      </h3>

      <p>
        ${escapeHTML(product.category)}
      </p>

      <strong>
        ${escapeHTML(product.price)} EGP
      </strong>

      <div class="product-actions">

        <button
          type="button"
          onclick="editProduct('${product.id}')"
        >
          ✏️ Edit
        </button>

        <button
          type="button"
          onclick="deleteProduct('${product.id}')"
        >
          🗑️ Delete
        </button>

      </div>
    `;

    productsList.appendChild(card);

  });
}

// ==========================================
// EDIT PRODUCT
// ==========================================

async function editProduct(id) {

  const isAdmin =
    await checkAdmin(true);

  if (!isAdmin) {
    return;
  }

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
      "Could not load product:\n\n" +
      error.message
    );

    return;
  }

  editingProductId = id;

  const setValue =
    (elementId, value) => {

      const element =
        document.getElementById(
          elementId
        );

      if (element) {
        element.value =
          value ?? "";
      }
    };

  setValue(
    "productId",
    data.id
  );

  setValue(
    "productName",
    data.name
  );

  setValue(
    "productCategory",
    data.category
  );

  setValue(
    "productPrice",
    data.price
  );

  setValue(
    "productOldPrice",
    data.old_price
  );

  setValue(
    "productDescription",
    data.description
  );

  setValue(
    "specProcessor",
    data.processor
  );

  setValue(
    "specRam",
    data.ram
  );

  setValue(
    "specStorage",
    data.storage
  );

  setValue(
    "specGpu",
    data.gpu
  );

  setValue(
    "specScreen",
    data.screen
  );

  const featured =
    document.getElementById(
      "productFeatured"
    );

  const offer =
    document.getElementById(
      "productOffer"
    );

  const active =
    document.getElementById(
      "productActive"
    );

  if (featured) {
    featured.checked =
      data.featured === true;
  }

  if (offer) {
    offer.checked =
      data.offer === true;
  }

  if (active) {
    active.checked =
      data.visible !== false;
  }

  const title =
    document.getElementById(
      "formTitle"
    );

  if (title) {
    title.textContent =
      "Edit Product";
  }

  showSection("add");

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
}

// ==========================================
// DELETE PRODUCT
// ==========================================

async function deleteProduct(id) {

  const isAdmin =
    await checkAdmin(true);

  if (!isAdmin) {
    return;
  }

  const confirmed =
    confirm(
      "Are you sure you want to delete this product?"
    );

  if (!confirmed) {
    return;
  }

  try {

    // ======================================
    // GET IMAGE FILES
    // ======================================

    const {
      data: images
    } =
      await supabaseClient
        .from("product_images")
        .select(
          "id, image_url"
        )
        .eq(
          "product_id",
          id
        );

    // ======================================
    // DELETE IMAGE RECORDS
    // ======================================

    const {
      error: imageDbError
    } =
      await supabaseClient
        .from("product_images")
        .delete()
        .eq(
          "product_id",
          id
        );

    if (imageDbError) {

      alert(
        "Could not delete image records:\n\n" +
        imageDbError.message
      );

      return;
    }

    // ======================================
    // DELETE PRODUCT
    // ======================================

    const {
      error: productError
    } =
      await supabaseClient
        .from("products")
        .delete()
        .eq(
          "id",
          id
        );

    if (productError) {

      alert(
        "Product delete failed:\n\n" +
        productError.message
      );

      return;
    }

    // ======================================
    // DELETE STORAGE FILES
    // ======================================

    if (
      images &&
      images.length
    ) {

      const paths =
        images
          .map(image => {

            try {

              const url =
                new URL(
                  image.image_url
                );

              const marker =
                "/storage/v1/object/public/product-images/";

              const index =
                url.pathname.indexOf(
                  marker
                );

              if (index === -1) {
                return null;
              }

              return decodeURIComponent(
                url.pathname.substring(
                  index + marker.length
                )
              );

            } catch {
              return null;
            }

          })
          .filter(Boolean);

      if (paths.length) {

        const {
          error: storageError
        } =
          await supabaseClient.storage
            .from("product-images")
            .remove(paths);

        if (storageError) {

          console.error(
            "STORAGE DELETE ERROR:",
            storageError
          );

        }
      }
    }

    alert(
      "✅ Product deleted successfully."
    );

    await loadProducts();
    await loadStats();

  } catch (error) {

    console.error(
      "DELETE ERROR:",
      error
    );

    alert(
      "Unexpected delete error:\n\n" +
      error.message
    );
  }
}

// ==========================================
// RESET FORM
// ==========================================

function resetProductForm() {

  if (productForm) {
    productForm.reset();
  }

  editingProductId = null;

  const id =
    document.getElementById(
      "productId"
    );

  if (id) {
    id.value = "";
  }

  const active =
    document.getElementById(
      "productActive"
    );

  if (active) {
    active.checked = true;
  }

  const title =
    document.getElementById(
      "formTitle"
    );

  if (title) {
    title.textContent =
      "Add Product";
  }

  showMessage("");

  const preview =
    document.getElementById(
      "imagePreview"
    );

  if (preview) {
    preview.innerHTML = "";
  }
}

// ==========================================
// CANCEL EDIT
// ==========================================

const cancelEdit =
  document.getElementById(
    "cancelEdit"
  );

if (cancelEdit) {

  cancelEdit.addEventListener(
    "click",
    function () {

      resetProductForm();

      showSection("products");

      loadProducts();

    }
  );
}

// ==========================================
// IMAGE PREVIEW
// ==========================================

const productImages =
  document.getElementById(
    "productImages"
  );

if (productImages) {

  productImages.addEventListener(
    "change",
    function () {

      const preview =
        document.getElementById(
          "imagePreview"
        );

      if (!preview) {
        return;
      }

      preview.innerHTML = "";

      Array.from(
        this.files || []
      ).forEach(file => {

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
          function (e) {

            const img =
              document.createElement(
                "img"
              );

            img.src =
              e.target.result;

            preview.appendChild(
              img
            );
          };

        reader.readAsDataURL(
          file
        );

      });

    }
  );
}

// ==========================================
// INITIALIZE
// ==========================================

(async function init() {

  console.log(
    "PC-ZONE ADMIN INITIALIZING..."
  );

  try {

    const user =
      await getUser();

    if (!user) {

      console.log(
        "No active session."
      );

      showLogin();

      return;
    }

    console.log(
      "Existing session:",
      user.id
    );

    const isAdmin =
      await checkAdmin(false);

    if (!isAdmin) {

      await supabaseClient.auth.signOut();

      showLogin();

      return;
    }

    showDashboard();

    await loadStats();
    await loadProducts();

  } catch (error) {

    console.error(
      "INITIALIZATION ERROR:",
      error
    );

    showLogin();

  }

})();