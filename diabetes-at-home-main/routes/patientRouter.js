const express = require("express");
const { checkAuth } = require('./auth')
const DbUtils = require('../controllers/dbUtils')

// create our Router object
const patientRouter = express.Router();

// import demo controller functions
const patientController = require("../controllers/patientController");

// Authentication middleware
const checkId = (req, res, next) => {
  sessionId = req.session.passport.user.valueOf();
  urlId = req.params.id;
  // If user is not authenticated via passport, redirect to login page
  if (urlId == sessionId) {
    return next()
  }

  // Check where to redirect user
  if (DbUtils.getClinicianById(sessionId)) {
    return res.redirect('/clinician/' + sessionId + '/dashboard')
  }
  return res.redirect('/patient/' + sessionId + '/dashboard')
}

// Redirect to dashboard
patientRouter.get("/:id", (req, res) => {
  const patientId = req.params.id;
  res.redirect(patientId + "/dashboard")
})

// about pages
patientRouter.get("/:id/about_diabetes", checkAuth, checkId, patientController.aboutDiabetes);
patientRouter.get("/:id/about_site", checkAuth, checkId, patientController.aboutSite);

patientRouter.get("/:id/dashboard", checkAuth, checkId, patientController.dashboard);
patientRouter.get("/:id/history", checkAuth, checkId, patientController.history);
patientRouter.get("/:id/leaderboard", checkAuth, checkId, patientController.leaderboard);
patientRouter.get("/:id/settings", checkAuth, checkId, patientController.settings);
patientRouter.get("/:id/editprofile", checkAuth, checkId, patientController.editprofile);
// handling recording
patientRouter.get("/:id/record", checkAuth, checkId, patientController.record);

// handle the post request from record.
patientRouter.post("/:id/record/:field", checkAuth, checkId, patientController.saveData);
// handle the post request from edit profile.
patientRouter.post("/:id/editprofile/:field", checkAuth, checkId, patientController.updateprofile);

// handle theme get/post request
patientRouter.get("/:id/theme", checkAuth, checkId, patientController.getTheme);
patientRouter.post("/:id/settings/:theme", checkAuth, checkId, patientController.saveTheme);

// export the router
module.exports = patientRouter;
