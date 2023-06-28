const dataDisplayNames = require("../models/dataDisplayNames");

// Checks if two Date objects have the same date (ignores times)
const checkSameDay = (date1, date2) => {
  return (
    date1.getDate() === date2.getDate() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getFullYear() === date2.getFullYear()
  );
};

// Returns the most recent array of required health data from Patient.requiredRecords
const getRequired = (requiredRecords) => {
  const currentRequired = requiredRecords.slice(-1)[0];
  const required = currentRequired.required;
  return required;
};

// Returns an array of required data not yet recorded today by Patient. Not in display form.
const getNotYetRecorded = (patient) => {
  const notYetRecorded = getRequired(patient.requiredRecords).slice(); // Start with array of required records
  const mostRecent = patient.records.slice(-1)[0];

  if (mostRecent && checkSameDay(mostRecent.date, new Date())) {
    // Some data has been recorded today - remove each from notYetRecorded
    for (let record of mostRecent.data) {
      recordedAttribute = record.attribute;
      let index = notYetRecorded.indexOf(recordedAttribute);
      if (index !== -1) {
        notYetRecorded.splice(index, 1);
      }
    }
  }
  return notYetRecorded;
};

// Converts an array of health data types (glucose, insulin, etc.) to display format
const toDisplay = (data) => {
  for (let i = 0; i < data.length; i++) {
    if (dataDisplayNames[data[i]]) {
      data[i] = dataDisplayNames[data[i]];
    }
  }
  return data;
};

/* calculate the difference between two dates in days(always return positive number) */
const diffInDays = (date1, date2) => {
  // normalize dates to UTC (avoids timezone issues)
  const utc1 = Date.UTC(date1.getFullYear(), date1.getMonth(), date1.getDate());
  const utc2 = Date.UTC(date2.getFullYear(), date2.getMonth(), date2.getDate());

  // calculate absolute difference in time in milliseconds
  const diffTime = Math.abs(utc2 - utc1);
  // constant to convert milliseconds into days
  const millisecondsIntoDays = 1000 * 60 * 60 * 24;
  const diffDays = Math.floor(diffTime / millisecondsIntoDays);
  return diffDays;
};

const calcEngagementRateOnePatient = (patient) => {
  const joinDate = patient.joinDate;
  const todayDate = new Date();
  const timeDifferenceInDays = diffInDays(joinDate, todayDate);
  let engagedNumDays = patient.records.length;
  let engagementRate = 0;
  if (timeDifferenceInDays == 0) {
    // joined today, and made at least one entry.
    if (engagedNumDays > 0) {
      engagementRate = 1;
    } else {
      // joined today and made no entries.
      engagementRate = 0;
    }
  } else {
    engagementRate = engagedNumDays / timeDifferenceInDays;
  }
  /* currently if nothing was recorded that day, no recordSchema is created in the patient.records array
      so, if there is a record within the records array, we can know for sure that something was 
      recorded that day. thus we only check patient.records array and no need to check the 
      individual recordSchema.data array.*/
  // returning a percentage
  return (engagementRate * 100).toFixed(2);
};

/* calculates all patient engagement rates and returns mini patient objects consisting of:
    Patient = { username, engagementRate, joinDate }*/

const calcAllEngagementRates = (patients) => {
  /* making new objects that only contains username, engagementRate, and joinDate.
     so we don't leak private info? or carry around useless info.*/
  // we calc first then make small patient //let miniPatient = patients.map(({ firstName, }))
  let miniPatients = [];
  for (let i = 0; i < patients.length; i++) {
    // calculate engagement rate, then add it to the patient. this is local data array.
    let engagementRate = 0;
    engagementRate = calcEngagementRateOnePatient(patients[i]);
    patients[i].engagementRate = engagementRate;
  }
  miniPatients = patients.map(({ screenName, engagementRate, joinDate }) => ({
    screenName,
    engagementRate,
    joinDate,
  }));
  for (let i = 0; i < miniPatients.length; i++) {
    miniPatients[i].joinDate = miniPatients[i].joinDate.toDateString();
  }
  return miniPatients;
};

// Get number of days between two date objects (ceiling)
const getDayDiff = (date1, date2) => {
  return Math.ceil(Math.abs(date2 - date1) / (1000 * 60 * 60 * 24));
};

// Convert date object to string of form dd/mm/yyyy h/mm/ss am/pm, in local timezone
const dateToDisplay = (date) => {
  return date.toLocaleDateString().concat(" ", date.toLocaleTimeString());
};

const getPatientIds = (thisClinician) => {
  const patientIds = thisClinician.patients;
  let patientIdArray = [];
  for (let i = 0; i < patientIds.length; i++) {
    patientIdArray.push(patientIds[i].patientId);
  }
  return patientIdArray;
};
module.exports = {
  checkSameDay,
  getRequired,
  getNotYetRecorded,
  toDisplay,
  diffInDays,
  calcEngagementRateOnePatient,
  calcAllEngagementRates,
  getDayDiff,
  dateToDisplay,
  getPatientIds,
};
