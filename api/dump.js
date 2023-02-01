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
