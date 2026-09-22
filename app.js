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
async function loadStatementLearners() {

    const learnerSelect =
        document.getElementById("statementLearner");

    if (!learnerSelect) {
        alert("Statement learner dropdown not found.");
        return;
    }

    learnerSelect.innerHTML =
        '<option value="">Loading learners...</option>';

    const result =
        await db
            .from("learners")
            .select("id, admission_number, full_name")
            .eq("status", "Active")
            .order("full_name");

    if (result.error) {
        alert("ERROR: " + result.error.message);
        return;
    }

    learnerSelect.innerHTML =
        '<option value="">Select Learner</option>';

    (result.data || []).forEach(function(learner) {

        const option =
            document.createElement("option");

        option.value = learner.id;

        option.textContent =
            learner.admission_number +
            " — " +
            learner.full_name;

        learnerSelect.appendChild(option);
    });

    learnerSelect.innerHTML =
    '<option value="">TEST LEARNER</option>';
}
function testStatementFunction() {
    alert("NEW FUNCTION WORKS");
}
