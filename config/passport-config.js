const LocalStrategy = require("passport-local").Strategy;
const client = require("mongodb").MongoClient;
const bcrypt = require("bcryptjs");
const {ObjectId} = require('mongodb');

const url = "mongodb://localhost:27017/";



var passportStrategy = (passport) => {
    passport.use(new LocalStrategy({usernameField : "username"}, (username, password, done) => {
        client.connect(url, (err, db) => {
            if (err) throw err;
            var dbo = db.db("point-chess");
            var query = {username : username};
            console.log("Reached");

            dbo.collection("users").findOne(query, (err, user) => {
                if (err) return done(err);
                if(!user){
                    return done(null, false, {message: "There exists no user with that username"});
                }else{
                    bcrypt.compare(password, user.password, (err, res) => {
                        if (err) throw err;
                        if(res == true){
                            console.log("correct pass");
                            console.log(user);
                            return done(null, user);
                        }else{
                            console.log("here");
                            return done(null, false, {message: "Incorrect Password"});
                        }
                    });
                }
                db.close();
            });
        });
    }));

    passport.serializeUser((user, done) => {
        console.log("serialize");
        console.log(user);
        return done(null, user._id);
    });

    passport.deserializeUser((id, done) => {
        client.connect(url, (err, db) => {
            if (err) throw err;
            var dbo = db.db("point-chess");
            var query = {_id : ObjectId(id)};
            console.log("Query : ", query);
            dbo.collection("users").findOne(query, (err, user) => {
                if (err) throw err;
                console.log("deserialize");
                console.log(user)
                return done(null, user);
            });
        });
    });
}

module.exports = passportStrategy;