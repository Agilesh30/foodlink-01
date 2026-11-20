// shared helpers used by every page

// ── Global loader ──────────────────────────────────────────────────────────────
function _getLoader(){
    var el = document.getElementById("fl-loader");
    if(!el && document.body){
        el = document.createElement("div");
        el.id = "fl-loader";
        el.innerHTML = '<div class="fl-spinner-box"><div class="fl-spinner"></div><span class="fl-spinner-label" id="fl-label">Please wait...</span></div>';
        document.body.appendChild(el);
    }
    return el;
}

var _loaderSafetyTimer = null;

function _loaderShow(msg){
    var el = _getLoader();
    var lb = document.getElementById("fl-label");
    if(el){ el.classList.add("active"); }
    if(lb){ lb.textContent = msg || "Please wait..."; }
    // Safety: always hide after 8 seconds in case something goes wrong
    clearTimeout(_loaderSafetyTimer);
    _loaderSafetyTimer = setTimeout(_loaderHide, 8000);
}

function _loaderHide(){
    clearTimeout(_loaderSafetyTimer);
    var el = document.getElementById("fl-loader");
    if(el){ el.classList.remove("active"); }
}

// talk to the server (method and body are optional)
async function api(url, method, body){
    // Skip loader for silent background session checks
    var silent = (!method || method === "GET") && url === "/api/me";

    if(!silent){
        var label = "Please wait...";
        if(method === "DELETE")                             label = "Removing...";
        if(method === "POST")                               label = "Saving...";
        if(url && url.includes("/login"))                   label = "Logging in...";
        if(url && url.includes("/register"))                label = "Creating account...";
        if(url && url.includes("/claim"))                   label = "Claiming...";
        if(url && url.includes("/inspect"))                 label = "Submitting decision...";
        if(url && url.includes("/assign"))                  label = "Assigning inspector...";
        if(url && url.includes("/pass"))                    label = "Passing task...";
        if(url && url.includes("/pickup"))                  label = "Confirming pickup...";
        if(url && url.includes("/forgot-password"))         label = "Sending reset link...";
        if(url && url.includes("/reset-password"))          label = "Updating password...";
        if(url && url.includes("/food") && method === "POST" && !url.includes("/inspect") && !url.includes("/claim") && !url.includes("/pickup") && !url.includes("/pass")) label = "Adding listing...";
        _loaderShow(label);
    }

    try {
        var options = { method: method || "GET", headers: { "Content-Type": "application/json" } };
        if(body){ options.body = JSON.stringify(body); }
        var res = await fetch(url, options);
        return await res.json();
    } catch (err) {
        console.error("Network error connecting to API:", err);
        return { ok: false, error: "Cannot connect to server. Ensure 'npm start' is running and open http://localhost:3000" };
    } finally {
        if(!silent){ _loaderHide(); }
    }
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
    return (data && data.user) ? data.user : null;
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
