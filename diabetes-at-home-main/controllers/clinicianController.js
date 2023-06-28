const DbUtils = require("./dbUtils");
const Utils = require("./utils")
const Helpers = require("./clinicianHelpers");
const Patient = require("../models/patient");
const Clinician = require("../models/clinician");

const dashboard = async (req, res) => {
  const clinicianId = req.params.id;
  const thisClinician = await DbUtils.getClinicianById(clinicianId);
  const patientArray = await Helpers.getPatientsOfClinician(thisClinician);
  const todayRecords = await Helpers.getTodayRecords(patientArray);

  if (clinicianId) {
    res.render("clinician/dashboard.hbs", {
      layout: "clinician.hbs",
      clinicianId: clinicianId,
      patientData: patientArray,
      todayRecords: todayRecords,
    });
  } else {
    res.send("No id");
  }
};

const registerPatient = (req, res) => {
  const clinicianId = req.params.id;

  res.render("clinician/registerPatient.hbs", {
    layout: "clinician.hbs",
    clinicianId: clinicianId,
  });
};

const settings = (req, res) => {
  const clinicianId = req.params.id;

  res.render("clinician/settings.hbs", {
    layout: "clinician.hbs",
    clinicianId: clinicianId,
  });
};

const comments = async (req, res) => {
  const clinicianId = req.params.id;
  const thisClinician = await DbUtils.getClinicianById(clinicianId);
  const patientArray = await Helpers.getPatientsOfClinician(thisClinician);
  const commentEntries = await Helpers.getAllCommentEntries(patientArray);

  // sort commentEntries
  commentEntries.sort(function (a, b) {
    return b.date - a.date;
  });

  res.render("clinician/comments.hbs", {
    layout: "clinician.hbs",
    clinicianId: clinicianId,
    commentEntries: commentEntries,
  });
};

const patientView = async (req, res) => {
  const clinicianId = req.params.id;
  const patientId = req.params.patientId;
  const thisPatient = await DbUtils.getPatientById(patientId);

  const firstName = thisPatient.firstName;
  const lastName = thisPatient.lastName;
  const data = Helpers.getPatientRecords(thisPatient);

  res.render("clinician/patientView.hbs", {
    layout: "clinician.hbs",
    patientId: patientId,
    clinicianId: clinicianId,
    data: data,
    firstName: firstName,
    lastName: lastName,
  });
};

const setMessage =async (req, res) => {
  const clinicianId = req.params.id;
  const patientId = req.params.patientId;
  const thisPatient = await DbUtils.getPatientById(patientId);

  const firstName = thisPatient.firstName;
  const lastName = thisPatient.lastName;
  const supportMessage = thisPatient.supportMessage;

  res.render("clinician/setMessage.hbs", {
    layout: "clinician.hbs",
    patientId: patientId,
    clinicianId: clinicianId,
    firstName: firstName,
    lastName: lastName,
    supportMessage: supportMessage,
  });
};

const patientEdit = async(req, res) => {
  const clinicianId = req.params.id;
  const patientId = req.params.patientId;
  const thisPatient = await DbUtils.getPatientById(patientId);

  const firstName = thisPatient.firstName;
  const lastName = thisPatient.lastName;
  const thresholds = thisPatient.thresholds;
  const required = Utils.getRequired(thisPatient.requiredRecords);

  let glucoseRequired = false;
  let weightRequired = false;
  let insulinRequired = false;
  let exerciseRequired = false;
  if (required) {
    if (required.includes("glucose")) {glucoseRequired = true}
    if (required.includes("weight")) {weightRequired = true}
    if (required.includes("insulin")) {insulinRequired = true}
    if (required.includes("exercise")) {exerciseRequired = true}
  }
    
  res.render("clinician/patientEdit.hbs", {
    layout: "clinician.hbs",
    flash: req.flash('error'),
    patientId: patientId,
    clinicianId: clinicianId,
    firstName: firstName,
    lastName: lastName,
    glucoseMin: thresholds.glucose.min,
    weightMin:thresholds.weight.min,
    insulinMin: thresholds.insulin.min,
    exerciseMin: thresholds.exercise.min,
    glucoseMax: thresholds.glucose.max,
    weightMax: thresholds.weight.max,
    insulinMax: thresholds.insulin.max,
    exerciseMax:thresholds.exercise.max,
    glucoseRequired: glucoseRequired,
    weightRequired: weightRequired,
    insulinRequired: insulinRequired,
    exerciseRequired: exerciseRequired,
  });
};

