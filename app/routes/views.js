module.exports = function (app) {

  // =====================================
  // HOME PAGE (with login links) ========
  // =====================================
  app.get('/', function (req, res) {
    if(req.user) {
      res.redirect('/profile');
    }
    else {
      // var v = {
      //   fname: 'Frank',
      //   lname: 'Veloz'
      // };
       
      // var s = `
      //   <div>
      //     <h2> {{ fname }} {{ lname }} Techlaunching in </h2>
      //     <%= function(){
      //       var s =''; 
      //       for(var i = 10; i--;){
      //         s+='<div>'+i+'</div>';
      //       }; 
      //       return s;
      //     } %>
      //   </div>
      // `;

      // function interprate(s) {
      //   let operations = s.replace(/\n|\r|\s{2,}/g, ' ')
      //     .replace(/\{\{(\s*\w+\s*)\}\}/g, (m, c) => v[c.trim()])
      //     .replace(/<%=(.*)%>/g, (m, f) => eval("(" + f + ")")());

      //   console.log('operations ', operations);

      //   return operations;
      // }

      // res.send(interprate(s));
      res.render('index.ejs'); // load the index.ejs file
    }
  });

  // =====================================
  // LOGIN ===============================
  // =====================================
  // show the login form
  app.get('/login', function (req, res) {
    // render the page and pass in any flash data if it exists
    res.render('login.ejs', { message: req.flash('loginMessage') });
  });

  // process the login form
  // app.post('/login', do all our passport stuff here);

  // =====================================
  // SIGNUP ==============================
  // =====================================
  // show the signup form
  app.get('/signup', function (req, res) {
    // render the page and pass in any flash data if it exists
    res.render('signup.ejs', { message: req.flash('signupMessage') });
  });

  // process the signup form
  // app.post('/signup', do all our passport stuff here);

  // =====================================
  // PROFILE SECTION =====================
  // =====================================
  // we will want this protected so you have to be logged in to visit
  // we will use route middleware to verify this (the isLoggedIn function)
  app.get('/profile', isLoggedIn, function (req, res) {
    res.render('profile.ejs', {
      user: req.user // get the user out of session and pass to template
    });
  });

  // =====================================
  // LOGOUT ==============================
  // =====================================
  app.get('/logout', function (req, res) {
    req.logout();
    res.redirect('/');
  });

  app.get('/password-recovery', function (req, res) {
    res.render('password_recovery.ejs', { message: req.flash('passwordRecoveryMessage') });
  });

  app.get('/update-profile', isLoggedIn, function (req, res) {
    res.render('update_profile.ejs', { 
      user: req.user,
      message: req.flash('updateProfileMessage') 
    });
  });

  app.get('*', function (req, res) {
    res.render('404.ejs');
  });

};

// route middleware to make sure a user is logged in
function isLoggedIn(req, res, next) {
  // if user is authenticated in the session, carry on 
  if (req.isAuthenticated())
    return next();

  // if they aren't redirect them to the home page
  res.redirect('/');
}