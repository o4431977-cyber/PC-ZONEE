
// ==========================================
// PC-ZONE - ADMIN DASHBOARD V2
// ==========================================

const SUPABASE_URL = "https://ufasbgipvfweqanczvdb.supabase.co";

const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVmYXNib2dpcHZmd2VxYW5jelZkYiIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNzg2Mjc4NTM2LCJleHAiOjIxMDE4NTQ1MzZ9.IsDj4gOjRRoO2KGJD8-JQTS19_OvYrVJcsubsVaW8WY";

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
const productList = document.getElementById("productList");

let editingProductId = null;

// ==========================================
// CHECK ADMIN
// ==========================================

async function checkAdmin() {
  const {
    data: { user },
  } = await supabaseClient.auth.getUser();

  if (!user) {
    return false;
  }

  const { data, error } = await supabaseClient
    .from("admins")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    console.error("Admin check error:", error);
    return false;
  }

  return !!data;
}

// ==========================================
// LOGIN
// ==========================================

if (loginForm) {
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("email")?.value.trim();
    const password = document.getElementById("password")?.value;

    if (!email || !password) {
      alert("Please enter email and password");
      return;
    }

    const { data, error } = await supabaseClient.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      alert("Login failed: " + error.message);
      return;
    }

    const isAdmin = await checkAdmin();

    if (!isAdmin) {
      await supabaseClient.auth.signOut();
      alert("Access denied. You are not an admin.");
      return;
    }

    window.location.href = "admin.html";
  });
}

// ==========================================
// LOGOUT
// ==========================================

if (logoutBtn) {
  logoutBtn.addEventListener("click", async () => {
    await supabaseClient.auth.signOut();
    window.location.href = "login.html";
  });
}

// ==========================================
// PROTECT ADMIN PAGE
// ==========================================

async function protectAdminPage() {
  const page = window.location.pathname;

  if (
    page.includes("admin.html") ||
    page.includes("dashboard.html")
  ) {
    const isAdmin = await checkAdmin();

    if (!isAdmin) {
      window.location.href = "login.html";
      return false;
    }
  }

  return true;
}

// ==========================================
// UPLOAD MULTIPLE IMAGES
// ==========================================

async function uploadImages(files, productId) {
  const imageUrls = [];

  for (const file of files) {
    if (!file.type.startsWith("image/")) {
      continue;
    }

    const extension = file.name.split(".").pop();

    const fileName =
      `${productId}/` +
      `${Date.now()}-${Math.random().toString(36).substring(2)}.${extension}`;

    const { error: uploadError } = await supabaseClient.storage
      .from("product-images")
      .upload(fileName, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) {
      console.error("Image upload error:", uploadError);
      continue;
    }

    const { data } = supabaseClient.storage
      .from("product-images")
      .getPublicUrl(fileName);

    imageUrls.push(data.publicUrl);

    // Save image URL in database
    const { error: dbError } = await supabaseClient
      .from("product_images")
      .insert({
        product_id: productId,
        image_url: data.publicUrl,
      });

    if (dbError) {
      console.error("Image database error:", dbError);
    }
  }

  return imageUrls;
}

// ==========================================
// ADD PRODUCT
// ==========================================

if (productForm) {
  productForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const isAdmin = await checkAdmin();

    if (!isAdmin) {
      alert("You are not authorized.");
      return;
    }

    const name = document.getElementById("name")?.value.trim();
    const category = document.getElementById("category")?.value;
    const price = document.getElementById("price")?.value;
    const description =
      document.getElementById("description")?.value.trim() || "";

    const screen =
      document.getElementById("screen")?.value.trim() || "";

    const featured =
      document.getElementById("featured")?.checked || false;

    const offer =
      document.getElementById("offer")?.checked || false;

    const visible =
      document.getElementById("visible")?.checked ?? true;

    const imageInput = document.getElementById("productImages");

    if (!name || !category || !price) {
      alert("Please complete the required fields.");
      return;
    }

    // ======================================
    // CREATE PRODUCT
    // ======================================

    const { data: product, error } = await supabaseClient
      .from("products")
      .insert({
        name: name,
        category: category,
        price: Number(price),
        description: description,
        screen: screen,
        featured: featured,
        offer: offer,
        visible: visible,
      })
      .select()
      .single();

    if (error) {
      console.error(error);
      alert("Product could not be added:\n" + error.message);
      return;
    }

    // ======================================
    // UPLOAD IMAGES
    // ======================================

    if (imageInput && imageInput.files.length > 0) {
      await uploadImages(imageInput.files, product.id);
    }

    alert("✅ Product added successfully!");

    productForm.reset();

    if (document.getElementById("visible")) {
      document.getElementById("visible").checked = true;
    }

    loadProducts();
  });
}

