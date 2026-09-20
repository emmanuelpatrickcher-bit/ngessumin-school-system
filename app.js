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

      full_name:
        $("fullName").value.trim(),

      gender:
        $("gender").value || null,

      grade_id:
        $("gradeId").value,

      guardian_name:
        $("guardianName").value.trim() || null,

      guardian_phone:
        $("guardianPhone").value.trim() || null,

      admission_date:
        $("admissionDate").value || null,

      status:
        $("status").value

    };


    showMessage(
      $("learnerMessage"),
      "Registering learner..."
    );


    const { error } =
      await db
        .from("learners")
        .insert(learner);


    if (error) {

      console.error(error);

      showMessage(
        $("learnerMessage"),
        error.message
      );

      return;
    }


    showMessage(
      $("learnerMessage"),
      "Learner registered successfully.",
      true
    );


    $("learnerForm").reset();

    await loadLearners();

    updateDashboard();

    renderLearners();

  }
);


// -----------------------------
// RENDER LEARNERS
// -----------------------------

function renderLearners() {

  const table =
    $("learnerTable");

  const search =
    $("learnerSearch").value
      .trim()
      .toLowerCase();

  const grade =
    $("gradeFilter").value;


  table.innerHTML = "";


  const filtered =
    learners.filter(learner => {

      const matchesSearch =
        !search ||
        learner.full_name
          .toLowerCase()
          .includes(search) ||
        learner.admission_number
          .toLowerCase()
          .includes(search);


      const matchesGrade =
        !grade ||
        learner.grade_id === grade;


      return matchesSearch &&
             matchesGrade;

    });


  if (filtered.length === 0) {

    table.innerHTML = `
      <tr>
        <td colspan="6">
          No learners found.
        </td>
      </tr>
    `;

    return;
  }


  filtered.forEach(learner => {

    const row =
      document.createElement("tr");


    const gradeNumber =
      learner.grades
        ? learner.grades.grade_number
        : "";


    row.innerHTML = `

      <td>
        ${escapeHtml(
          learner.admission_number
        )}
      </td>

      <td>
        ${escapeHtml(
          learner.full_name
        )}
      </td>

      <td>
        ${escapeHtml(
          learner.gender || ""
        )}
      </td>

      <td>
        Grade ${gradeNumber}
      </td>

      <td>
        ${escapeHtml(
          learner.guardian_name || ""
        )}
      </td>

      <td>
        ${escapeHtml(
          learner.status
        )}
      </td>

    `;


    table.appendChild(row);

  });

}


// -----------------------------
// RENDER LEARNING AREAS
// -----------------------------

async function renderLearningAreas() {

  const table =
    $("areasTable");

  table.innerHTML = "";


  const { data, error } =
    await db
      .from("grade_learning_areas")
      .select(`
        grade_id,
        learning_area_id,
        grades (
          grade_number
        ),
        learning_areas (
          name,
          code
        )
      `);


  if (error) {

    console.error(error);

    table.innerHTML = `
      <tr>
        <td colspan="3">
          Unable to load learning areas.
        </td>
      </tr>
    `;

    return;
  }


  data
    .sort((a, b) =>
      a.grades.grade_number -
      b.grades.grade_number
    )
    .forEach(item => {

      const row =
        document.createElement("tr");


      row.innerHTML = `

        <td>
          Grade ${item.grades.grade_number}
        </td>

        <td>
          ${escapeHtml(
            item.learning_areas.name
          )}
        </td>

        <td>
          ${escapeHtml(
            item.learning_areas.code || ""
          )}
        </td>

      `;


      table.appendChild(row);

    });

}


// -----------------------------
// SEARCH / FILTER
// -----------------------------

$("learnerSearch")
  .addEventListener(
    "input",
    renderLearners
  );


$("gradeFilter")
  .addEventListener(
    "change",
    renderLearners
  );


// -----------------------------
// NAVIGATION
// -----------------------------

document
  .querySelectorAll("[data-section]")
  .forEach(button => {

    button.addEventListener(
      "click",
      function () {

        const target =
          this.dataset.section;


        document
          .querySelectorAll(".section")
          .forEach(section => {

            section.classList.remove(
              "active"
            );

          });


        const section =
          document.getElementById(target);


        if (section) {

          section.classList.add(
            "active"
          );

        }


        $("pageTitle").textContent =
          this.textContent;

      }
    );

  });


// -----------------------------
// LOGOUT
// -----------------------------

$("logoutBtn")
  .addEventListener(
    "click",
    async function () {

      await db.auth.signOut();

      $("appView")
        .classList.add("hidden");

      $("loginView")
        .classList.remove("hidden");

      $("loginForm").reset();

    }
  );


// -----------------------------
// SECURITY HELPER
// -----------------------------

function escapeHtml(value) {

  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

}
// Login troubleshooting
