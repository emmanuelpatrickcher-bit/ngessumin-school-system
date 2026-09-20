const SUPABASE_URL="https://awazhdqlkjscfrhsoghe.supabase.co";
const SUPABASE_KEY="sb_publishable_87J_ACo3RI__1dzCFH1I8A_vml3ngIh";
const db=window.supabase.createClient(SUPABASE_URL,SUPABASE_KEY);

let grades=[];
let learners=[];
let areas=[];

document.addEventListener("DOMContentLoaded",()=>{
    document.getElementById("loginForm")?.addEventListener("submit",login);
    document.getElementById("logoutButton")?.addEventListener("click",logout);
    document.getElementById("learnerForm")?.addEventListener("submit",addLearner);
    document.getElementById("learnerSearch")?.addEventListener("input",showLearners);
    document.getElementById("learnerGradeFilter")?.addEventListener("change",showLearners);

    document.querySelectorAll("[data-section]").forEach(b=>{
        b.addEventListener("click",()=>showSection(b.dataset.section));
    });

    checkSession();
});

async function checkSession(){
    const {data}=await db.auth.getSession();

    if(data.session) startApp();
    else{
        document.getElementById("loginPage").style.display="block";
        document.getElementById("appDashboard").style.display="none";
    }
}

async function login(e){
    e.preventDefault();

    const email=document.getElementById("email").value.trim();
    const password=document.getElementById("password").value;
    const msg=document.getElementById("loginMessage");

    msg.textContent="Signing in...";

    const {error}=await db.auth.signInWithPassword({email,password});

    if(error){
        msg.textContent=error.message;
        return;
    }

    startApp();
}

async function startApp(){
    document.getElementById("loginPage").style.display="none";
    document.getElementById("appDashboard").style.display="block";

    await loadSchool();
    await loadGrades();
    await loadAreas();
    await loadLearners();

    showSection("dashboard");
}

async function loadSchool(){
    const {data}=await db
        .from("schools")
        .select("name")
        .eq("name","Ngessumin Comprehensive School")
        .single();

    if(data){
        const el=document.getElementById("schoolName");
        if(el) el.textContent=data.name;
    }

    const year=document.getElementById("currentYear");
    if(year) year.textContent="2026";
}

async function loadGrades(){

    const grade=document.getElementById("grade");
    const filter=document.getElementById("learnerGradeFilter");

    if(!grade) return;

    /*
       Put Grade 1–9 into the dropdown immediately.
       This ensures the grades are visible even while
       Supabase is loading.
    */

    grade.innerHTML='<option value="">Select grade</option>';

    if(filter)
        filter.innerHTML='<option value="">All Grades</option>';

    for(let i=1;i<=9;i++){

        const option=document.createElement("option");

        option.value="grade-"+i;
        option.textContent="Grade "+i;

        grade.appendChild(option);

        if(filter){

            const f=document.createElement("option");

            f.value="grade-"+i;
            f.textContent="Grade "+i;

            filter.appendChild(f);
        }
    }

    /*
       Now get the real Supabase grade IDs.
    */

    const {data,error}=await db
        .from("grades")
        .select("id,grade_number")
        .order("grade_number");

    if(error){
        console.error("Grade loading error:",error);
        return;
    }

    grades=data||[];

    /*
       Replace temporary values with real Supabase IDs.
    */

    grades.forEach(g=>{

        const option=grade.querySelector(
            `option[value="grade-${g.grade_number}"]`
        );

        if(option)
            option.value=g.id;

        if(filter){

            const f=filter.querySelector(
                `option[value="grade-${g.grade_number}"]`
            );

            if(f)
                f.value=g.id;
        }
    });

    const total=document.getElementById("totalGrades");

    if(total)
        total.textContent=grades.length;
}

