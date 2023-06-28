const mongoose = require('mongoose');
const bcrypt = require('bcryptjs')

const noteSchema = new mongoose.Schema ({
    date: Date,
    note: String
});

const patientSchema = new mongoose.Schema({
    patientId: mongoose.Schema.Types.ObjectId,
    notes: [noteSchema]
});

const schema = new mongoose.Schema({
    firstName: String,
    lastName: String,
    email: String,
    password: String,
    theme: String,
    patients: [patientSchema]
});

// Password comparison function
// Compares the provided password with the stored password
// Allows us to call user.verifyPassword on any returned objects
schema.methods.verifyPassword = function (password, callback) {
    bcrypt.compare(password, this.password, (err, valid) => {
        callback(err, valid)
    })
}

// Password salt factor
const SALT_FACTOR = 10

// Hash password before saving
schema.pre('save', function save(next) {
    const user = this
    // Go to next if password field has not been modified
    if (!user.isModified('password')) {
        return next()
    }

    // Automatically generate salt, and calculate hash
    bcrypt.hash(user.password, SALT_FACTOR, (err, hash) => {
        if (err) {
            return next(err)
        }
        // Replace password with hash
        user.password = hash
        next()
    })
})

const Clinician = mongoose.model('Clinician', schema, 'Clinicians')
module.exports = Clinician