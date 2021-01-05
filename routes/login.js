const express = require("express");
const router = express.Router();
const passport = require("passport");




router.get("/", (req, res) => {
    console.log(req.isAuthenticated());
    res.render("login");
});

router.post("/", passport.authenticate("local", {
    failureRedirect: "/login",
    successRedirect: "/dashboard",
    failureFlash: true
}));

module.exports = router;