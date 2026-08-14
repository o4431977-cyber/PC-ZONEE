
          // ==========================================
// PC-ZONE - ADMIN.JS
// Supabase Admin Dashboard
// ==========================================

const SUPABASE_URL = "https://ufasbgipvfweqanczvdb.supabase.co";

const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVmYXNib2dpcHZmd2VxYW5jelZkYiIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNzg2Mjc4NTM2LCJleHAiOjIxMDE4NTQ1MzZ9.IsDj4gOjRRoO2KGJD8-JQTS19_OvYrVJcsubsVaW8WY";


// ==========================================
// SUPABASE CLIENT
// ==========================================

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
// CHECK CURRENT USER
// ==========================================

async function getCurrentUser() {

  const {
    data: { user },
    error
  } = await supabaseClient.auth.getUser();

  if (error) {

    console.error("Get user error:", error);

    return {
      user: null,
      error: error
    };
  }

  return {
    user: user,
    error: null
  };
}


// ==========================================
// CHECK ADMIN
// ==========================================

async function checkAdmin() {

  const {
    user,
    error: userError
  } = await getCurrentUser();


  // Auth error
  if (userError) {

    alert(
      "حدث خطأ في تسجيل الدخول:\n\n" +
      userError.message
    );

    return false;
  }


  // No user
  if (!user) {

    alert(
      "لا يوجد مستخدم مسجل الدخول."
    );

    return false;
  }


  // Show current user in console
  console.log(
    "CURRENT USER EMAIL:",
    user.email
  );

  console.log(
    "CURRENT USER UID:",
    user.id
  );


  // Check admins table
  const {
    data,
    error
  } = await supabaseClient
    .from("admins")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();


  // Database error
  if (error) {

    console.error(
      "ADMIN QUERY ERROR:",
      error
    );

    alert(
      "تم تسجيل الدخول بنجاح، لكن حصل خطأ أثناء فحص صلاحية Admin.\n\n" +
      error.message +
      "\n\nUID الحالي:\n" +
      user.id
    );

    return false;
  }


  // User isn't admin
  if (!data) {

    alert(
      "الحساب دخل بنجاح، لكن الحساب ده مش موجود كـ Admin.\n\n" +
      "الإيميل:\n" +
      user.email +
      "\n\n" +
      "UID الحالي:\n" +
      user.id
    );

    return false;
  }


  // Admin confirmed
  console.log(
    "ADMIN VERIFIED:",
    user.id
  );

  return true;
}


// ==========================================
// LOGIN
// ==========================================

if (loginForm) {

  loginForm.addEventListener(
    "submit",
    async (e) => {

      e.preventDefault();


      const email =
        document
          .getElementById("email")
          ?.value
          .trim();

      const password =
        document
          .getElementById("password")
          ?.value;


      if (!email || !password) {

        alert(
          "من فضلك اكتب الإيميل والباسورد."
        );

        return;
      }


      // Disable button while logging in
      const loginButton =
        loginForm.querySelector(
          'button[type="submit"]'
        );

      if (loginButton) {

        loginButton.disabled = true;

        loginButton.textContent =
          "Logging in...";
      }


      console.log(
        "Trying login:",
        email
      );


      // ======================================
      // SUPABASE LOGIN
      // ======================================

      const {
        data,
        error
      } =
        await supabaseClient.auth.signInWithPassword({

          email: email,

          password: password

        });


      // Login error
      if (error) {

        console.error(
          "LOGIN ERROR:",
          error
        );

        alert(
          "Login failed:\n\n" +
          error.message
        );


        if (loginButton) {

          loginButton.disabled = false;

          loginButton.textContent =
            "Login • دخول";
        }

        return;
      }


      // Login successful
      console.log(
        "LOGIN SUCCESS"
      );

      console