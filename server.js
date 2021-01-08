const express = require("express");
const uuid = require("uuid");
const path = require("path");
const http = require("http");
const session = require("express-session");
const ejs = require("ejs");
const flash = require("connect-flash");
const bodyParser = require("body-parser");
const socketio = require("socket.io");
const passport = require("passport");

const loginRouter = require(path.join(__dirname, "routes", "login"));
const registerRouter = require(path.join(__dirname, "routes", "register"));
const logoutRouter = require(path.join(__dirname, "routes", "logout"));

const app = express();
const server = http.createServer(app);
const io = socketio(server);

const PORT = process.env.PORT || 3000;


app.use(express.static(path.join(__dirname, 'public')));
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended : true }));

app.use(session({
    secret: "pOiNtChEsS",
    resave: false,
    saveUninitialized: false,
    cookie : {
        maxAge: 1000* 60 * 60 *24 * 365
    }
}));

app.use(flash());
app.use(passport.initialize());
app.use(passport.session());

require(path.join(__dirname, "config", "passport-config.js"))(passport);

app.use((req, res, next) => {
    res.locals.user = req.user;
    res.locals.errorMsg = req.flash("error");
    res.locals.successMsg = req.flash("success_msg");
    next();
});

app.use("/login", loginRouter);
app.use("/register", registerRouter);
app.use("/logout", logoutRouter);

const socketCommunication = require(path.join(__dirname, "bin", "sockets.js"));
socketCommunication(io);

app.get("/dashboard", (req, res) => {
    console.log("Dashboard Attempt");
    if(req.isAuthenticated()){
        res.render("index");
    }else{
        res.redirect("/login");
    }
});

app.get("/", (req, res)=>{
    res.redirect("/dashboard");
});

app.get("/play", (req, res) => {
    res.render("play");
});

server.listen(PORT, () => {
    console.log("Server listening for connections on port", PORT);
})