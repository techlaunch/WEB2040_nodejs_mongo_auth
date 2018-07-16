module.exports = function (app, passport) {
  var nodemailer = require('nodemailer');
  var User = require('../models/user');
  var asynq = require('async');
  var crypto = require('crypto');

  app.post('/signup', passport.authenticate('local-signup', {
    successRedirect: '/login', // redirect to the secure profile section
    failureRedirect: '/signup', // redirect back to the signup page if there is an error
    failureFlash: true // allow flash messages
  }));

  app.post('/login', passport.authenticate('local-login', {
    successRedirect: '/profile', // redirect to the secure profile section
    failureRedirect: '/login', // redirect back to the signup page if there is an error
    failureFlash: true // allow flash messages
  }));

  app.post('/update-profile', passport.authenticate('local-profile-update', {
    successRedirect: '/update-profile',
    failureRedirect: '/update-profile', 
    failureFlash: true // allow flash messages
  }));

  // =============================================================================
  // CONFIRM EMAIL              ==================================================
  // =============================================================================

  app.get('/email-confirmation/:emailToken', function (req, res) {
    var token = req.params.emailToken;
    console.log(token);
    asynq.waterfall([
      function (done) {
        User.findOne({ 'emailConfirmationToken': token },
          function (err, user) {
            if (!user) {
              req.flash('signupMessage', 'No user found')
              return res.redirect('/signup');
            }

            //Set the emailConfirmed to true.
            user.emailConfirmed = true;
            user.emailConfirmationToken = undefined;

            user.save(function (err) {
              if (err) {
                req.flash('signupMessage', 'Database error')
                return res.redirect('/signup');
              }
              done(err, user);
            });
          }
        );
      },
      function (user, done) {
        var smtpTransport = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: 'fviclass@gmail.com',
            pass: 'fviclass2017'
          }
        });
        var mailOptions = {
          to: user.email,
          from: 'Email Confirmed',
          subject: 'Your email has been confirmed.',
          text: 'Hello,\n\n' +
            'This is a confirmation that the email for your account ' + user.email + ' has been confirmed.\n'
        };
        smtpTransport.sendMail(mailOptions);

        req.flash('loginMessage', 'Email confirmed')
        return res.redirect('/login');
      }
    ], function (err) {
      if (err) return err;
      console.log('Email Confirmed');
    });
  });

  // show the recover form
  app.post('/password-recovery', function (req, res, next) {
    asynq.waterfall([
      function (done) {
        crypto.randomBytes(20, function (err, buf) {
          var token = buf.toString('hex');
          done(err, token);
        });
      },
      function (token, done) {
        User.findOne({ 'email': req.body.email }, function (err, user) {

          if (!user) {
            req.flash('passwordRecoveryMessage', 'No user found with that email.')
            return res.redirect('/password-recovery');
          }

          user.resetPasswordToken = token;
          user.resetPasswordExpires = Date.now() + 3600000; // 1 hour

          user.save(function (err) {
            done(err, token, user);
          });
        });
      },
      function (token, user, done) {
        var smtpTransport = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: 'fviclass@gmail.com',
            pass: 'fviclass2017'
          }
        });
        var mailOptions = {
          to: user.email,
          from: 'Password Recovery',
          subject: 'Password Reset',
          html: 'You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n' +
            'Please click on the following link, or paste this into your browser to complete the process:\n\n' +
            'http://' + req.headers.host + '/password-reset/' + token + '\n\n' +
            'Verification Code: ' + token + '\n\n' +
            'If you did not request this, please ignore this email and your password will remain unchanged.\n'
        };

        smtpTransport.sendMail(mailOptions, function (err) {
          req.flash('passwordRecoveryMessage', 'An e-mail has been sent to ' + user.email + ' with further instructions.')
          return res.redirect('/password-recovery');
          done(err, 'done');
        });
      }
    ], function (err) {
      if (err) return next(err);
      console.log('password reset email sent');
    });
  });

  app.get('/password-reset/:token', function (req, res) {
    User.findOne({ 'resetPasswordToken': req.params.token, 'resetPasswordExpires': { $gt: Date.now() } },
      function (err, user) {
        if (!user) {
          req.flash('passwordRecoveryMessage', 'No user found with that email.');
          return res.redirect('/password-recovery');
        }
        else {
          req.flash('passwordResetMessage', 'You can now change your password')
          res.render('password_reset.ejs', { message: req.flash('passwordResetMessage') });
        }

      });
  });

  app.post('/password-reset/:token', function (req, res) {
    asynq.waterfall([
      function (done) {
        User.findOne({
          'resetPasswordToken': req.params.token, 'resetPasswordExpires': { $gt: Date.now() }
        },
          function (err, user) {
            if (!user) {
              req.flash('passwordRecoveryMessage', 'No user found with that email.')
              return res.redirect('/password-recovery');
            }
            else if (req.body.new_password !== req.body.new_password_confirmation){
              req.flash('passwordResetMessage', 'Passwords do not match.')
              res.render('password_reset.ejs', { message: req.flash('passwordResetMessage') });
            }
            else {
              user.password = user.generateHash(req.body.new_password);
              user.resetPasswordToken = undefined;
              user.resetPasswordExpires = undefined;

              user.save(function (err) {
                req.logIn(user, function (err) {
                  done(err, user);
                });
              });
            }
          });
      },
      function (user, done) {
        var smtpTransport = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: 'fviclass@gmail.com',
            pass: 'fviclass2017'
          }
        });
        var mailOptions = {
          to: user.email,
          from: 'Password Changed',
          subject: 'Your password has been changed',
          text: 'Hello,\n\n' +
            'This is a confirmation that the password for your account ' + user.email + ' has just been changed.\n'
        };
        smtpTransport.sendMail(mailOptions, function (err) {
          req.flash('loginMessage', 'Your password was succesfully reseted');
          return res.redirect('/login');
          done(err);
        });
      }
    ], function (err) {
      console.log('password changed');
    });
  });

}