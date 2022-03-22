const express = require("express");
const passport = require("passport");
const path = require("path");
const cookieParser = require("cookie-parser");
const logger = require("morgan");

const indexRouter = require("./routes/index");
const authRouter = require("./routes/auth");
const airdropRouter = require("./routes/airdrop");
const oneRouter = require("./routes/one");
const helmet = require("helmet");
const app = express();
require("./boot/db")();
require("./boot/auth")();

// Configure view engine to render EJS templates.
app.set("views", __dirname + "/views");
app.set("view engine", "ejs");
app.use(helmet());

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));
// session setup
//
// This sequence of middleware is necessary for login sessions.  The first
// middleware loads session data and makes it available at `req.session`.  The
// next lines initialize Passport and authenticate the request based on session
// data.  If session data contains a logged in user, the user is set at
// `req.user`.
app.use(
  require("cookie-session")({
    secret: process.env["COOKIESESSIONSECRET"],
    resave: false,
    saveUninitialized: false,
  })
);
app.use(passport.initialize());
app.use(passport.session());

app.use("/", indexRouter);
app.use("/", authRouter);
app.use("/airdrop", airdropRouter);
app.use("/one", oneRouter);
module.exports = app;
