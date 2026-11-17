// shared helpers used by every page

// talk to the server (method and body are optional)
async function api(url, method, body){
    let options = { method: method || "GET", headers: { "Content-Type": "application/json" } };
    if(body){ options.body = JSON.stringify(body); }
    let res = await fetch(url, options);
    return await res.json();
}

// the page each role starts on
function homeFor(role){
    if(role == "donor"){ return "donor.html"; }
    if(role == "admin"){ return "admin.html"; }
    if(role == "inspector"){ return "inspector.html"; }
    return "home.html";
}

// asks the server who is logged in (null if nobody)
async function currentUser(){
    let data = await api("/api/me");
    return data.user;
}

// call at the top of a protected page, returns the user or null
async function requireRole(role){
    let u = await currentUser();
    if(u == null){
        window.location.href = "login.html";
        return null;
    }
    if(u.role != role){
        // logged in, but this page is for the other role
        window.location.href = homeFor(u.role);
        return null;
    }
    return u;
}

async function logout(){
    await api("/api/logout", "POST");
    sessionStorage.removeItem("fid");
    window.location.href = "login.html";
}

// draws the header; links depend on who is logged in
async function showNav(){
    let u = await currentUser();
    let links = "";
    if(u != null && u.role == "ngo"){
        links += '<a href="home.html">Home</a><a href="myreg.html">My Claims</a>';
    }
    if(u != null && u.role == "donor"){
        links += '<a href="donor.html">Donate Food</a>';
    }
    if(u != null && u.role == "admin"){
        links += '<a href="admin.html">Dashboard</a>';
    }
    if(u != null && u.role == "inspector"){
        links += '<a href="inspector.html">Inspections</a>';
    }
    links += '<a href="abt.html">About us</a><a href="cntct.html">Contact us</a>';
    if(u != null){
        links += '<span class="who">'+esc(u.name)+'</span><a href="#" onclick="logout()">Logout</a>';
    }else{
        links += '<a href="login.html">Login</a>';
    }
    document.getElementById("hdr").innerHTML =
        '<div class="brand">FoodLink</div><div class="links">'+links+'</div>';
}

// ---------- helpers ----------
// stop typed text from breaking the page
function esc(t){
    return String(t).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
}

// show a date/time in a readable way
function fmt(d){
    return new Date(d).toLocaleString();
}
