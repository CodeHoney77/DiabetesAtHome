const express = require("express");
const { checkAuth } = require('./auth')
const DbUtils = require('../controllers/dbUtils')

// create our Router object
const clinicianRouter = express.Router();

// import demo controller functions
const clinicianController = require("../controllers/clinicianController");

// Authentication middleware
const checkId = (req, res, next) => {
  sessionId = req.session.passport.user.valueOf();
  urlId = req.params.id;
  // If user is not authenticated via passport, redirect to login page
  if (urlId == sessionId) {
    return next()
  }
  
  // Check where to redirect user
  if (DbUtils.getPatientById(sessionId)) {
    return res.redirect('/patient/' + sessionId + '/dashboard')
  }
  return res.redirect('/clinician/' + sessionId + '/dashboard')
}

// Redirect to dashboard
clinicianRouter.get("/:id/", (req, res) => {
  const clinicianId = req.params.id;
  res.redirect(clinicianId + "/dashboard");
});

clinicianRouter.get("/:id/dashboard", checkAuth, checkId, clinicianController.dashboard);
clinicianRouter.get(
  "/:id/register_patient",
  checkAuth,
  checkId,
  clinicianController.registerPatient
);
// handle the post request from registerPatient.
clinicianRouter.post("/:id/register_patient/:field", clinicianController.newPatient);

clinicianRouter.get("/:id/settings", checkAuth, checkId, clinicianController.settings);
clinicianRouter.get("/:id/comments", checkAuth, checkId, clinicianController.comments);

clinicianRouter.get(
  "/:id/patient/:patientId/view",
  checkAuth,
  checkId,
  clinicianController.patientView
);

// Edit Patient
clinicianRouter.get(
  "/:id/patient/:patientId/edit",
  checkAuth,
  checkId,
  clinicianController.patientEdit
);
clinicianRouter.post("/:id/patient/:patientId/edit/required",
  checkAuth,
  checkId,
  clinicianController.updateRequired
)
clinicianRouter.post("/:id/patient/:patientId/edit/thresholds",
  checkAuth,
  checkId,
  clinicianController.updateThresholds
)

clinicianRouter.get(
  "/:id/patient/:patientId/notes",
  checkAuth,
  checkId,
  clinicianController.patientNotes
);

clinicianRouter.post("/:id/patient/:patientId/notes/add", checkAuth, checkId, clinicianController.saveNote);

clinicianRouter.get(
  "/:id/patient/:patientId/setmessage",
  checkAuth,
  checkId,
  clinicianController.setMessage
);

// Handle theme get/post request
clinicianRouter.get("/:id/theme", checkAuth, checkId, clinicianController.getTheme);
clinicianRouter.post("/:id/settings/:theme", checkAuth, checkId, clinicianController.saveTheme);

// export the router
module.exports = clinicianRouter;
