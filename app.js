// ======================================================
// NGESSUMIN COMPREHENSIVE SCHOOL MANAGEMENT SYSTEM
// ======================================================

// ------------------------------
// SUPABASE CONNECTION
// ------------------------------

const SUPABASE_URL =
    "https://awazhdqlkjscfrhsoghe.supabase.co";

const SUPABASE_KEY =
    "sb_publishable_87J_ACo3RI__1dzCFH1I8A_vml3ngIh";

const db = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);


// ------------------------------
// GLOBAL VARIABLES
// ------------------------------

let currentUser = null;
let currentProfile = null;
let school = null;

let grades = [];
let learningAreas = [];
let learners = [];


// ======================================================
// LOGIN
// ======================================================

const loginForm =
    document.getElementById("loginForm");

if (loginForm) {

    loginForm.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();

            const email =
                document
                    .getElementById("email")
                    .value
                    .trim();

            const password =
                document
                    .getElementById("password")
                    .value;

            const message =
                document.getElementById(
                    "loginMessage"
                );

            message.textContent =
                "Signing in...";


            const { data, error } =
                await db.auth.signInWithPassword({
                    email: email,
                    password: password
                });


            if (error) {

                console.error(error);

                message.textContent =
                    "Login failed: " +
                    error.message;

                return;
            }


            currentUser = data.user;

            await showApplication();

        }
    );

}


// ======================================================
// SHOW APPLICATION
// ======================================================

async function showApplication() {

    const loginPage =
        document.getElementById(
            "loginPage"
        );

    const appDashboard =
        document.getElementById(
            "appDashboard"
        );


    if (loginPage) {
        loginPage.style.display = "none";
    }


    if (appDashboard) {
        appDashboard.style.display = "flex";
    }


    // Load data in the correct order

    await loadSchool();

    await loadGrades();

    await loadLearningAreas();

    await loadLearners();


    // Set up the interface

    setupNavigation();

    setupLearnerForm();

    setupLearnerSearch();

}


// ======================================================
// LOAD SCHOOL
// ======================================================

async function loadSchool() {

    const { data, error } =
        await db
            .from("schools")
            .select("*")
            .eq(
                "name",
                "Ngessumin Comprehensive School"
            )
            .single();


    if (error) {

        console.error(
            "School loading error:",
            error
        );

        return;
    }


    school = data;


    const schoolName =
        document.getElementById(
            "schoolName"
        );


    if (schoolName) {

        schoolName.textContent =
            school.name;

    }


    await loadProfile();

}


// ======================================================
// LOAD USER PROFILE
// ======================================================

async function loadProfile() {

    if (!currentUser) return;


    const { data, error } =
        await db
            .from("profiles")
            .select("*")
            .eq(
                "id",
                currentUser.id
            )
            .single();


    if (error) {

        console.error(
            "Profile loading error:",
            error
        );

        return;
    }


    currentProfile = data;


    const userName =
        document.getElementById(
            "userName"
        );


    if (userName) {

        userName.textContent =
            data.full_name +
            " (" +
            data.role +
            ")";

    }

}


// ======================================================
// LOAD GRADES
// ======================================================

async function loadGrades() {

    const { data, error } =
        await db
            .from("grades")
            .select(
                "id, grade_number"
            )
            .order(
                "grade_number",
                {
                    ascending: true
                }
            );


    if (error) {

        console.error(
            "Grades loading error:",
            error
        );

        return;
    }


    grades = data || [];


    console.log(
        "Grades loaded:",
        grades
    );


    populateGradeSelectors();

}


// ======================================================
// POPULATE GRADE DROPDOWNS
// ======================================================

