const SUPABASE_URL = "https://awazhdqlkjscfrhsoghe.supabase.co";

const SUPABASE_KEY =
    "sb_publishable_87J_ACo3RI__1dzCFH1I8A_vml3ngIh";

const db = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);


// ===============================
// GLOBAL DATA
// ===============================

let currentUser = null;
let currentProfile = null;
let school = null;
let grades = [];
let learningAreas = [];
let learners = [];


// ===============================
// LOGIN
// ===============================

const loginForm = document.getElementById("loginForm");

if (loginForm) {

    loginForm.addEventListener("submit", async function (event) {

        event.preventDefault();

        const email =
            document.getElementById("email").value.trim();

        const password =
            document.getElementById("password").value;

        const loginMessage =
            document.getElementById("loginMessage");

        loginMessage.textContent = "Signing in...";

        const { data, error } =
            await db.auth.signInWithPassword({
                email: email,
                password: password
            });

        if (error) {

            console.error(error);

            loginMessage.textContent =
                "Login failed: " + error.message;

            return;
        }

        currentUser = data.user;

        await showApplication();

    });
}


// ===============================
// SHOW APPLICATION
// ===============================

async function showApplication() {

    document.getElementById("loginPage").style.display =
        "none";

    document.getElementById("appDashboard").style.display =
        "flex";

    await loadSchoolData();

    await loadGrades();

    await loadLearningAreas();

    await loadLearners();

    setupNavigation();

    setupLearnerForm();

    setupLearnerSearch();

    populateGradeSelectors();

}


// ===============================
// LOAD SCHOOL
// ===============================

async function loadSchoolData() {

    const { data, error } =
        await db
            .from("schools")
            .select("*")
            .eq("name", "Ngessumin Comprehensive School")
            .single();

    if (error) {

        console.error(
            "School loading error:",
            error
        );

        return;
    }

    school = data;

    document.getElementById("schoolName").textContent =
        school.name;

    await loadProfile();

}


// ===============================
// LOAD PROFILE
// ===============================

async function loadProfile() {

    if (!currentUser) return;

    const { data, error } =
        await db
            .from("profiles")
            .select("*")
            .eq("id", currentUser.id)
            .single();

    if (error) {

        console.error(
            "Profile loading error:",
            error
        );

        return;
    }

    currentProfile = data;

    document.getElementById("userName").textContent =
        `${data.full_name} (${data.role})`;

}


// ===============================
// LOAD GRADES
// ===============================

async function loadGrades() {

    if (!school) return;

    const { data, error } =
        await db
            .from("grades")
            .select("*")
            .eq("school_id", school.id)
            .order("grade_number");

    if (error) {

        console.error(
            "Grades loading error:",
            error
        );

        return;
    }

    grades = data || [];

}


// ===============================
// LOAD LEARNING AREAS
// ===============================

async function loadLearningAreas() {

    if (!school) return;

    const { data, error } =
        await db
            .from("learning_areas")
            .select("*")
            .eq("school_id", school.id)
            .eq("active", true)
            .order("name");

    if (error) {

        console.error(
            "Learning areas loading error:",
            error
        );

        return;
    }

    learningAreas = data || [];

    renderLearningAreas();

}


// ===============================
// RENDER LEARNING AREAS
// ===============================

function renderLearningAreas() {

    const container =
        document.getElementById("learningAreasList");

    if (!container) return;

    if (learningAreas.length === 0) {

        container.innerHTML =
            "<p>No learning areas found.</p>";

        return;
    }

    container.innerHTML =
        learningAreas.map(area => `
            <div class="learning-area-item">
                <strong>${escapeHTML(area.name)}</strong>
                ${
                    area.code
                    ? `<span> (${escapeHTML(area.code)})</span>`
                    : ""
                }
            </div>
        `).join("");

}


// ===============================
// LOAD LEARNERS
// ===============================

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

        console.error(
            "Learners loading error:",
            error
        );

        return;
    }

    learners = data || [];

    renderLearners();

    updateDashboard();

}


// ===============================
// REGISTER LEARNER
// ===============================

function setupLearnerForm() {

    const form =
        document.getElementById("learnerForm");

    if (!form) return;

    form.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();

            const message =
                document.getElementById(
                    "learnerMessage"
                );

            message.textContent =
                "Registering learner...";

            const admissionNumber =
                document
                    .getElementById(
                        "admissionNumber"
                    )
                    .value
                    .trim();

            const fullName =
                document
                    .getElementById("fullName")
                    .value
                    .trim();

            const gender =
                document
                    .getElementById("gender")
                    .value;

            const gradeId =
                document
                    .getElementById("grade")
                    .value;

            const guardianName =
                document
                    .getElementById("guardianName")
                    .value
                    .trim();

            const guardianPhone =
                document
                    .getElementById("guardianPhone")
                    .value
                    .trim();

            const admissionDate =
                document
                    .getElementById(
                        "admissionDate"
                    )
                    .value || null;

            const status =
                document
                    .getElementById(
                        "learnerStatus"
                    )
                    .value;


            if (!gradeId) {

                message.textContent =
                    "Please select a grade.";

                return;
            }


            const { error } =
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
                            admissionDate,

                        status:
                            status

                    });


            if (error) {

                console.error(error);

                message.textContent =
                    "Could not register learner: " +
                    error.message;

                return;
            }


            message.textContent =
                "Learner registered successfully.";

            form.reset();

            await loadLearners();

        }
    );

}


