const SUPABASE_URL = "https://awazhdqlkjscfrhsoghe.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
  "sb_publishable_87J_ACo3RI__1dzCFH1I8A_vml3ngIh";

const db = supabase.createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY
);


// -----------------------------
// GLOBAL DATA
// -----------------------------

let school = null;
let grades = [];
let learningAreas = [];
let learners = [];


// -----------------------------
// HELPERS
// -----------------------------

function $(id) {
  return document.getElementById(id);
}

function showMessage(element, message, success = false) {
  element.textContent = message;
  element.style.color = success ? "#067647" : "#b42318";
}


// -----------------------------
// LOGIN
// -----------------------------

// -----------------------------
// LOGIN
// -----------------------------

$("loginForm").addEventListener("submit", async function (event) {

  event.preventDefault();

  const email = $("email").value.trim();
  const password = $("password").value;

  showMessage($("loginMessage"), "Signing in...");

  try {

    const { data, error } =
      await db.auth.signInWithPassword({
        email: email,
        password: password
      });

    if (error) {

      console.error("Login error:", error);

      showMessage(
        $("loginMessage"),
        "Login error: " + error.message
      );

      return;
    }

    if (!data || !data.user) {

      showMessage(
        $("loginMessage"),
        "Login failed: no user was returned."
      );

      return;
    }

    showMessage(
      $("loginMessage"),
      "Login successful.",
      true
    );

    await showApplication();

  } catch (error) {

    console.error("Unexpected login error:", error);

    showMessage(
      $("loginMessage"),
      "System error: " + error.message
    );

  }

});

    await showApplication();

  } catch (error) {

    console.error("Unexpected login error:", error);

    showMessage(
      $("loginMessage"),
      "System error: " + error.message
    );

  }

});


// -----------------------------
// SHOW APPLICATION
// -----------------------------

async function showApplication() {

  $("loginView").classList.add("hidden");
  $("appView").classList.remove("hidden");

  await loadProfile();
  await loadSchool();
  await loadGrades();
  await loadLearningAreas();
  await loadLearners();

  updateDashboard();
  renderLearners();
  renderLearningAreas();

}


// -----------------------------
// LOAD PROFILE
// -----------------------------

async function loadProfile() {

  const {
    data: { user }
  } = await db.auth.getUser();

  if (!user) return;

  const { data, error } =
    await db
      .from("profiles")
      .select("full_name, role")
      .eq("id", user.id)
      .maybeSingle();

  if (!error && data) {

    $("userName").textContent =
      `${data.full_name} • ${data.role}`;

  }

}


// -----------------------------
// LOAD SCHOOL
// -----------------------------

async function loadSchool() {

  const { data, error } =
    await db
      .from("schools")
      .select("id, name, curriculum")
      .eq(
        "name",
        "Ngessumin Comprehensive School"
      )
      .maybeSingle();

  if (error) {

    console.error(error);

    $("statusMessage").textContent =
      "Unable to load school information.";

    return;
  }

  school = data;

}


// -----------------------------
// LOAD GRADES
// -----------------------------

async function loadGrades() {

  if (!school) return;

  const { data, error } =
    await db
      .from("grades")
      .select("id, grade_number")
      .eq("school_id", school.id)
      .order("grade_number");

  if (error) {

    console.error(error);

    return;
  }

  grades = data || [];

  const gradeSelect = $("gradeId");
  const gradeFilter = $("gradeFilter");

  gradeSelect.innerHTML =
    `<option value="">Select grade</option>`;

  gradeFilter.innerHTML =
    `<option value="">All grades</option>`;

  grades.forEach(grade => {

    const option1 =
      document.createElement("option");

    option1.value = grade.id;

    option1.textContent =
      `Grade ${grade.grade_number}`;

    gradeSelect.appendChild(option1);


    const option2 =
      document.createElement("option");

    option2.value = grade.id;

    option2.textContent =
      `Grade ${grade.grade_number}`;

    gradeFilter.appendChild(option2);

  });

}


// -----------------------------
// LOAD LEARNING AREAS
// -----------------------------

async function loadLearningAreas() {

  if (!school) return;

  const { data, error } =
    await db
      .from("learning_areas")
      .select("id, name, code")
      .eq("school_id", school.id)
      .eq("active", true)
      .order("name");

  if (error) {

    console.error(error);

    return;
  }

  learningAreas = data || [];

}


// -----------------------------
// LOAD LEARNERS
// -----------------------------

async function loadLearners() {

  if (!school) return;

  const { data, error } =
    await db
      .from("learners")
      .select(`
        id,
        admission_number,
        full_name,
        gender,
        guardian_name,
        guardian_phone,
        admission_date,
        status,
        grade_id,
        grades (
          grade_number
        )
      `)
      .eq("school_id", school.id)
      .order("full_name");

  if (error) {

    console.error(error);

    $("statusMessage").textContent =
      "Unable to load learners.";

    return;
  }

  learners = data || [];

}


// -----------------------------
// DASHBOARD
// -----------------------------

function updateDashboard() {

  $("learnerCount").textContent =
    learners.length;

  $("gradeCount").textContent =
    grades.length;

  $("areaCount").textContent =
    learningAreas.length;

  $("yearValue").textContent =
    "2026";

  $("statusMessage").textContent =
    "Connected to Ngessumin Comprehensive School database.";

}


// -----------------------------
// REGISTER LEARNER
// -----------------------------

$("learnerForm").addEventListener(
  "submit",
  async function (event) {

    event.preventDefault();

    if (!school) {

      showMessage(
        $("learnerMessage"),
        "School information is not available."
      );

      return;
    }

    const learner = {

      school_id: school.id,

      admission_number:
        $("admissionNumber").value.trim(),

      
