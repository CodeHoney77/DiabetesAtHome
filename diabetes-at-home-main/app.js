const express = require("express");
const exphbs = require("express-handlebars");
const flash = require('express-flash')
const session = require('express-session')
const MongoStore = require('connect-mongo')
const mongooseClient = require('./models')
require("./models");

const app = express();
app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));

const hbs = exphbs.create({
  defaultLayout: "main",
  extname: "hbs",
  // create custom helpers
  helpers: {
    capitaliseFirstLetter: function (str) {
      return str.charAt(0).toUpperCase() + str.slice(1);
    },
    replaceHyphens: function (str) {
      return str.replaceAll("-", " ");
    },
    dataEntered: function (str) {
      return str != "---"
    }
  },
});

app.engine("hbs", hbs.engine);

app.set("view engine", "hbs");

// Flash messages for failed logins, and (possibly) other success/error messages
app.use(flash())

// Track authenticated users through login sessions
app.use(
  session({
      // The secret used to sign session cookies (ADD ENV VAR)
      secret: process.env.SESSION_SECRET || 'keyboard cat',
      name: 'user',
      saveUninitialized: false,
      resave: false,
      cookie: {
          sameSite: 'strict',
          httpOnly: true,
          secure: app.get('env') === 'production'
      },
      store: MongoStore.create({ clientPromise: mongooseClient }),
  })
)

if (app.get('env') === 'production') {
  app.set('trust proxy', 1); // Trust first proxy
}

// Initialise Passport.js
const passport = require('./passport')
app.use(passport.authenticate('session'))

// Load authentication router
// link to our router
const patientRouter = require("./routes/patientRouter");
const clinicianRouter = require("./routes/clinicianRouter");
app.use("/patient", patientRouter);
app.use("/clinician", clinicianRouter);

const authRouter = require('./routes/auth')
app.use(authRouter.router)

// Static pages
app.get("/", (req, res) => {
  res.render("index.hbs");
});
app.get("/about_site", (req, res) => {
  res.render("aboutSite.hbs");
});
app.get("/about_diabetes", (req, res) => {
  res.render("aboutDiabetes.hbs");
});
app.get("/login", (req, res) => {
  res.render("login.hbs");
});

// Catch all
app.get("*", (req, res) => {
  res.redirect("/");
});

app.listen(process.env.PORT || 3000, () => {
  console.log("Listening on port " + process.env.PORT + "!");
});
