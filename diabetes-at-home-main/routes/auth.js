const passport = require('passport')
const express = require('express')
const Patient = require('../models/patient')
const router = express.Router()
// Authentication middleware
const checkAuth = (req, res, next) => {
    // If user is not authenticated via passport, redirect to login page
    if (!req.isAuthenticated()) {
        return res.redirect('/login')
    }
    // Otherwise, proceed to next middleware function
    return next()
}

// Main page which requires login to access
// Note use of authentication middleware here
router.get('/loginredirect', checkAuth, (req, res) => {
    userId = req.session.passport.user

    Patient.findById(userId, (err, user) => {
        if (user) {
            return res.redirect('/patient/' + userId + '/dashboard')
        }
        res.redirect('/clinician/' + userId + '/dashboard')
    })
})

// Login page (with failure message displayed upon login failure)
router.get('/login', (req, res) => {
    res.render('login', { flash: req.flash('error'), title: 'Login' })
})

// Handle login
router.post('/login',
    passport.authenticate('local', {
        successRedirect: '/loginredirect', failureRedirect: '/login', failureFlash: true
    })
)

// Handle logout
router.post('/logout', (req, res) => {
    req.logout()
    res.redirect('/')
})

module.exports = {
    router,
    checkAuth
}