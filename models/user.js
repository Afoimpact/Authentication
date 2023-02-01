const mongoose = require('mongoose')

//to organise structure of data going into the database
const Schema = mongoose.Schema;

const userSchema = new Schema({
    name: String,
    email: String,
    password: String,
    confirmpassword: String,
    verification: Boolean

    
});

const user = mongoose.model('user', userSchema)
module.exports = mongoose.model('user')