function populateGradeSelectors() {

    const gradeSelect =
        document.getElementById(
            "grade"
        );


    const gradeFilter =
        document.getElementById(
            "learnerGradeFilter"
        );


    // ------------------------------
    // Registration grade dropdown
    // ------------------------------

    if (gradeSelect) {

        gradeSelect.innerHTML =
            '<option value="">Select grade</option>';


        grades.forEach(function (grade) {

            const option =
                document.createElement(
                    "option"
                );

            option.value =
                grade.id;

            option.textContent =
                "Grade " +
                grade.grade_number;

            gradeSelect.appendChild(
                option
            );

        });

    }


    // ------------------------------
    // Search/filter grade dropdown
    // ------------------------------

    if (gradeFilter) {

        gradeFilter.innerHTML =
            '<option value="">All Grades</option>';


        grades.forEach(function (grade) {

            const option =
                document.createElement(
                    "option"
                );

            option.value =
                grade.id;

            option.textContent =
                "Grade " +
                grade.grade_number;

            gradeFilter.appendChild(
                option
            );

        });

    }

}


// ======================================================
// LOAD LEARNING AREAS
// ======================================================

async function loadLearningAreas() {

    if (!school) return;


    const { data, error } =
        await db
            .from("learning_areas")
            .select("*")
            .eq(
                "school_id",
                school.id
            )
            .eq(
                "active",
                true
            )
            .order("name");


    if (error) {

        console.error(
            "Learning areas loading error:",
            error
        );

        return;
    }


    learningAreas =
        data || [];


    renderLearningAreas();

}


// ======================================================
// DISPLAY LEARNING AREAS
// ======================================================

function renderLearningAreas() {

    const container =
        document.getElementById(
            "learningAreasList"
        );


    if (!container) return;


    if (learningAreas.length === 0) {

        container.innerHTML =
            "<p>No learning areas found.</p>";

        return;
    }


    container.innerHTML = "";


    learningAreas.forEach(
        function (area) {

            const item =
                document.createElement(
                    "div"
                );

            item.className =
                "learning-area-item";


            item.innerHTML =
                "<strong>" +
                escapeHTML(area.name) +
                "</strong>" +
                (
                    area.code
                    ? " (" +
                      escapeHTML(area.code) +
                      ")"
                    : ""
                );


            container.appendChild(
                item
            );

        }
    );

}


// ======================================================
// LOAD LEARNERS
// ======================================================

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
            .eq(
                "school_id",
                school.id
            )
            .order(
                "full_name",
                {
                    ascending: true
                }
            );


    if (error) {

        console.error(
            "Learners loading error:",
            error
        );

        return;
    }


    learners =
        data || [];


    renderLearners();

    updateDashboard();

}


// ======================================================
// REGISTER LEARNER
// ======================================================

function setupLearnerForm() {

    const form =
        document.getElementById(
            "learnerForm"
        );


    if (!form) return;


    // Prevent duplicate event listeners

    if (
        form.dataset.initialized ===
        "true"
    ) {
        return;
    }


    form.dataset.initialized =
        "true";


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


            if (!school) {

                message.textContent =
                    "School information could not be loaded.";

                return;
            }


            const admissionNumber =
                document
                    .getElementById(
                        "admissionNumber"
                    )
                    .value
                    .trim();


            const fullName =
                document
                    .getElementById(
                        "fullName"
                    )
                    .value
                    .trim();


            const gender =
                document
                    .getElementById(
                        "gender"
                    )
                    .value;


            const gradeId =
                document
                    .getElementById(
                        "grade"
                    )
                    .value;


            const guardianName =
                document
                    .getElementById(
                        "guardianName"
                    )
                    .value
                    .trim();


            const guardianPhone =
                document
                    .getElementById(
                        "guardianPhone"
                    )
                    .value
                    .trim();


            const admissionDate =
                document
                    .getElementById(
                        "admissionDate"
                    )
                    .value;


            const status =
                document
                    .getElementById(
                        "learnerStatus"
                    )
                    .value;


            // ------------------------------
            // Validation
            // ------------------------------

            if (!admissionNumber) {

                message.textContent =
                    "Please enter the admission number.";

                return;
            }


            if (!fullName) {

                message.textContent =
                    "Please enter the learner's full name.";

                return;
            }


            if (!gradeId) {

                message.textContent =
                    "Please select a grade.";

                return;
            }


            // ------------------------------
            // Insert learner
            // ------------------------------

            const { error } =
                await db
                    .from("learners")
                    .insert({

                        school_id:
                            school.id,

                        admission_number:
                            admissionNumber,

                        full_name:
                            fullName,

                        gender:
                            gender ||
                            null,

                        grade_id:
                            gradeId,

                        guardian_name:
                            guardianName ||
                            null,

                        guardian_phone:
                            guardianPhone ||
                            null,

                        admission_date:
                            admissionDate ||
                            null,

                        status:
                            status ||
                            "Active"

                    });


            if (error) {

                console.error(
                    "Learner registration error:",
                    error
                );


                if (
                    error.code ===
                    "23505"
                ) {

                    message.textContent =
                        "That admission number already exists.";

                } else {

                    message.textContent =
                        "Could not register learner: " +
                        error.message;

                }


                return;
            }


            // ------------------------------
            // Success
            // ------------------------------

            message.textContent =
                "Learner registered successfully.";


            form.reset();


            await loadLearners();

        }
    );

}


