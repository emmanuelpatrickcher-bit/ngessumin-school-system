const SUPABASE_URL = "https://awazhdqlkjscfrhsoghe.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
  "sb_publishable_87J_ACo3RI__1dzCFH1I8A_vml3ngIh";

const db = supabase.createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY
);


// =====================================================
// GLOBAL DATA
// =====================================================

let school = null;
let grades = [];
let learningAreas = [];
let learners = [];
let profile = null;


// =====================================================
// HELPER
// =====================================================

function $(id) {
  return document.getElementById(id);
}


function showMessage(element, message, success = false) {
  if (!element) return;

  element.textContent = message;
  element.style.color = success ? "#067647" : "#b42318";
}


// =====================================================
// LOGIN
// =====================================================

const loginForm = $("loginForm");

if (loginForm) {

  loginForm.addEventListener("submit", async function (event) {

    event.preventDefault();

    const email = $("email").value.trim();
    const password = $("password").value;

    if (!email || !password) {

      showMessage(
        $("loginMessage"),
        "Please enter your email and password."
      );

      return;
    }

    showMessage(
      $("loginMessage"),
      "Signing in..."
    );

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

}


// =====================================================
// SHOW APPLICATION
// =====================================================

async function showApplication() {

  if ($("loginView")) {
    $("loginView").classList.add("hidden");
  }

  if ($("appView")) {
    $("appView").classList.remove("hidden");
  }

  await loadProfile();
  await loadSchool();
  await loadGrades();
  await loadLearningAreas();
  await loadLearners();

  updateDashboard();
  renderLearners();
  renderLearningAreas();

}


// =====================================================
// LOAD PROFILE
// =====================================================

async function loadProfile() {

  try {

    const {
      data: { user },
      error: userError
    } = await db.auth.getUser();

    if (userError) {
      console.error("User error:", userError);
      return;
    }

    if (!user) {
      console.log("No authenticated user.");
      return;
    }

    const { data, error } = await db
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();

    if (error) {

      console.error("Profile error:", error);

      return;
    }

    profile = data;

    if ($("userName")) {
      $("userName").textContent =
        profile?.full_name || user.email;
    }

    if ($("userRole")) {
      $("userRole").textContent =
        profile?.role || "User";
    }

  } catch (error) {

    console.error("Unexpected profile error:", error);

  }

}


// =====================================================
// LOAD SCHOOL
// =====================================================

async function loadSchool() {

  try {

    const { data, error } = await db
      .from("schools")
      .select("*")
      .limit(1)
      .maybeSingle();

    if (error) {

      console.error("School error:", error);

      return;
    }

    school = data;

    if ($("schoolName")) {
      $("schoolName").textContent =
        school?.name || "Ngessumin Comprehensive School";
    }

  } catch (error) {

    console.error("Unexpected school error:", error);

  }

}


// =====================================================
// LOAD GRADES
// =====================================================

async function loadGrades() {

  try {

    const { data, error } = await db
      .from("grades")
      .select("*")
      .order("grade_number");

    if (error) {

      console.error("Grades error:", error);

      return;
    }

    grades = data || [];

    populateGradeSelectors();

  } catch (error) {

    console.error("Unexpected grades error:", error);

  }

}


// =====================================================
// POPULATE GRADE SELECTORS
// =====================================================

function populateGradeSelectors() {

  const selectors = [
    $("learnerGrade"),
    $("filterGrade")
  ];

  selectors.forEach(function (select) {

    if (!select) return;

    const currentValue = select.value;

    if (select.id === "filterGrade") {

      select.innerHTML =
        '<option value="">All Grades</option>';

    } else {

      select.innerHTML =
        '<option value="">Select Grade</option>';

    }

    grades.forEach(function (grade) {

      const option = document.createElement("option");

      option.value = grade.id;

      option.textContent =
        "Grade " + grade.grade_number;

      select.appendChild(option);

    });

    if (currentValue) {
      select.value = currentValue;
    }

  });

}


// =====================================================
// LOAD LEARNING AREAS
// =====================================================

async function loadLearningAreas() {

  try {

    const { data, error } = await db
      .from("learning_areas")
      .select("*")
      .eq("active", true)
      .order("name");

    if (error) {

      console.error("Learning areas error:", error);

      return;
    }

    learningAreas = data || [];

  } catch (error) {

    console.error(
      "Unexpected learning areas error:",
      error
    );

  }

}


// =====================================================
// LOAD LEARNERS
// =====================================================

async function loadLearners() {

  try {

    const { data, error } = await db
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
      .order("full_name");

    if (error) {

      console.error("Learners error:", error);

      return;
    }

    learners = data || [];

  } catch (error) {

    console.error(
      "Unexpected learners error:",
      error
    );

  }

}


// =====================================================
// DASHBOARD
// =====================================================

function updateDashboard() {

  const totalLearners = learners.length;

  const activeLearners =
    learners.filter(
      learner => learner.status === "Active"
    ).length;

  const totalLearningAreas =
    learningAreas.length;

  if ($("totalLearners")) {
    $("totalLearners").textContent =
      totalLearners;
  }

  if ($("activeLearners")) {
    $("activeLearners").textContent =
      activeLearners;
  }

  if ($("totalLearningAreas")) {
    $("totalLearningAreas").textContent =
      totalLearningAreas;
  }

  if ($("totalGrades")) {
    $("totalGrades").textContent =
      grades.length;
  }

}


// =====================================================
// RENDER LEARNERS
// =====================================================

function renderLearners() {

  const tableBody =
    $("learnersTableBody");

  if (!tableBody) return;

  const searchInput =
    $("learnerSearch");

  const filterGrade =
    $("filterGrade");

  const search =
    searchInput
      ? searchInput.value.trim().toLowerCase()
      : "";

  const gradeFilter =
    filterGrade
      ? filterGrade.value
      : "";

  let filteredLearners =
    learners.filter(function (learner) {

      const matchesSearch =
        !search ||
        learner.full_name
          .toLowerCase()
          .includes(search) ||
        learner.admission_number
          .toLowerCase()
          .includes(search);

      const matchesGrade =
        !gradeFilter ||
        learner.grade_id === gradeFilter;

      return matchesSearch && matchesGrade;

    });


  tableBody.innerHTML = "";


  if (filteredLearners.length === 0) {

    tableBody.innerHTML = `
      <tr>
        <td colspan="7">
          No learners found.
        </td>
      </tr>
    `;

    return;
  }


  filteredLearners.forEach(function (learner) {

    const row =
      document.createElement("tr");

    const gradeNumber =
      learner.grades
        ? learner.grades.grade_number
        : "";

    row.innerHTML = `
      <td>${escapeHtml(learner.admission_number)}</td>

      <td>${escapeHtml(learner.full_name)}</td>

      <td>${escapeHtml(learner.gender || "")}</td>

      <td>Grade ${escapeHtml(String(gradeNumber))}</td>

      <td>${escapeHtml(learner.guardian_name || "")}</td>

      <td>${escapeHtml(learner.guardian_phone || "")}</td>

      <td>${escapeHtml(learner.status || "")}</td>
    `;

    tableBody.appendChild(row);

  });

}


// =====================================================
// RENDER LEARNING AREAS
// =====================================================

function renderLearningAreas() {

  const container =
    $("learningAreasList");

  if (!container) return;

  container.innerHTML = "";


  if (learningAreas.length === 0) {

    container.innerHTML =
      "<p>No learning areas found.</p>";

    return;
  }


  learningAreas.forEach(function (area) {

    const item =
      document.createElement("div");

    item.className =
      "learning-area-item";

    item.innerHTML = `
      <strong>${escapeHtml(area.name)}</strong>
      ${
        area.code
          ? `<span>${escapeHtml(area.code)}</span>`
          : ""
      }
    `;

    container.appendChild(item);

  });

}


// =====================================================
// REGISTER LEARNER
// =====================================================

const learnerForm =
  $("learnerForm");

if (learnerForm) {

  learnerForm.addEventListener(
    "submit",
    async function (event) {

      event.preventDefault();


      const admissionNumber =
        $("admissionNumber")?.value.trim();

      const fullName =
        $("fullName")?.value.trim();

      const gender =
        $("gender")?.value;

      const gradeId =
        $("learnerGrade")?.value;

      const guardianName =
        $("guardianName")?.value.trim();

      const guardianPhone =
        $("guardianPhone")?.value.trim();

      const admissionDate =
        $("admissionDate")?.value;


      if (
        !admissionNumber ||
        !fullName ||
        !gradeId
      ) {

        alert(
          "Please enter admission number, full name and grade."
        );

        return;
      }


      if (!school) {

        alert(
          "School information is not loaded yet."
        );

        return;
      }


      const { data, error } =
        await db
          .from("learners")
          .insert({

            school_id: school.id,

            admission_number:
              admissionNumber,

            full_name:
              fullName,

            gender:
              gender || null,

            grade_id:
              gradeId,

            guardian_name:
              guardianName || null,

            guardian_phone:
              guardianPhone || null,

            admission_date:
              admissionDate || null,

            status:
              "Active"

          })
          .select()
          .single();


      if (error) {

        console.error(
          "Add learner error:",
          error
        );

        alert(
          "Could not register learner: " +
          error.message
        );

        return;
      }


      learners.push(data);

      alert(
        "Learner registered successfully."
      );


      learnerForm.reset();

      await loadLearners();

      updateDashboard();

      renderLearners();

    }
  );

}


// =====================================================
// SEARCH LEARNERS
// =====================================================

if ($("learnerSearch")) {

  $("learnerSearch").addEventListener(
    "input",
    renderLearners
  );

}


if ($("filterGrade")) {

  $("filterGrade").addEventListener(
    "change",
    renderLearners
  );

}


// =====================================================
// LOGOUT
// =====================================================

const logoutButton =
  $("logoutButton");

if (logoutButton) {

  logoutButton.addEventListener(
    "click",
    async function () {

      const { error } =
        await db.auth.signOut();

      if (error) {

        console.error(
          "Logout error:",
          error
        );

        return;
      }


      if ($("appView")) {
        $("appView")
          .classList
          .add("hidden");
      }


      if ($("loginView")) {
        $("loginView")
          .classList
          .remove("hidden");
      }


      if ($("loginForm")) {
        $("loginForm").reset();
      }

    }
  );

}


// =====================================================
// NAVIGATION
// =====================================================

document
  .querySelectorAll("[data-section]")
  .forEach(function (button) {

    button.addEventListener(
      "click",
      function () {

        const sectionId =
          button.getAttribute(
            "data-section"
          );

        document
          .querySelectorAll(
            ".app-section"
          )
          .forEach(function (section) {

            section.classList.add(
              "hidden"
            );

          });


        const target =
          $(sectionId);

        if (target) {

          target.classList.remove(
            "hidden"
          );

        }


        document
          .querySelectorAll(
            "[data-section]"
          )
          .forEach(function (item) {

            item.classList.remove(
              "active"
            );

          });


        button.classList.add(
          "active"
        );

      }
    );

  });


// =====================================================
// SECURITY / SESSION CHECK
// =====================================================

async function checkExistingSession() {

  try {

    const {
      data: { session },
      error
    } = await db.auth.getSession();


    if (error) {

      console.error(
        "Session error:",
        error
      );

      return;
    }


    if (session) {

      await showApplication();

    }

  } catch (error) {

    console.error(
      "Session check error:",
      error
    );

  }

}


// =====================================================
// ESCAPE HTML
// =====================================================

function escapeHtml(value) {

  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

}


// =====================================================
// START APPLICATION
// =====================================================

checkExistingSession();
