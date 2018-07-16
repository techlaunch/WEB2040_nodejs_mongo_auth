// load the things we need
var mongoose = require('mongoose');

// define the schema for our user model
var addressSchema = mongoose.Schema({
  name: String,
  street_1: String,
  street_2: String,
  city: String,
  state: String,
  zip_code: String,
  country: String,
  user: String,
});

// create the model and expose it to our app
module.exports = mongoose.model('Address', addressSchema);