async function loadAreas(){

    const {data,error}=await db
        .from("learning_areas")
        .select("id,name,code")
        .eq("active",true)
        .order("name");

    if(error){
        console.error(error);
        return;
    }

    areas=data||[];

    const list=document.getElementById("learningAreasList");

    if(list){

        list.innerHTML="";

        areas.forEach(a=>{
            const item=document.createElement("div");
            item.textContent=a.name;
            list.appendChild(item);
        });
    }

    const total=document.getElementById("totalLearningAreas");

    if(total)
        total.textContent=areas.length;
}

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
        .order("full_name");

    if(error){
        console.error(error);
        return;
    }

    learners=data||[];

    showLearners();

    const total=document.getElementById("totalLearners");

    if(total)
        total.textContent=learners.length;
}

function showLearners(){

    const table=document.getElementById("learnersTableBody");

    if(!table) return;

    const search=(document.getElementById("learnerSearch")?.value||"").toLowerCase();
    const gradeFilter=document.getElementById("learnerGradeFilter")?.value||"";

    table.innerHTML="";

    const filtered=learners.filter(l=>{

        const name=(l.full_name||"").toLowerCase();
        const admission=(l.admission_number||"").toLowerCase();

        const searchOK=
            name.includes(search) ||
            admission.includes(search);

        const gradeOK=
            !gradeFilter || l.grade_id===gradeFilter;

        return searchOK && gradeOK;
    });

    if(filtered.length===0){

        table.innerHTML=`
        <tr>
            <td colspan="6">No learners found.</td>
        </tr>`;

        return;
    }

    filtered.forEach(l=>{

        const row=document.createElement("tr");

        row.innerHTML=`
        <td>${l.admission_number}</td>
        <td>${l.full_name}</td>
        <td>${l.gender||""}</td>
        <td>Grade ${l.grades?.grade_number||""}</td>
        <td>${l.guardian_name||""}</td>
        <td>${l.status||""}</td>`;

        table.appendChild(row);
    });
}

async function addLearner(e){

    e.preventDefault();

    const msg=document.getElementById("learnerMessage");

    const admissionNumber=document.getElementById("admissionNumber").value.trim();
    const fullName=document.getElementById("fullName").value.trim();
    const gender=document.getElementById("gender").value;
    let gradeId=document.getElementById("grade").value;
    const guardianName=document.getElementById("guardianName").value.trim();
    const guardianPhone=document.getElementById("guardianPhone").value.trim();
    const admissionDate=document.getElementById("admissionDate").value;
    const status=document.getElementById("learnerStatus").value;

    if(!admissionNumber||!fullName||!gradeId){

        msg.textContent="Please enter admission number, full name and grade.";

        return;
    }

    /*
       If the dropdown still has a temporary grade value,
       find the real Supabase ID.
    */

    if(gradeId.startsWith("grade-")){

        const number=parseInt(gradeId.replace("grade-",""));

        const found=grades.find(g=>g.grade_number===number);

        if(found){
            gradeId=found.id;
        }else{

            msg.textContent="Unable to identify the selected grade.";

            return;
        }
    }

    msg.textContent="Saving learner...";

    const {data:school,error:schoolError}=await db
        .from("schools")
        .select("id")
        .eq("name","Ngessumin Comprehensive School")
        .single();

    if(schoolError){

        msg.textContent=schoolError.message;

        return;
    }

    const {error}=await db
        .from("learners")
        .insert({
            school_id:school.id,
            admission_number:admissionNumber,
            full_name:fullName,
            gender:gender||null,
            grade_id:gradeId,
            guardian_name:guardianName||null,
            guardian_phone:guardianPhone||null,
            admission_date:admissionDate||null,
            status:status||"Active"
        });

    if(error){

        msg.textContent=error.message;

        return;
    }

    msg.textContent="Learner added successfully.";

    document.getElementById("learnerForm").reset();

    await loadLearners();
}

function showSection(section){

    document.querySelectorAll(".section").forEach(s=>{
        s.style.display="none";
    });

    const target=document.getElementById(section);

    if(target)
        target.style.display="block";
}

async function logout(){

    await db.auth.signOut();

    document.getElementById("appDashboard").style.display="none";
    document.getElementById("loginPage").style.display="block";
        }
