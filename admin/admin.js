// ==========================================
// PC-ZONE - ADMIN.JS V3
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
const productList = document.getElementById("productList");

let editingProductId = null;


// ==========================================
// GET USER
// ==========================================

async function getUser() {

  const {
    data,
    error
  } = await supabaseClient.auth.getUser();

  if (error) {
    console.error("GET USER ERROR:", error);
    return null;
  }

  return data.user;
}


// ==========================================
// CHECK ADMIN
// ==========================================

async function checkAdmin() {

  const user = await getUser();

  if (!user) {
    return false;
  }

  console.log("CURRENT USER:");
  console.log("Email:", user.email);
  console.log("UID:", user.id);

  const {
    data,
    error
  } = await supabaseClient
    .from("admins")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {

    console.error(
      "ADMIN TABLE ERROR:",
      error
    );

    alert(
      "Admin check error:\n\n" +
      error.message +
      "\n\nUID:\n" +
      user.id
    );

    return false;
  }

  if (!data) {

    alert(
      "تم تسجيل الدخول بنجاح، لكن الحساب غير موجود في admins.\n\n" +
      "UID الحالي:\n" +
      user.id
    );

    return false;
  }

  return true;
}


// ==========================================
// LOGIN
// ==========================================

if (loginForm) {

  loginForm.addEventListener(
    "submit",
    async function (e) {

      e.preventDefault();

      const emailInput =
        document.getElementById("email");

      const passwordInput =
        document.getElementById("password");

      if (!emailInput || !passwordInput) {

        alert(
          "لم يتم العثور على email أو password في الصفحة."
        );

        return;
      }

      const email =
        emailInput.value.trim();

      const password =
        passwordInput.value;

      if (!email || !password) {

        alert(
          "اكتب الإيميل والباسورد."
        );

        return;
      }


      console.log(
        "START LOGIN:",
        email
      );


      const button =
        loginForm.querySelector(
          'button[type="submit"]'
        );

      if (button) {

        button.disabled = true;

        button.textContent =
          "Logging in...";

      }


      // ======================================
      // SUPABASE AUTH
      // ======================================

      const {
        data,
        error
      } =
        await supabaseClient.auth.signInWithPassword({

          email: email,

          password: password

        });


      // Login failed
      if (error) {

        console.error(
          "LOGIN ERROR:",
          error
        );

        alert(
          "LOGIN ERROR:\n\n" +
          error.message
        );

        if (button) {

          button.disabled = false;

          button.textContent =
            "Login • دخول";

        }

        return;
      }


      // ======================================
      // LOGIN SUCCESS
      // ======================================

      console.log(
        "LOGIN SUCCESS"
      );

      console.log(
        "EMAIL:",
        data.user.email
      );

      console.log(
        "UID:",
        data.user.id
      );


      // ======================================
      // CHECK ADMIN
      // ======================================

      const isAdmin =
        await checkAdmin();


      if (!isAdmin) {

        if (button) {

          button.disabled = false;

          button.textContent =
            "Login • دخول";

        }

        return;
      }


      // ======================================
      // SUCCESS
      // ======================================

      alert(
        "✅ Login successful!\n\n" +
        "Admin verified."
      );


      window.location.href =
        "admin.html";

    }
  );

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
          "Logout error:\n\n" +
          error.message
        );

        return;
      }

      window.location.href =
        "login.html";

    }
  );

}


// ==========================================
// PROTECT ADMIN PAGE
// ==========================================

async function protectAdminPage() {

  const currentPage =
    window.location.pathname;


  const isAdminPage =
    currentPage.includes(
      "admin.html"
    ) ||
    currentPage.includes(
      "dashboard.html"
    );


  if (!isAdminPage) {
    return true;
  }


  const user =
    await getUser();


  if (!user) {

    window.location.href =
      "login.html";

    return false;
  }


  const isAdmin =
    await checkAdmin();


  if (!isAdmin) {

    await supabaseClient.auth.signOut();

    window.location.href =
      "login.html";

    return false;
  }


  return true;
}


// ==========================================
// UPLOAD IMAGES
// ==========================================

async function uploadImages(
  files,
  productId
) {

  const uploadedImages = [];


  if (!files || files.length === 0) {

    return uploadedImages;
  }


  for (const file of files) {

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


    console.log(
      "Uploading image:",
      fileName
    );


    // Upload to bucket
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
        "STORAGE ERROR:",
        uploadError
      );

      alert(
        "Image upload failed:\n\n" +
        uploadError.message
      );

      continue;
    }


    // Public URL
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


    // Save URL in table
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
        "PRODUCT IMAGES TABLE ERROR:",
        databaseError
      );

      continue;
    }


    uploadedImages.push(
      imageUrl
    );

 