// ===============================
// POPULATE GRADE SELECTORS
// ===============================

function populateGradeSelectors() {

    const gradeSelect =
        document.getElementById("grade");

    const filter =
        document.getElementById(
            "learnerGradeFilter"
        );


    if (gradeSelect) {

        gradeSelect.innerHTML =
            `<option value="">
                Select grade
            </option>` +
            grades.map(grade => `
                <option value="${grade.id}">
                    Grade ${grade.grade_number}
                </option>
            `).join("");

    }


    if (filter) {

        filter.innerHTML =
            `<option value="">
                All Grades
            </option>` +
            grades.map(grade => `
                <option value="${grade.id}">
                    Grade ${grade.grade_number}
                </option>
            `).join("");

    }

}


// ===============================
// SEARCH & FILTER
// ===============================

function setupLearnerSearch() {

    const search =
        document.getElementById(
            "learnerSearch"
        );

    const filter =
        document.getElementById(
            "learnerGradeFilter"
        );


    if (search) {

        search.addEventListener(
            "input",
            renderLearners
        );

    }


    if (filter) {

        filter.addEventListener(
            "change",
            renderLearners
        );

    }

}


// ===============================
// DISPLAY LEARNERS
// ===============================

function renderLearners() {

    const table =
        document.getElementById(
            "learnersTableBody"
        );

    if (!table) return;


    const search =
        document
            .getElementById(
                "learnerSearch"
            )
            ?.value
            .toLowerCase()
            .trim() || "";


    const gradeFilter =
        document
            .getElementById(
                "learnerGradeFilter"
            )
            ?.value || "";


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
                !gradeFilter ||
                learner.grade_id === gradeFilter;


            return (
                matchesSearch &&
                matchesGrade
            );

        });


    if (filtered.length === 0) {

        table.innerHTML = `
            <tr>
                <td colspan="7">
                    No learners found.
                </td>
            </tr>
        `;

        return;
    }


    table.innerHTML =
        filtered.map(learner => {

            const gradeNumber =
                learner.grades
                ? learner.grades.grade_number
                : "";


            return `
                <tr>

                    <td>
                        ${escapeHTML(
                            learner.admission_number
                        )}
                    </td>

                    <td>
                        ${escapeHTML(
                            learner.full_name
                        )}
                    </td>

                    <td>
                        ${escapeHTML(
                            learner.gender || "-"
                        )}
                    </td>

                    <td>
                        Grade ${gradeNumber}
                    </td>

                    <td>
                        ${escapeHTML(
                            learner.guardian_name || "-"
                        )}
                    </td>

                    <td>
                        ${escapeHTML(
                            learner.guardian_phone || "-"
                        )}
                    </td>

                    <td>
                        ${escapeHTML(
                            learner.status
                        )}
                    </td>

                </tr>
            `;

        }).join("");

}


// ===============================
// DASHBOARD
// ===============================

function updateDashboard() {

    const totalLearners =
        document.getElementById(
            "totalLearners"
        );

    const totalGrades =
        document.getElementById(
            "totalGrades"
        );

    const totalAreas =
        document.getElementById(
            "totalLearningAreas"
        );


    if (totalLearners) {

        totalLearners.textContent =
            learners.length;

    }


    if (totalGrades) {

        totalGrades.textContent =
            grades.length;

    }


    if (totalAreas) {

        totalAreas.textContent =
            learningAreas.length;

    }

}


// ===============================
// NAVIGATION
// ===============================

function setupNavigation() {

    const buttons =
        document.querySelectorAll(
            ".nav-link"
        );


    buttons.forEach(button => {

        button.addEventListener(
            "click",
            function () {

                const sectionId =
                    this.dataset.section;


                document
                    .querySelectorAll(
                        ".nav-link"
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
                        ".content-section"
                    )
                    .forEach(section =>
                        section.classList.remove(
                            "active"
                        )
                    );


                const section =
                    document.getElementById(
                        sectionId
                    );


                if (section) {

                    section.classList.add(
                        "active"
                    );

                }

            }
        );

    });

}


// ===============================
// LOGOUT
// ===============================

const logoutButton =
    document.getElementById(
        "logoutButton"
    );


if (logoutButton) {

    logoutButton.addEventListener(
        "click",
        async function () {

            await db.auth.signOut();

            location.reload();

        }
    );

}


// ===============================
// EXISTING SESSION
// ===============================

async function checkExistingSession() {

    const { data } =
        await db.auth.getSession();

    if (data.session) {

        currentUser =
            data.session.user;

        await showApplication();

    }

}


// ===============================
// HTML SECURITY
// ===============================

function escapeHTML(value) {

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}


// ===============================
// START APPLICATION
// ===============================

checkExistingSession();
