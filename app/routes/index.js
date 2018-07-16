module.exports = function (app, passport) {
  // INITIALIZE MY AUTHENTICATION ROUTES
  require('./authentication')(app, passport);

  // INITIALIZE MY VIEWS ROUTES
  require('./views')(app);
}