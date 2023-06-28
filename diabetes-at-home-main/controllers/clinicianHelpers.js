const Utils = require("./utils");
const DbUtils = require("./dbUtils");
const dataDisplayNames = require("../models/dataDisplayNames");
const Clinician = require("../models/clinician");
const Patient = require("../models/patient")
var ObjectId = require('mongoose').ObjectID;

const getPatientsOfClinician = async (thisClinician) => {
  let patientIdArray = Utils.getPatientIds(thisClinician);
  let patientArray = [];
  for (let i = 0; i < patientIdArray.length; i++) {
    const thisPatient = await DbUtils.getPatientById(patientIdArray[i]);
    patientArray.push(thisPatient);
  }
  return patientArray;
};

const getPatientNotes = async(clinician, patient)=>{
  
  let notesArray =[];
  
  const clinicianprof = await Clinician.findOne({
    _id: clinician,
  }).lean();

  for(let i=0; i<clinicianprof.patients.length; i++){
    if(clinicianprof.patients[i].patientId.toString() === patient){
      notesArray = clinicianprof.patients[i].notes;
    }
  }
  for (let i=0;i<notesArray.length;i++){
    notesArray[i].date = Utils.dateToDisplay(notesArray[i].date);
  }
  
  return notesArray;

};

// Takes all patient data and formats it into relevant data
// Output is used to display patient data on clinician/dashboard.hbs
const getTodayRecords = async (patientArray) => {
  const todayDate = new Date();
  let todayRecords = [];
  for (let i = 0; i < patientArray.length; i++) {
    const thisPatient = await DbUtils.getPatientById(patientArray[i]._id);
    const thisPatientRecord = thisPatient.records.slice(-1)[0];
    let thisPatientData = []
    if (thisPatientRecord) {
      thisPatientData = thisPatientRecord.data;
    }
    
    const thisPatientRequiredRecords = Utils.getRequired(
      thisPatient.requiredRecords
    );
    let dataFormatted = {
      patientId: thisPatient._id,
      firstName: thisPatient.firstName,
      lastName: thisPatient.lastName,
      glucose: "N/A",
      weight: "N/A",
      insulin: "N/A",
      exercise: "N/A",
      glucoseOutThresh: false,
      weightOutThresh: false,
      insulinOutThresh: false,
      exerciseThresh: false,
    };
    // marking required records that are not recorded yet.
    for (let k = 0; k < thisPatientRequiredRecords.length; k++) {
      dataFormatted[thisPatientRequiredRecords[k]] = "---";
    }
    // inputing data fields and determining if it is out of threshold.
    for (let j = 0; j < thisPatientData.length; j++) {
      if (Utils.checkSameDay(thisPatientRecord.date, todayDate)) {
        let value = -1;
        let thresholds = thisPatient.thresholds;
        switch (thisPatientData[j].attribute) {
          case "glucose":
            dataFormatted.glucose = thisPatientData[j].value;
            value = thisPatientData[j].value;
            dataFormatted.glucoseOutThresh =
              value < thresholds.glucose.min || value > thresholds.glucose.max;
            break;
          case "weight":
            dataFormatted.weight = thisPatientData[j].value;
            value = thisPatientData[j].value;
            dataFormatted.weightOutThresh =
              value < thresholds.weight.min || value > thresholds.weight.max;
            break;
          case "insulin":
            dataFormatted.insulin = thisPatientData[j].value;
            value = thisPatientData[j].value;
            dataFormatted.insulinOutThresh =
              value < thresholds.insulin.min || value > thresholds.insulin.max;
            break;
          case "exercise":
            dataFormatted.exercise = thisPatientData[j].value;
            value = thisPatientData[j].value;
            dataFormatted.exerciseOutThresh =
              value < thresholds.exercise.min ||
              value > thresholds.exercise.max;
            break;
        }
      }
    }
    todayRecords.push(dataFormatted);
  }
  return todayRecords;
};

// Get all comments and supporting data from an array of patients for /clinician/:id/comments. Comments older than maxAge days are ignored
const getAllCommentEntries = async (patientArray, maxAge = 30) => {
  const now = new Date();
  let entries = [];

  for (let patient of patientArray) {
    recentRecords = patient.records.slice(-1 * maxAge);
    let patientName = patient.firstName.concat(" ", patient.lastName);

    for (let record of recentRecords) {
      if (Utils.getDayDiff(now, record.date) > maxAge) continue; // Records too old

      for (let data of record.data) {
        if (data.comment) {
          // Create entry object
          let newEntry = {
            patientId: patient._id,
            name: patientName,
            data: dataDisplayNames[data.attribute],
            value: data.value,
            date: data.datetime,
            dateString: Utils.dateToDisplay(data.datetime),
            comment: data.comment,
          };
          entries.push(newEntry);
        }
      }
    }
  }

  return entries;
};



