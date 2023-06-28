const Patient = require("../models/patient");
const Utils = require("./utils");

// Calculates the engagement rate of a patient and returns true if above a threshold (80%)
const isEngaged = (patient) => {
  const engagementRate = Utils.calcEngagementRateOnePatient(patient);
  return engagementRate >= 80;
}

const getNumToRecord = (notYetRecorded) => {
  let numToRecord = 0;
  if (notYetRecorded) {
    numToRecord = notYetRecorded.length;
  }
  return numToRecord;
};

const getRecordState = (patient) => {
  let weight = null;
  let glucose = null;
  let insulin = null;
  let exercise = null;
  let notYetRecorded = null;
  let requiredRecords = null;

  // found patient
  // fields that are not yet recorded.
  requiredRecords = Utils.getRequired(patient.requiredRecords);
  notYetRecorded = Utils.getNotYetRecorded(patient);

  if (requiredRecords == null) {
    res.send("This patient has no required records to record!");
  }
  if (notYetRecorded != null) {
    // loop through and add if need to record
    weight = notYetRecorded.find((data) => data === "weight");
    glucose = notYetRecorded.find((data) => data === "glucose");
    insulin = notYetRecorded.find((data) => data === "insulin");
    exercise = notYetRecorded.find((data) => data === "exercise");
  }
  return {
    weight: weight,
    glucose: glucose,
    insulin: insulin,
    exercise: exercise,
    weightRequired: requiredRecords.includes("weight"),
    glucoseRequired: requiredRecords.includes("glucose"),
    insulinRequired: requiredRecords.includes("insulin"),
    exerciseRequired: requiredRecords.includes("exercise"),
  };
};

const saveOneEntry = async (patient, newEntry) => {
  // Check if record for today exists
  const mostRecent = patient.records.slice(-1)[0];
  if (mostRecent && Utils.checkSameDay(mostRecent.date, newEntry.datetime)) {
    // Check if attribute not recorded today
    let alreadyExists = false;
    for (let item of mostRecent.data) {
      if (item.attribute === newEntry.attribute) {
        // Already exists
        alreadyExists = true;
        break;
      }
    }
    if (!alreadyExists) {
      // Add item to db
      await Patient.updateOne(
        { "records._id": mostRecent._id },
        { $push: { "records.$.data": newEntry } }
      );
    }
  } else {
    // Create new record for today
    const newRecord = {
      date: newEntry.datetime,
      data: [newEntry],
    };
    await Patient.updateOne(
      { _id: patient._id },
      { $push: { records: newRecord } }
    );
  }
};

const getPatientHistory = (patient) => {
  const historyLength = patient.records.length;
  let history = [];

  for (let i = historyLength - 1; i >= 0; i--) {
    const thisRecord = patient.records[i].data;

    const thisRecordDate = patient.records[i].date.toDateString();

    let historyFormatted = {
      date: thisRecordDate,
      glucose: "---",
      weight: "---",
      insulin: "---",
      exercise: "---",
    };

    for (let j = 0; j < thisRecord.length; j++) {
      const thisEntry = thisRecord[j];
      historyFormatted[thisEntry.attribute] = thisEntry.value;
    }

    history.push(historyFormatted);
  }
  return history;
};

const getTopfiveLeaderboard = (patients) => {
  let miniPatients = [];
  miniPatients = Utils.calcAllEngagementRates(patients);
  miniPatients.sort((a, b) => {
    // if they have equal engagement rate get the one who joined first
    let engageDiff = a.engagementRate - b.engagementRate;
    if (engageDiff == 0) {
      return a.joinDate - b.joinDate;
    }
    return engageDiff;
  });
  let leaderboardPatientsToDisplay = [];
  for (let i = 0; i < 5; i++) {
    leaderboardPatientsToDisplay.push(miniPatients.pop());
  }
  return leaderboardPatientsToDisplay;
};
module.exports = {
  isEngaged,
  getNumToRecord,
  getRecordState,
  saveOneEntry,
  getPatientHistory,
  getTopfiveLeaderboard,
};
