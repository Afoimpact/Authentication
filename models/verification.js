const mongoose = require('mongoose')

//to organise structure of data going into the database
const Schema = mongoose.Schema;

const verificationSchema = new Schema({
    userId: String,
    uniqueString: String,
    createdAt: Date,
    expiresAt: Date
    

    
});

const user = mongoose.model('verification', verificationSchema)
module.exports = mongoose.model('verification')