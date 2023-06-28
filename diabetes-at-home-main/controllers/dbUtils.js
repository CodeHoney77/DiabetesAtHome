const Patient = require("../models/patient");
const Clinician = require("../models/clinician");
// Searches db for patient with patientId
const getPatientById = async (patientId) => {
  const patient = await Patient.findOne({ _id: patientId }).lean();

  if (patient) {
    return patient;
  }
};

const getClinicianById = async (clinicianId) => {
  const clinician = await Clinician.findOne({
    _id: clinicianId,
  }).lean();

  if (clinician) {
    return clinician;
  }
};

const getAllPatients = async (next) => {
  try {
    const patients = await Patient.find().lean();
    return patients;
  } catch (err) {
    return next(err);
  }
};

module.exports = {
  getPatientById,
  getClinicianById,
  getAllPatients,
};
