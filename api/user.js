const express = require('express');
const router = express.Router();

//user model
const user = require('./../models/user')
//user verification model
const verify = require('./../models/verification')
//email
const nodemailer = require('nodemailer')
//unique id
const uuid = require('uuid');
//require credentials from .env
require("dotenv").config();
//password encrypt
const bcrypt = require('bcrypt');
const verification = require('./../models/verification');
const { get } = require('mongoose');
//setting up the nodemailer transporter
let transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.AUTH_EMAIL,
        pass: process.env.AUTH_PASS,
    }
 })
//testing transporter
transporter.verify((error, success)=>{
    if(error){console.log(error)}else{console.log("success, ready for messages"); console.log(success)}
})

//to register
router.post('/register', (req, res)=>{
//to remove white space
let {name, email, password, confirmpassword} = req.body;
name = name.trim(),
email = email.trim(),
password = password.trim(),
confirmpassword = confirmpassword.trim();

if(name == "" || email =="" || password=="" || confirmpassword==""){
    res.json({
        status: "FAILED",
        message: "fields cannot be empty"
    });
} else if (!/^[a-zA-Z ]*$/.test(name)){
    res.json({
        status: "FAILED",
        message: "invalid name format"
    })
} else if (!/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(email)){
    res.json({
        status: "FAILED",
        message: "invalid email format"
    })
} else if (password !== confirmpassword){
    res.json({
        status: "FAILED",
        message: "password incorrect, reconfirm your password"
    })

} else if (password < 10){
    res.json({
        status: "FAILED",
        message: "invalid name format"
    })
} else {
    
   

    //does user already exist
    user.find({email}).then((result)=> {
        if(result.length){
            //user already exist
            res.json({
                status: "FALED",
                message: "email already exist"
            })
            
        }else {
            //authenticate to create a new user
             //hash password
            const saltRounds = 10;
             bcrypt.hash(password, saltRounds).then(hashedPassword=>{
                 const newUser= new user({
                    name, 
                    email, 
                    password: hashedPassword,
                    verification: false
                 });
                 newUser.save()
                 .then((result)=>{
                    //verifiy email
                    sendVerificationEmail(result, res)
                    
                 })
                 .catch((err)=>{
                    res.json({
                        status: "FAILED",
                        message: "registration not successful"
                    })
                 })
             }).catch(err=>{
                res.json({
                    status: "FAILED",
                    message: "error hashing password"
                })
             })
        }

    }).catch((err)=> {console.log(err)})
}
})
//verify  function
const sendVerificationEmail = ({_id, email}, res)=>{
    //url for email
    const currenturl = "http://localhost:4000/";
    const uniquestring = uuid() + _id;

    //mail option
    const mailOptions = {
        from: process.env.AUTH_EMAIL,
        to: email,
        subject: "verify your email",
        html: `<p>verify your email address to complete your account registeration</p> 
        <p>link <b>expires in 5 hours</b>click
        <a href=${currenturl + "user/verify/" + _id + "/" + uniquestring}>here</a> to proceed</p>`,
    }
    //hashing the unique string
    
    const saltRounds=10;
    bcrypt
    .hash(uniquestring, saltRounds)
    .then((hashUniqueString)=>{
         //assign values to the verification
         const newVerification = new Verification({
            userId: _id,
            uniqueString: hashUniqueString,
            createdAt: Date.now(),
            expiresAt: Date.now() + 21000000 
         })
         newVerification
         .save()
         .then(()=>{
            transporter
            .sendMail(mailOptions)
            .then(()=>{
                //email sent and verified
                res.json({
                    status: "Pending",
                    message: "verification email sent"
                })
                 
            })
            .catch((error)=>{
                console.log(error)
                res.json({
                    status: "FAILED",
                    message: "verification failed"
                })
         })
         .catch((error)=>{
            console.log(error)
            res.json({
                status: "FAILED",
                message: "error occured while saving email credential"
            })

         })
    })
    .catch(()=>{
        res.json({
            status: "FAILED",
            message: "error occured while hashing the email credential"
        })
    })
})}

//verifying from email
router.get('/verify/:userId/:uniquestring', (req, res)=>{
    let{userId, uniquestring}=req.params;
    verification
    .find({userId})
    .then((result)=>{
        //result is an array
        if (result.length>0){
            //user verfication exists
        const {expiresAt}=result[0]
        const hashUniqueString = result[0].uniquestring
        if(expiresAt<Date.now()){
            //record is expired and will be deleted
            verification
            .deleteOne({ userId})
            .then(result=>{
                user
                .deleteOne({_id: userId})
                .then(()=>{
                    res.json({
                        status: "FAILED",
                        message: "link expired, kindly sign in again"
                    })
                })
                
            })
            .catch((error)=>{
                console.log(error)
                res.json({
                    status: "FAILED",
                    message: "error occured while deleting user verification"
                })
                
            })
        }else{
            //valid verification record exists
            //comparing the hashedunique string
            bcrypt
            .compare(uniquestring, hashUniqueString)
            .then(result=>{
                if(result){
                    //string match
                    user
                    .updateOne({_id: userId}, {verification: true})
                    .then(()=>{
                        verification
                        .deleteOne()
                        .then(()=>{
                            
                                res.json({
                                    status: "success",
                                    message: "user verified"
                                })
                            
                        })
                        .catch(error=>{
                            console.log(error)
                            res.json({
                                status: "FAILED",
                                message: "error finalizing verification"
                            })
                        })
                    })
                    .catch(error=>{
                        console.log(error)
                        res.json({
                            status: "FAILED",
                            message: "error updating verification user"
                        })
                    })
                }else{
                    //details exists, but incorrect verification details passed
                    res.json({
                        status: "FAILED",
                        message: "incorrect verification details, check your inbox"
                    })
                }
            })
            .catch(error=>{
                res.json({
                    status: "FAILED",
                    message: "error occured while comparing the unique string"
                })
            })

        }

        }else{
            res.json({
                status: "FAILED",
                message: "user verification is empty or already verified"
            })
        }
    })
    .catch((error)=>{
        console.log(error)
        res.json({
            status: "FAILED",
            message: "error"
        })

    })
})

//for login
router.post('/login', (req, res)=>{
    let {email, password} = req.body;
email = email.trim(),
password = password.trim();

if(email =="" || password==""){
    res.json({
        status: "FAILED",
        message: "field cannot be empty"
    });
}else{
    //start the login process
    //check for existing user
    user.find({email})
    .then((data)=>{
        if(data.length){
            //since data exists
            //check for verfifcation status of user first before allowing login
            if(!data[0].verify){
                    res.json({
                        status: "FAILED",
                        message: "user email is yet to be verified. kindly check your inbox"
                    })
                
            }else{
                const hashedPassword=data[0].password;
            //compare the password with the existing one in the db
            
            bcrypt.compare(password, hashedPassword)
            
            .then((result) => {
                if(result){
                    //means password matches
                    res.json({
                        status: "SUCCESS",
                        message: "password match, login successful",
                        data: data
                    })
                }else {
                    res.json({
                        status: "FAILED",
                        message: "unable to login, confirm credentials"
                    })
                }
            })
            .catch((err)=>{
                res.json({
                    status: "FAILED",
                    message: "unable to login"
                })
            })
            }
            
        }else {res.json({
            status: "FAILED",
            message: "invalid credentials"
        })
    }
    }).catch((err)=>{
        res.json({
            status:"FAILED",
            message:"error"
        })
    })
}
})


module.exports = router;







