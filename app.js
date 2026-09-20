const SUPABASE_URL="https://awazhdqlkjscfrhsoghe.supabase.co";
const SUPABASE_KEY="sb_publishable_87J_ACo3RI__1dzCFH1I8A_vml3ngIh";

const db=window.supabase.createClient(SUPABASE_URL,SUPABASE_KEY);

let user,school,grades=[],areas=[],learners=[];


// LOGIN
document.getElementById("loginForm").addEventListener("submit",async e=>{
    e.preventDefault();

    const email=document.getElementById("email").value;
    const password=document.getElementById("password").value;
    const msg=document.getElementById("loginMessage");

    msg.textContent="Signing in...";

    const {data,error}=await db.auth.signInWithPassword({email,password});

    if(error){
        msg.textContent="Login failed: "+error.message;
        return;
    }

    user=data.user;
    await startApp();
});


// START APP
async function startApp(){

    document.getElementById("loginPage").style.display="none";
    document.getElementById("appDashboard").style.display="flex";

    await loadSchool();
    await loadGrades();
    await loadAreas();
    await loadLearners();

    navigation();
    learnerForm();
    learnerSearch();
}


// SCHOOL
async function loadSchool(){

    const {data}=await db
        .from("schools")
        .select("*")
        .eq("name","Ngessumin Comprehensive School")
        .single();

    school=data;

    if(school){
        document.getElementById("schoolName").textContent=school.name;
    }

    const {data:profile}=await db
        .from("profiles")
        .select("*")
        .eq("id",user.id)
        .single();

    if(profile){
        document.getElementById("userName").textContent=
            profile.full_name+" ("+profile.role+")";
    }
}


// GRADES
async function loadGrades(){

    const {data,error}=await db
        .from("grades")
        .select("id,grade_number")
        .order("grade_number");

    if(error){
        console.error(error);
        return;
    }

    grades=data||[];

    const select=document.getElementById("grade");
    const filter=document.getElementById("learnerGradeFilter");

    select.innerHTML='<option value="">Select grade</option>';
    filter.innerHTML='<option value="">All Grades</option>';

    grades.forEach(g=>{

        select.innerHTML+=
            `<option value="${g.id}">Grade ${g.grade_number}</option>`;

        filter.innerHTML+=
            `<option value="${g.id}">Grade ${g.grade_number}</option>`;
    });

    document.getElementById("totalGrades").textContent=grades.length;
}


// LEARNING AREAS
async function loadAreas(){

    const {data}=await db
        .from("learning_areas")
        .select("*")
        .eq("school_id",school.id)
        .eq("active",true)
        .order("name");

    areas=data||[];

    document.getElementById("totalLearningAreas").textContent=areas.length;

    const box=document.getElementById("learningAreasList");

    box.innerHTML=areas.map(a=>
        `<p><strong>${a.name}</strong> ${a.code||""}</p>`
    ).join("");
}


// LEARNERS
async function loadLearners(){

    const {data,error}=await db
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
            grades(grade_number)
        `)
        .eq("school_id",school.id)
        .order("full_name");

    if(error){
        console.error(error);
        return;
    }

    learners=data||[];
    showLearners();
}


// DISPLAY LEARNERS
function showLearners(){

    const table=document.getElementById("learnersTableBody");

    const search=document
        .getElementById("learnerSearch")
        .value.toLowerCase();

    const grade=document
        .getElementById("learnerGradeFilter")
        .value;

    const list=learners.filter(l=>
        (!search ||
        l.full_name.toLowerCase().includes(search) ||
        l.admission_number.toLowerCase().includes(search))
        &&
        (!grade || l.grade_id===grade)
    );

    if(!list.length){
        table.innerHTML=
            `<tr><td colspan="7">No learners found.</td></tr>`;
    }else{

        table.innerHTML=list.map(l=>`
            <tr>
                <td>${l.admission_number}</td>
                <td>${l.full_name}</td>
                <td>${l.gender||"-"}</td>
                <td>Grade ${l.grades?.grade_number||""}</td>
                <td>${l.guardian_name||"-"}</td>
                <td>${l.guardian_phone||"-"}</td>
                <td>${l.status}</td>
            </tr>
        `).join("");
    }

    document.getElementById("totalLearners").textContent=learners.length;
}


// REGISTER LEARNER
function learnerForm(){

    document.getElementById("learnerForm").addEventListener("submit",async e=>{

        e.preventDefault();

        const msg=document.getElementById("learnerMessage");

        const learner={
            school_id:school.id,
            admission_number:document.getElementById("admissionNumber").value.trim(),
            full_name:document.getElementById("fullName").value.trim(),
            gender:document.getElementById("gender").value||null,
            grade_id:document.getElementById("grade").value,
            guardian_name:document.getElementById("guardianName").value.trim()||null,
            guardian_phone:document.getElementById("guardianPhone").value.trim()||null,
            admission_date:document.getElementById("admissionDate").value||null,
            status:document.getElementById("learnerStatus").value
        };

        if(!learner.grade_id){
            msg.textContent="Please select a grade.";
            return;
        }

        const {error}=await db
            .from("learners")
            .insert(learner);

        if(error){
            msg.textContent="Error: "+error.message;
            return;
        }

        msg.textContent="Learner registered successfully.";

        document.getElementById("learnerForm").reset();

        await loadLearners();
    });
}


// SEARCH
function learnerSearch(){

    document
        .getElementById("learnerSearch")
        .addEventListener("input",showLearners);

    document
        .getElementById("learnerGradeFilter")
        .addEventListener("change",showLearners);
}


// NAVIGATION
function navigation(){

    document.querySelectorAll(".nav-link").forEach(button=>{

        button.addEventListener("click",()=>{

            document.querySelectorAll(".nav-link")
                .forEach(b=>b.classList.remove("active"));

            button.classList.add("active");

            document.querySelectorAll(".content-section")
                .forEach(s=>s.classList.remove("active"));

            document.getElementById(button.dataset.section)
                .classList.add("active");
        });
    });
}


// LOGOUT
document.getElementById("logoutButton").addEventListener("click",async()=>{
    await db.auth.signOut();
    location.reload();
});


// CHECK LOGIN
(async()=>{

    const {data}=await db.auth.getSession();

    if(data.session){
        user=data.session.user;
        await startApp();
    }

})();
