const Patient = require("../models/patient");
const Utils = require("./utils");
const DbUtils = require("./dbUtils");
const Helpers = require("./patientHelpers");

const dashboard = async (req, res) => {
  const patientId = req.params.id;
  const patient = await DbUtils.getPatientById(patientId);
  const isEngaged = Helpers.isEngaged(patient);

  if (!patient) {
    return res.redirect("/");
  }

  const clinicianMessage = patient.supportMessage;
  let notYetRecorded = Utils.getNotYetRecorded(patient);
  notYetRecorded = Utils.toDisplay(notYetRecorded);
  let numToRecord = Helpers.getNumToRecord(notYetRecorded);

  if (patientId) {
    res.render("patient/dashboard.hbs", {
      layout: "patient.hbs",
      patientId: patientId,
      clinicianMessage: clinicianMessage,
      notYetRecorded: notYetRecorded,
      numToRecord: numToRecord,
      isEngaged: isEngaged,
    });
  } else {
    res.send("No id");
  }
};

/* renders the record.hbs for recording data. finds patient by id and 
   finds required records needed to be recorded, and compares them to currently 
   recorded fields for the current date, greying out fields that are not required or 
   already recorded for the current date.
*/
const record = async (req, res) => {
  const patientId = req.params.id;

  const patient = await DbUtils.getPatientById(patientId);
  if (!patient) {
    res.redirect("/");
  }
  const isEngaged = Helpers.isEngaged(patient);

  const recordState = Helpers.getRecordState(patient);

  res.render("patient/record.hbs", {
    layout: "patient.hbs",
    patientId: patientId,
    weight: recordState.weight,
    glucose: recordState.glucose,
    insulin: recordState.insulin,
    exercise: recordState.exercise,
    weightRequired: recordState.weightRequired,
    glucoseRequired: recordState.glucoseRequired,
    insulinRequired: recordState.insulinRequired,
    exerciseRequired: recordState.exerciseRequired,
    isEngaged: isEngaged,
  });
};

const saveData = async (req, res) => {
  const patientId = req.params.id;
  const fieldName = req.params.field;

  const now = new Date();

  // Create recordObject
  const value = Number(req.body.value);
  const comment = req.body.comment;
  const newEntry = {
    attribute: fieldName,
    value: value,
    comment: comment,
    datetime: now,
  };

  const patient = await DbUtils.getPatientById(patientId);

  await Helpers.saveOneEntry(patient, newEntry);
  // Redirect back to the page.
  res.redirect("/patient/" + patientId + "/record");
};

const saveTheme = async (req, res) => {
  const patientId = req.params.id;
  const selectedTheme = req.params.theme;

  const patient = await DbUtils.getPatientById(patientId);

  await Patient.updateOne(
    { _id: patient._id },
    { $set: { theme: selectedTheme } }
  );
  
  // Redirect back to the page.
  res.redirect("/patient/" + patientId + "/settings");

}

const getTheme = async (req, res) => {
  const patientId = req.params.id;

  const patient = await DbUtils.getPatientById(patientId);
  
  res.json({ theme: patient.theme });
};

// All past history of patient's records, sorted by most recent
const history = async (req, res) => {
  const patientId = req.params.id;
  const thisPatient = await DbUtils.getPatientById(patientId);
  const isEngaged = Helpers.isEngaged(thisPatient);
  const history = Helpers.getPatientHistory(thisPatient);

  res.render("patient/history.hbs", {
    layout: "patient.hbs",
    patientId: patientId,
    data: history,
    isEngaged: isEngaged,
  });
};

const leaderboard = async (req, res) => {
  const patientId = req.params.id;
  const patient = await DbUtils.getPatientById(patientId);
  const isEngaged = Helpers.isEngaged(patient);

  const patients = await Patient.find({});
  const leaderboardPatientsToDisplay = Helpers.getTopfiveLeaderboard(patients);
  res.render("patient/leaderboard.hbs", {
    layout: "patient.hbs",
    patientId: patientId,
    patients: leaderboardPatientsToDisplay,
    isEngaged: isEngaged,
  });
};

const updateprofile = async(req, res) => {
  const patientId = req.params.id;

  const screenname = req.body.screenname;
  const bio = req.body.bio;
  const password = req.body.password;

  if(!screenname){
  }else{
    Patient.findByIdAndUpdate({_id: patientId}, {screenName: screenname}, function(err, res){})
  };

  if(!bio){
  }else{
    Patient.findByIdAndUpdate({_id: patientId}, {bio: bio}, function(err, res){})
  };

  if(!password){
  }else{
    Patient.findOneAndUpdate({_id: patientId}, {password: password}, function(err, res){})
    //Patient.save({password: password})
  };

  res.redirect("/patient/" + patientId + "/dashboard");
};

const settings = async (req, res) => {
  const patientId = req.params.id;
  const patient = await DbUtils.getPatientById(patientId);
  const isEngaged = Helpers.isEngaged(patient);

  res.render("patient/settings.hbs", {
    layout: "patient.hbs",
    patientId: patientId,
    isEngaged: isEngaged,
  });
};

const editprofile = async (req, res) => {
  const patientId = req.params.id;
  const patient = await DbUtils.getPatientById(patientId);
  const isEngaged = Helpers.isEngaged(patient);

  res.render("patient/editprofile.hbs", {
    layout: "patient.hbs",
    patientId: patientId,
    isEngaged: isEngaged,
  });
};

const aboutDiabetes = async (req, res) => {
  const patientId = req.params.id;
  const patient = await DbUtils.getPatientById(patientId);
  const isEngaged = Helpers.isEngaged(patient);

  res.render("aboutDiabetes.hbs", {
    layout: "patient.hbs",
    patientId: patientId,
    isEngaged: isEngaged,
  });
};

const aboutSite = async (req, res) => {
  const patientId = req.params.id;
  const patient = await DbUtils.getPatientById(patientId);
  const isEngaged = Helpers.isEngaged(patient);
  
  res.render("aboutSite.hbs", {
    layout: "patient.hbs",
    patientId: patientId,
    isEngaged: isEngaged,
  });
};

module.exports = {
  dashboard,
  record,
  saveData,
  saveTheme,
  getTheme,
  history,
  leaderboard,
  settings,
  saveData,
  aboutDiabetes,
  aboutSite,
  editprofile,
  updateprofile,
};