// ======================================================
// LEARNER SEARCH
// ======================================================

function setupLearnerSearch() {

    const search =
        document.getElementById(
            "learnerSearch"
        );


    const gradeFilter =
        document.getElementById(
            "learnerGradeFilter"
        );


    if (search) {

        search.addEventListener(
            "input",
            function () {

                renderLearners();

            }
        );

    }


    if (gradeFilter) {

        gradeFilter.addEventListener(
            "change",
            function () {

                renderLearners();

            }
        );

    }

}


// ======================================================
// DISPLAY LEARNERS
// ======================================================

function renderLearners() {

    const table =
        document.getElementById(
            "learnersTableBody"
        );


    if (!table) return;


    const searchInput =
        document.getElementById(
            "learnerSearch"
        );


    const gradeFilter =
        document.getElementById(
            "learnerGradeFilter"
        );


    const search =
        searchInput
        ? searchInput.value
            .toLowerCase()
            .trim()
        : "";


    const selectedGrade =
        gradeFilter
        ? gradeFilter.value
        : "";


    const filteredLearners =
        learners.filter(
            function (learner) {

                const name =
                    (
                        learner.full_name ||
                        ""
                    ).toLowerCase();


                const admission =
                    (
                        learner.admission_number ||
                        ""
                    ).toLowerCase();


                const matchesSearch =
                    !search ||
                    name.includes(search) ||
                    admission.includes(search);


                const matchesGrade =
                    !selectedGrade ||
                    learner.grade_id ===
                    selectedGrade;


                return (
                    matchesSearch &&
                    matchesGrade
                );

            }
        );


    if (
        filteredLearners.length ===
        0
    ) {

        table.innerHTML = `
            <tr>
                <td colspan="7">
                    No learners found.
                </td>
            </tr>
        `;

        return;
    }


    table.innerHTML = "";


    filteredLearners.forEach(
        function (learner) {

            const row =
                document.createElement(
                    "tr"
                );


            const gradeNumber =
                learner.grades
                ? learner.grades.grade_number
                : "";


            row.innerHTML = `

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
                        learner.gender ||
                        "-"
                    )}
                </td>

                <td>
                    Grade ${escapeHTML(
                        gradeNumber
                    )}
                </td>

                <td>
                    ${escapeHTML(
                        learner.guardian_name ||
                        "-"
                    )}
                </td>

                <td>
                    ${escapeHTML(
                        learner.guardian_phone ||
                        "-"
                    )}
                </td>

                <td>
                    ${escapeHTML(
                        learner.status ||
                        "-"
                    )}
                </td>

            `;


            table.appendChild(row);

        }
    );

}


// ======================================================
// DASHBOARD
// ======================================================

function updateDashboard() {

    const totalLearners =
        document.getElementById(
            "totalLearners"
        );


    const totalGrades =
        document.getElementById(
            "totalGrades"
        );


    const totalLearningAreas =
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


    if (totalLearningAreas) {

        totalLearningAreas.textContent =
            learningAreas.length;

    }


    const currentYear =
        document.getElementById(
            "currentYear"
        );


    if (currentYear) {

        currentYear.textContent =
            "2026";

    }

}


// ======================================================
// NAVIGATION
// ===============
