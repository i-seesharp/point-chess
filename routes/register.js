const express = require("express");
const router = express.Router();
const client = require("mongodb").MongoClient;
const bcrypt = require("bcryptjs");
const url = "mongodb://localhost:27017/"

router.get("/", (req, res) => {
    res.render("register");
});

router.post("/", (req, res) => {
    var username = req.body.username;
    var password = req.body.password;
    var confirm = req.body.confirm_password;
    var errors = [];

    if(password != confirm){
        errors.push("Passwords don't match. ");
    }
    else if(username.length < 4){
        errors.push("Username cannot be less than 4 characters. ");
    }
    else if(password.length < 6){
        errors.push("Password has to be atleast 6 characters long. ");
    }
    if(errors.length > 0){
        var finalError = "";
        for(var i=0; i < errors.length; i++){
            finalError += errors[i];
        }
        req.flash("error", finalError);
        res.redirect("/register");
    }else{
        bcrypt.genSalt(10, (err, salt) => {
            if (err) throw err;
            bcrypt.hash(password, salt, (err, hash) => {
                if (err) throw err;
                password = hash;
                console.log(hash);
            });
        });

        client.connect(url, (err, db) => {
            if (err) throw err;
            var dbo = db.db("point-chess");
            var newUser = {
                username: username,
                password: password,
            };
            dbo.collection("users").findOne({username: username}, (err, user) => {
                if (err) throw err;
                if(user){
                    console.log("I was here");
                    db.close();
                    req.flash("error","Username has already been taken.");
                    res.redirect("/register");
                }else{
                    dbo.collection("users").insertOne(newUser, (err, result) => {
                        if (err) throw err;
                        console.log("I was here!")
                        db.close();
                        req.flash("success_msg", "Your account has been created.");
                        res.redirect("/login");
                    });
                }
            });
        });
    }
        
});

module.exports = router;