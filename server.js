const express = require("express");
const session = require("express-session");
const mongoose = require("mongoose");
const path = require("path");

const User = require("./models/User");
const Food = require("./models/Food");

const app = express();
const PORT = 3000;
const MONGO_URL = "mongodb://127.0.0.1:27017/foodlink";

app.use(express.json());
app.use(session({ secret: "foodlink-secret", resave: false, saveUninitialized: false }));
app.use(express.static(path.join(__dirname, "public")));


// ---------- helpers ----------

// only let the given role use a route
function needRole(role) {
    return function (req, res, next) {
        if (!req.session.user) {
            return res.status(401).json({ error: "Please login" });
        }
        if (req.session.user.role != role) {
            return res.status(403).json({ error: "Not allowed" });
        }
        next();
    };
}

// anything past its expiry time becomes "expired"
async function markExpired() {
    await Food.updateMany(
        { status: "available", expires: { $lt: new Date() } },
        { status: "expired" }
    );
}


// ---------- login ----------

app.post("/api/login", async function (req, res) {
    const found = await User.findOne({ username: req.body.username, password: req.body.password });
    if (found == null) {
        return res.json({ ok: false });
    }
    req.session.user = { username: found.username, name: found.name, role: found.role };
    res.json({ ok: true, role: found.role });
});

app.post("/api/logout", function (req, res) {
    req.session.destroy(function () {
        res.json({ ok: true });
    });
});

// who is logged in (user is null if nobody)
app.get("/api/me", function (req, res) {
    res.json({ user: req.session.user || null });
});


// ---------- donor ----------

// add new food (starts as pending, inspector must approve)
app.post("/api/food", needRole("donor"), async function (req, res) {
    const b = req.body;
    if (new Date(b.expires) <= new Date()) {
        return res.json({ ok: false, error: "Expiry time must be in the future." });
    }
    await Food.create({
        name: b.name,
        servings: Number(b.servings),
        veg: b.veg,
        nature: b.nature,
        expires: new Date(b.expires),
        address: b.address,
        donor: b.donor,
        donorUser: req.session.user.username,
        phone: b.phone,
        status: "available",
        approval: "pending"
    });
    res.json({ ok: true });
});

// the donor's own listings
app.get("/api/food/mine", needRole("donor"), async function (req, res) {
    await markExpired();
    const list = await Food.find({ donorUser: req.session.user.username }).select("-code");
    res.json(list);
});

// donor types the code the ngo shows
app.post("/api/food/:id/pickup", needRole("donor"), async function (req, res) {
    const f = await Food.findOne({ _id: req.params.id, donorUser: req.session.user.username });
    if (f == null || f.status != "claimed") {
        return res.json({ ok: false, error: "Listing not found." });
    }
    if (req.body.code != f.code) {
        return res.json({ ok: false, error: "Wrong code." });
    }
    f.status = "picked_up";
    await f.save();
    res.json({ ok: true });
});

app.delete("/api/food/:id", needRole("donor"), async function (req, res) {
    await Food.deleteOne({ _id: req.params.id, donorUser: req.session.user.username });
    res.json({ ok: true });
});


// ---------- ngo ----------

// only food approved by the inspector is shown
app.get("/api/food/approved", needRole("ngo"), async function (req, res) {
    await markExpired();
    const list = await Food.find({ approval: "approved" }).select("-code -claimer -claimedBy");
    res.json(list);
});

// claim a food and get the 4 digit code
app.post("/api/food/:id/claim", needRole("ngo"), async function (req, res) {
    const code = String(Math.floor(1000 + Math.random() * 9000));

    // this only works if the food is still available, so two people cannot claim the same food
    const f = await Food.findOneAndUpdate(
        { _id: req.params.id, status: "available", approval: "approved", expires: { $gt: new Date() } },
        {
            status: "claimed",
            code: code,
            claimedAt: new Date(),
            claimedBy: req.session.user.username,
            claimer: {
                name: req.body.name,
                phone: req.body.phone,
                mail: req.body.mail,
                kind: req.body.kind
            }
        },
        { new: true }
    );
    if (f == null) {
        return res.json({ ok: false });
    }
    res.json({ ok: true });
});

