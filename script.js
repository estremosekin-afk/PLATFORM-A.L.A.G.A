/* ---------------- DATA ---------------- */

let residents = [];
let notifications = [];

/* ---------------- SMS API ---------------- */

async function sendRealSMS(phone, message){

const apiKey = "1697|2hlOHLNmvN7dFRrAynP2pIlzddhrrYbGqJ9M986L1e6978ed";

try{

const response = await fetch("https://dashboard.philsms.com/api/v3/sms/send",{
method:"POST",
headers:{
"Content-Type":"application/json",
"Authorization":"Bearer " + apiKey
},
body: JSON.stringify({
recipient: phone,
sender_id: "PhilSMS",
type: "plain",
message: message
})
});

const data = await response.json();
console.log(data);

}catch(err){
console.error(err);
}

}

/* ---------------- SEND SMS ---------------- */

function sendSMS(){

const barangay = document.getElementById("smsBarangay").value;
const message = document.getElementById("smsMessage").value;

if(!message.trim()){
alert("Please enter a message");
return;
}

let recipients = residents;

if(barangay){
recipients = residents.filter(r=>r.barangay===barangay);
}

if(recipients.length===0){
alert("No residents found");
return;
}

for(const r of recipients){
sendRealSMS(r.phone,message);
}

alert("SMS sent to "+recipients.length+" residents");

}

/* ---------------- REGISTER RESIDENT ---------------- */

async function registerResident(){

const name = document.getElementById("residentName").value;
const phone = document.getElementById("residentPhone").value;
const barangay = document.getElementById("residentBarangay").value;
const address = document.getElementById("residentAddress").value;

if(!name || !phone || !barangay){
alert("Please fill all required fields");
return;
}

const {addDoc,collection} = await import(
"https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js"
);

await addDoc(collection(window.db,"residents"),{
name:name,
phone:phone,
barangay:barangay,
address:address,
registered:new Date().toISOString()
});

alert("Registration successful!");

loadResidents();

}

/* ---------------- LOAD RESIDENTS ---------------- */

async function loadResidents(){

const {getDocs,collection} = await import(
"https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js"
);

const querySnapshot = await getDocs(collection(window.db,"residents"));

residents=[];

querySnapshot.forEach((doc)=>{

residents.push({
id:doc.id,
...doc.data()
});

});

renderResidents();

}

/* ---------------- RENDER RESIDENT TABLE ---------------- */

function renderResidents(){

const tbody=document.getElementById("residentsTableBody");

if(!tbody)return;

tbody.innerHTML="";

residents.forEach(r=>{

tbody.innerHTML+=`
<tr>
<td>${r.name}</td>
<td>${r.phone}</td>
<td>${r.barangay}</td>
<td>${r.registered}</td>
</tr>
`;

});

}

/* ---------------- LOGIN SYSTEM ---------------- */

function showLogin(){
document.getElementById("loginModal").classList.remove("hidden");
}

function closeLogin(){
document.getElementById("loginModal").classList.add("hidden");
}

function verifyOTP(){

const otp=document.getElementById("otpCode").value;

if(otp==="123456"){

document.getElementById("landingPage").classList.add("hidden");
document.getElementById("dashboard").classList.remove("hidden");

loadResidents();

}else{
alert("Invalid OTP. Use 123456 for demo.");
}

}

/* ---------------- NAVIGATION ---------------- */

function showResidentRegistration(){

document.getElementById("landingPage").classList.add("hidden");
document.getElementById("residentRegistration").classList.remove("hidden");

}

function backToHome(){

document.getElementById("residentRegistration").classList.add("hidden");
document.getElementById("landingPage").classList.remove("hidden");

}

function logout(){

document.getElementById("dashboard").classList.add("hidden");
document.getElementById("landingPage").classList.remove("hidden");

}