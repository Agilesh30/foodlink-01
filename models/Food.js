const mongoose = require("mongoose");

const foodSchema = new mongoose.Schema({
    name: String,
    servings: Number,
    veg: Boolean,
    nature: String,            // Freshly cooked / Packaged
    expires: Date,
    address: String,
    donor: String,             // donor name shown on the pages
    donorUser: String,         // username of the donor who added it
    phone: String,
    status: { type: String, default: "available" },   // available, claimed, picked_up, expired
    approval: { type: String, default: "pending" },   // pending, approved, rejected
    inspectNote: String,
    inspectedAt: Date,
    code: String,              // 4 digit pickup code
    claimedAt: Date,
    claimedBy: String,         // username of the ngo who claimed it
    claimer: {
        name: String,
        phone: String,
        mail: String,
        kind: String           // NGO / Individual / Student
    }
});

module.exports = mongoose.model("Food", foodSchema);
