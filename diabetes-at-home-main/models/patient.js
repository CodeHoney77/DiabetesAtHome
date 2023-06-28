const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const requiredRecordSchema = new mongoose.Schema({
  date: Date,
  required: [String],
});

const recordObjectSchema = new mongoose.Schema({
  attribute: String,
  value: Number,
  comment: String,
  datetime: Date,
});

const recordSchema = new mongoose.Schema({
  date: Date,
  data: [recordObjectSchema],
});

const thresholdObjectSchema = new mongoose.Schema({
  min: Number,
  max: Number,
});

const thresholdSchema = new mongoose.Schema({
  glucose: thresholdObjectSchema,
  weight: thresholdObjectSchema,
  insulin: thresholdObjectSchema,
  exercise: thresholdObjectSchema,
});

const schema = new mongoose.Schema({
  firstName: String,
  lastName: String,
  email: String,
  password: String,
  screenName: String,
  theme: String,
  joinDate: Date,
  birthday: Date,
  supportMessage: String,
  bio: String,
  requiredRecords: [requiredRecordSchema],
  thresholds: thresholdSchema,
  records: [recordSchema],
});

// Password comparison function
// Compares the provided password with the stored password
// Allows us to call user.verifyPassword on any returned objects
schema.methods.verifyPassword = function (password, callback) {
  bcrypt.compare(password, this.password, (err, valid) => {
    callback(err, valid);
  });
};

// Password salt factor
const SALT_FACTOR = 10;

// Hash password before saving
schema.pre("save", function save(next) {
  const user = this;
  // Go to next if password field has not been modified
  if (!user.isModified("password")) {
    return next();
  }

  // Automatically generate salt, and calculate hash
  bcrypt.hash(user.password, SALT_FACTOR, (err, hash) => {
    if (err) {
      return next(err);
    }
    // Replace password with hash
    user.password = hash;
    next();
  });
});

schema.pre('findOneAndUpdate', async function (next) {
    try {
        if (this._update.password) {
            const hashed = await bcrypt.hash(this._update.password, 10)
            this._update.password = hashed;
        }
        next();
    } catch (err) {
        return next(err);
    }
});


const Patient = mongoose.model('Patient', schema, 'Patients')
module.exports = Patient
