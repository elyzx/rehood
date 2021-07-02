const { Schema, model } = require("mongoose");
let mongoose = require('mongoose');
require('./Neighbourhood.model');

// TODO: Please make sure you edit the user model to whatever makes sense in this case
const userSchema = new Schema({
  name: String,
  email: String,
  password: String,
  neighbourhood: [ {
    ref: 'Neighbourhood',
    type: mongoose.Schema.Types.ObjectId
  }]
  
});

const User = model("User", userSchema);

module.exports = User;
