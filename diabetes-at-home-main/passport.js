const passport = require('passport')
const Clinician = require('./models/clinician')
const Patient = require('./models/patient')
const LocalStrategy = require('passport-local').Strategy

// Updated serialize/deserialize functions
passport.serializeUser((user, done) => {
    done(undefined, user._id)
});

passport.deserializeUser((userId, done) => {
    // Check patient collection first
    patient = Patient.findById(userId, { password: 0 })
    if (patient) {
        return done(undefined, patient)
    } else {  // User is either clinician or does not exist
        Clinician.findById(userId, { password: 0 }, (err, user) => {
            if (err) {
                return done(err, undefined)
            }
            return done(undefined, user)
        })
    }
})

// Updated LocalStrategy function
passport.use(
    new LocalStrategy( async (username, password, done) => {
        // Check patient collection first
        patient = await Patient.findOne({ email: username})
        if (patient) {
            // Check password
            patient.verifyPassword(password, (err, valid) => {
                if (err) {
                    return done(undefined, false, {
                        message: 'Unknown error has occurred'
                    })
                }
                if (!valid) {
                    return done(undefined, false, {
                        message: 'Incorrect email or password',
                    })
                }
                // If user exists and password matches the hash in the database
                return done(undefined, patient)
            })
        }
        else { // User is either clinician or does not exist
            Clinician.findOne({ email: username }, {}, {}, (err, user) => {
                if (err) {
                    return done(undefined, false, {
                        message: 'Unknown error has occurred'
                    })
                }
                if (!user) {
                    return done(undefined, false, {
                        message: 'Incorrect email or password',
                    })
                }
    
                // Check password
                user.verifyPassword(password, (err, valid) => {
                    if (err) {
                        return done(undefined, false, {
                            message: 'Unknown error has occurred'
                        })
                    }
                    if (!valid) {
                        return done(undefined, false, {
                            message: 'Incorrect email or password',
                        })
                    }
                    // If user exists and password matches the hash in the database
                    return done(undefined, user)
                })
            })
        }
    })
)

module.exports = passport