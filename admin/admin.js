// ==========================================
// PC-ZONE - ADMIN DASHBOARD V2
// ==========================================

// ==========================================
// SUPABASE CONFIG
// ==========================================

const SUPABASE_URL =
  "https://ufasbgipvfweqanczvdb.supabase.co";

const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVmYXNiZ2lwdmZ3ZXFhbmN6dmRiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYyNzg1MzYsImV4cCI6MjEwMTg1NDUzNn0.IsDj4gOjRRoO2KGJD8-JQTS19_OvYrVJcsubsVaW8WY";

// Make sure Supabase library exists
if (!window.supabase) {
  alert("Supabase library was not loaded.");
  throw new Error("Supabase library missing.");
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
const productList = document.getElementById("productList");

let editingProductId = null;


// ==========================================
// CHECK ADMIN
// ==========================================

async function checkAdmin() {
  try {
    const {
      data: { user },
      error: userError
    } = await supabaseClient.auth.getUser();

    if (userError || !user) {
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

  } catch (error) {
    console.error("Admin check failed:", error);
    return false;
  }
}


// ==========================================
// LOGIN
// ==========================================

if (loginForm) {

  loginForm.addEventListener("submit", async (e) => {

    e.preventDefault();

    const email =
      document.getElementById("email")?.value.trim();

    const password =
      document.getElementById("password")?.value;

    if (!email || !password) {
      alert("Please enter email and password.");
      return;
    }

    try {

      const { data, error } =
        await supabaseClient.auth.signInWithPassword({
          email: email,
          password: password
        });

      if (error) {

        console.error("Login error:", error);

        alert(
          "Login failed: " +
          error.message
        );

        return;
      }

      if (!data.user) {
        alert("Login failed.");
        return;
      }

      // Check if user is admin
      const isAdmin = await checkAdmin();

      if (!isAdmin) {

        await supabaseClient.auth.signOut();

        alert(
          "Access denied.\nYou are not an admin."
        );

        return;
      }

      // Login successful
      window.location.href = "admin.html";

    } catch (error) {

      console.error(error);

      alert(
        "Login error:\n" +
        error.message
      );
    }

  });

}


// ==========================================
// LOGOUT
// ==========================================

if (logoutBtn) {

  logoutBtn.addEventListener(
    "click",
    async () => {

      await supabaseClient.auth.signOut();

      window.location.href =
        "login.html";

    }
  );

}


// ==========================================
// PROTECT ADMIN PAGE
// ==========================================

async function protectAdminPage() {

  const page =
    window.location.pathname;

  if (
    page.includes("admin.html") ||
    page.includes("dashboard.html")
  ) {

    const isAdmin =
      await checkAdmin();

    if (!isAdmin) {

      window.location.href =
        "login.html";

      return false;
    }
  }

  return true;
}


// ==========================================
// UPLOAD MULTIPLE IMAGES
// ==========================================

async function uploadImages(
  files,
  productId
) {

  const imageUrls = [];

  if (!files || files.length === 0) {
    return imageUrls;
  }

  for (const file of files) {

    // Only images
    if (!file.type.startsWith("image/")) {
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


    // Upload to Storage
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
        "Image upload error:",
        uploadError
      );

      continue;
    }


    // Get public URL
    const {
      data: publicData
    } =
      supabaseClient.storage
        .from("product-images")
        .getPublicUrl(fileName);


    const imageUrl =
      publicData.publicUrl;


    imageUrls.push(imageUrl);


    // Save image URL in product_images
    const {
      error: dbError
    } =
      await supabaseClient
        .from("product_images")
        .insert({
          product_id: productId,
          image_url: imageUrl
        });


    if (dbError) {

      console.error(
        "Image database error:",
        dbError
      );

    }

  }

  return imageUrls;
}


// ==========================================
// ADD / EDIT PRODUCT
// ==========================================

if (productForm) {

  productForm.addEventListener(
    "submit",
    async (e) => {

      e.preventDefault();


      // Check admin
      const isAdmin =
        await checkAdmin();

      if (!isAdmin) {

        alert(
          "You are not authorized."
        );

        return;
      }


      // Get values
      const name =
        document
          .getElementById("name")
          ?.value
          .trim();

      const category =
        document
          .getElementById("category")
          ?.value;

      const price =
        document
          .getElementById("price")
          ?.value;

      const description =
        document
          .getElementById("description")
          ?.value
          .trim() || "";

      const screen =
        document
          .getElementById("screen")
          ?.value
          .trim() || "";


      const featured =
        document
          .getElementById("featured")
          ?.checked || false;

      const offer =
        document
          .getElementById("offer")
          ?.checked || false;

      const visible =
        document
          .getElementById("visible")
          ?.checked ?? true;


      const imageInput =
        document.getElementById(
          "productImages"
        );


      // Validate
      if (
        !name ||
        !category ||
        !price
      ) {

        alert(
          "Please complete the required fields."
        );

        return;
      }


      // ======================================
      // EDIT PRODUCT
      // ======================================

      if (editingProductId) {

        const {
          error
        } =
          await supabaseClient
            .from("products")
            .update({

              name: name,

              category: category,

              price: Number(price),

              description:
                description,

              screen: screen,

              featured:
                featured,

              offer:
                offer,

              visible:
                visible

            })
            .eq(
              "id",
              editingProductId
            );


        if (error) {

          console.error(error);

          alert(
            "Product could not be updated:\n" +
            error.message
          );

          return;
        }


        // Upload new images if selected
        if (
          imageInput &&
          imageInput.files.length > 0
        ) {

          await uploadImages(
            imageInput.files,
            editingProductId
          );

        }


        alert(
          "