// Update patient's thresholds using patientEdit post
const updateThresholds = async (req, res) => {
  const clinicianId = req.params.id;
  const patientId = req.params.patientId;
  
  err = await Helpers.updatePatientThresholds(patientId, req, res);

  if (err) {
    req.flash("error", err)
  }

  res.redirect("/clinician/" + clinicianId + "/patient/" + patientId + "/edit")
}

const updateRequired = async (req, res) => {
  const clinicianId = req.params.id;
  const patientId = req.params.patientId;

  err = await Helpers.updatePatientRequired(patientId, req, res);

  if (err) {
    req.flash("error", err)
  }

  res.redirect("/clinician/" + clinicianId + "/patient/" + patientId + "/edit")
}

const patientNotes =async (req, res) => {
  const clinicianId = req.params.id;
  const patientId = req.params.patientId;
  const thisPatient = await DbUtils.getPatientById(patientId);
  const thisClinician = await DbUtils.getClinicianById(clinicianId);
  const notes = await Helpers.getPatientNotes(thisClinician, patientId);

  const firstName = thisPatient.firstName;
  const lastName = thisPatient.lastName;

  res.render("clinician/patientNotes.hbs", {
    layout: "clinician.hbs",
    patientId: patientId,
    clinicianId: clinicianId,
    firstName: firstName,
    lastName: lastName,
    note: notes,
  });
};

const newPatient = async (req,res) => {
  const clinicianId = req.params.id;
  const firstname = req.body.firstname;
  const lastname = req.body.lastname;
  const email = req.body.email;
  const password = req.body.password;
  const screenname = req.body.screenname;
  const birthday = req.body.birthday;
  const supportmessage = req.body.supportmessage;
  const bio = req.body.bio;
  const now = new Date();

  // Create required
  const patientArrays = Helpers.createPatientArrays(req, res);
  const required = patientArrays.required
  const thresholds = patientArrays.thresholds

  //create new entry
  const newEntry = {
    firstName: firstname,
    lastName: lastname,
    email: email,
    password: password,
    screenName: screenname,
    joinDate: now,
    birthday: birthday,
    supportMessage: supportmessage,
    bio: bio,
    theme: "blue",
    requiredRecords: {
      date: now,
      required,
    },
    thresholds: thresholds,
  };
  
  //add new entry to collection
  Patient.create(newEntry,function(err, res){
    const patientID = res._id
    const newPatient = {
      patientId: patientID,
      notes: []
    };
    Clinician.findByIdAndUpdate({_id:clinicianId},{'$push':{patients: [newPatient]}},function (error, success) {})
  });

  res.redirect("/clinician/" + clinicianId + "/dashboard");

};

const saveTheme = async (req, res) => {
  const clinicianId = req.params.id;
  const selectedTheme = req.params.theme;

  const clinician = await DbUtils.getClinicianById(clinicianId);

  await Clinician.updateOne(
    { _id: clinician._id },
    { $set: { theme: selectedTheme } }
  );
  
  // Redirect back to the page.
  res.redirect("/clinician/" + clinicianId + "/settings");

}

const saveNote = async (req, res) => {
  const clinicianId = req.params.id;
  const patientId = req.params.patientId;
  const noteText = req.body.note;

  const now = new Date;

  let newNote = {};

  newNote["date"] = now;
  newNote["note"] = noteText;

  await Clinician.updateOne(
    { "patients.patientId": patientId },
    { $push: { "patients.$.notes": newNote } }
  );

  // Redirect back to the page.
  res.redirect("/clinician/" + clinicianId + "/patient/" + patientId + "/notes");
};

const getTheme = async (req, res) => {
  const clinicianId = req.params.id;

  const clinician = await DbUtils.getClinicianById(clinicianId);  
  
  res.json({ theme: clinician.theme });
};

module.exports = {
  dashboard,
  registerPatient,
  settings,
  comments,
  patientEdit,
  updateThresholds,
  patientNotes,
  patientView,
  setMessage,
  newPatient,
  getTheme,
  saveTheme,
  updateRequired,
  saveNote,
};