// everything this ngo has claimed
app.get("/api/claims", needRole("ngo"), async function (req, res) {
    const list = await Food.find({ claimedBy: req.session.user.username }).sort({ claimedAt: -1 });
    res.json(list);
});


// ---------- inspector ----------

app.get("/api/inspections", needRole("inspector"), async function (req, res) {
    await markExpired();
    const pending = await Food.find({ approval: "pending", status: "available" }).select("-code");
    const done = await Food.find({ approval: { $in: ["approved", "rejected"] } }).select("-code");
    res.json({ pending: pending, done: done });
});

app.post("/api/food/:id/inspect", needRole("inspector"), async function (req, res) {
    const note = String(req.body.note || "").trim();
    if (!req.body.ok && note == "") {
        return res.json({ ok: false, error: "Please write a reason to reject." });
    }
    await Food.findByIdAndUpdate(req.params.id, {
        approval: req.body.ok ? "approved" : "rejected",
        inspectNote: note,
        inspectedAt: new Date()
    });
    res.json({ ok: true });
});


// ---------- admin ----------

app.get("/api/admin/food", needRole("admin"), async function (req, res) {
    await markExpired();
    const list = await Food.find().select("-code");
    res.json(list);
});

app.delete("/api/admin/food/:id", needRole("admin"), async function (req, res) {
    await Food.findByIdAndDelete(req.params.id);
    res.json({ ok: true });
});

// send back to the inspector (only if nobody has claimed it)
app.post("/api/admin/food/:id/reinspect", needRole("admin"), async function (req, res) {
    await Food.updateOne(
        { _id: req.params.id, status: "available" },
        { approval: "pending", inspectNote: "" }
    );
    res.json({ ok: true });
});


// ---------- sample data (only the first time) ----------

async function addSampleData() {
    if (await User.countDocuments() == 0) {
        await User.insertMany([
            { username: "donor",     password: "donor123",   role: "donor",     name: "Green Mess" },
            { username: "ngo",       password: "ngo123",     role: "ngo",       name: "Hope NGO" },
            { username: "admin",     password: "admin123",   role: "admin",     name: "Admin" },
            { username: "inspector", password: "inspect123", role: "inspector", name: "Inspector" }
        ]);
    }

    if (await Food.countDocuments() == 0) {
        const h = 3600000;
        await Food.insertMany([
            { name: "Veg Biryani",   servings: 20, veg: true,  nature: "Freshly cooked", expires: new Date(Date.now() + 3 * h), address: "Hostel Mess, Block A", donor: "Hostel Mess", donorUser: "donor", phone: "9876543210", status: "available", approval: "approved" },
            { name: "Bread Packets", servings: 40, veg: true,  nature: "Packaged",       expires: new Date(Date.now() + 8 * h), address: "Canteen, Main Gate",   donor: "Canteen",     donorUser: "donor", phone: "9876543211", status: "available", approval: "approved" },
            { name: "Chicken Curry", servings: 15, veg: false, nature: "Freshly cooked", expires: new Date(Date.now() + 2 * h), address: "Fest Ground, Stall 4", donor: "Fest Team",   donorUser: "donor", phone: "9876543212", status: "available", approval: "pending" }
        ]);
    }
}


// ---------- start ----------

mongoose.connect(MONGO_URL)
    .then(async function () {
        console.log("MongoDB connected");
        await addSampleData();
        app.listen(PORT, function () {
            console.log("FoodLink running at http://localhost:" + PORT);
        });
    })
    .catch(function (err) {
        console.log("Could not connect to MongoDB:", err.message);
    });