const getPatientRecords = (patient) => {
  const datalength = patient.records.length;
  let data = [];

  for (let i = datalength - 1; i >= 0; i--) {
    const thisRecord = patient.records[i].data;
    const required = Utils.getRequired(patient.requiredRecords);

    const thisRecordDate = patient.records[i].date.toDateString();

    let dataformatted = {
      date: thisRecordDate,
      glucose: "N/A",
      weight: "N/A",
      insulin: "N/A",
      exercise: "N/A",
      glucoseOutThresh: false,
      weightOutThresh: false,
      insulinOutThresh: false,
      exerciseThresh: false,
    };

    for (let j = 0; j < required.length; j++) {
      dataformatted[required[j]] = "---";
    }

    for (let j = 0; j < thisRecord.length; j++) {
      const thisEntry = thisRecord[j];
      dataformatted[thisEntry.attribute] = thisEntry.value;
      switch (thisEntry.attribute) {
        case "glucose":
          dataformatted.glucoseOutThresh =
            thisEntry.value < patient.thresholds.glucose.min ||
            thisEntry.value > patient.thresholds.glucose.max;
          break;
        case "weight":
          dataformatted.weightOutThresh =
            thisEntry.value < patient.thresholds.weight.min ||
            thisEntry.value > patient.thresholds.weight.max;
          break;
        case "insulin":
          dataformatted.insulinOutThresh =
            thisEntry.value < patient.thresholds.insulin.min ||
            thisEntry.value > patient.thresholds.insulin.max;
          break;
        case "exercise":
          dataformatted.exerciseOutThresh =
            thisEntry.value < patient.thresholds.exercise.min ||
            thisEntry.value > patient.thresholds.exercise.max;
          break;
      }
    }

    data.push(dataformatted);
  }
  return data;
};

// Update patient's thresholds using patientEdit post
const updatePatientThresholds = async (patientId, req, res) => {
  const patient = await Patient.findById(patientId)

  const thresholdTypes = [patient.thresholds.glucose, patient.thresholds.insulin, patient.thresholds.weight, patient.thresholds.exercise]
  const postThresholds = [{min: req.body.glucoseMin, max: req.body.glucoseMax}, {min: req.body.insulinMin, max: req.body.insulinMax},
    {min: req.body.weightMin, max: req.body.weightMax}, {min: req.body.exerciseMin, max: req.body.exerciseMax}]

  // Update local version of patient.thresholds
  for (let i = 0; i < thresholdTypes.length; i++) {
    if (postThresholds[i].min) {
      thresholdTypes[i].min = postThresholds[i].min
    }
    if (postThresholds[i].max) {
      thresholdTypes[i].max = postThresholds[i].max
    }
  }

  // Check that all mins are less than max
  for (let thresholdType of thresholdTypes) {
    if (thresholdType.min > thresholdType.max) {
      return "Minimum greater than maximum in one or more fields"
    }
  }

  // Update db
  await patient.save();
}

const updatePatientRequired = async (patientId, req, res) => {

  let newRequired = {
    date: new Date(),
    required: []
  }

  if (req.body.glucoseRequired) {newRequired.required.push("glucose")}
  if (req.body.weightRequired) {newRequired.required.push("weight")}
  if (req.body.insulinRequired) {newRequired.required.push("insulin")}
  if (req.body.exerciseRequired) {newRequired.required.push("exercise")}

  await Patient.updateOne(
    { _id: patientId },
    { $push: { requiredRecords: newRequired } }
  );

}

// Create a new patient's required records and thresholds from submitted form
const createPatientArrays = (req, res) => {
  const gmin = req.body.minGlucose;
  const gmax = req.body.maxGlucose;

  const wmin = req.body.minWeight;
  const wmax = req.body.maxWeight;

  const imin = req.body.minInsulin;
  const imax = req.body.maxInsulin;

  const emin = req.body.minExercise;
  const emax = req.body.maxExercise;

  var required = [];
  let thresholds = {
    glucose: {min: 0, max: 0},
    weight: {min: 0, max: 0},
    insulin: {min: 0, max: 0},
    exercise: {min: 0, max: 0}
  }

  //Create required records and thresholds
  if (gmin == '' && gmax == '') {
  } else {
    var glucose = {min: gmin, max:gmax};
    required.push("glucose")
    thresholds.glucose = glucose
  };
  if (wmin == '' && wmax == '') {
  } else {
    var weight = {min: wmin, max:wmax};
    required.push("weight")
    thresholds.weight = weight
  };
  if (imin == '' && imax == '') {
  } else {
    var insulin = {min: imin, max:imax};
    required.push("insulin")
    thresholds.insulin = insulin
  };
  if (emin == '' && emax == '') {
  } else {
    var exercise = {min: emin, max:emax};
    required.push("exercise")
    thresholds.exercise = exercise
  };

  return {required: required, thresholds: thresholds}
}

module.exports = {
  getPatientsOfClinician,
  getTodayRecords,
  getAllCommentEntries,
  getPatientRecords,
  getPatientNotes,
  updatePatientThresholds,
  updatePatientRequired,
  createPatientArrays,
};