// ==========================================
// LOAD PRODUCTS
// ==========================================

async function loadProducts() {
  if (!productList) return;

  const { data, error } = await supabaseClient
    .from("products")
    .select(`
      *,
      product_images (
        id,
        image_url
      )
    `)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Load products error:", error);
    productList.innerHTML = "<p>Failed to load products.</p>";
    return;
  }

  productList.innerHTML = "";

  if (!data || data.length === 0) {
    productList.innerHTML = "<p>No products yet.</p>";
    return;
  }

  data.forEach((product) => {
    const images = product.product_images || [];

    const firstImage =
      images.length > 0 ? images[0].image_url : "";

    const card = document.createElement("div");

    card.className = "admin-product-card";

    card.innerHTML = `
      ${
        firstImage
          ? `<img src="${firstImage}" alt="${product.name}">`
          : `<div class="no-image">No Image</div>`
      }

      <h3>${product.name}</h3>

      <p>${product.category}</p>

      <strong>${product.price} EGP</strong>

      <div class="product-actions">
        <button onclick="editProduct('${product.id}')">
          ✏️ Edit
        </button>

        <button onclick="deleteProduct('${product.id}')">
          🗑️ Delete
        </button>
      </div>
    `;

    productList.appendChild(card);
  });
}

// ==========================================
// DELETE PRODUCT
// ==========================================

async function deleteProduct(id) {
  const isAdmin = await checkAdmin();

  if (!isAdmin) {
    alert("You are not authorized.");
    return;
  }

  const confirmDelete = confirm(
    "Are you sure you want to delete this product?"
  );

  if (!confirmDelete) return;

  // Delete product images records
  const { error: imageError } = await supabaseClient
    .from("product_images")
    .delete()
    .eq("product_id", id);

  if (imageError) {
    console.error(imageError);
  }

  // Delete product
  const { error } = await supabaseClient
    .from("products")
    .delete()
    .eq("id", id);

  if (error) {
    alert("Delete failed:\n" + error.message);
    return;
  }

  alert("✅ Product deleted.");

  loadProducts();
}

// ==========================================
// EDIT PRODUCT
// ==========================================

async function editProduct(id) {
  const isAdmin = await checkAdmin();

  if (!isAdmin) {
    alert("You are not authorized.");
    return;
  }

  const { data, error } = await supabaseClient
    .from("products")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    alert("Could not load product.");
    return;
  }

  editingProductId = id;

  document.getElementById("name").value = data.name || "";
  document.getElementById("category").value = data.category || "";
  document.getElementById("price").value = data.price || "";
  document.getElementById("description").value =
    data.description || "";

  if (document.getElementById("screen")) {
    document.getElementById("screen").value =
      data.screen || "";
  }

  if (document.getElementById("featured")) {
    document.getElementById("featured").checked =
      !!data.featured;
  }

  if (document.getElementById("offer")) {
    document.getElementById("offer").checked =
      !!data.offer;
  }

  if (document.getElementById("visible")) {
    document.getElementById("visible").checked =
      data.visible !== false;
  }

  window.scrollTo({
    top: 0,
    behavior: "smooth",
  });
}

// ==========================================
// INITIALIZE
// ==========================================

(async () => {
  await protectAdminPage();

  if (productList) {
    loadProducts();
  }
})();