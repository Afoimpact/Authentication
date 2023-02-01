require('./config/db')
const app = require('express')();
const port = 4000;

const UserRoute = require('./api/user')
//post data
const bodyparser = require('express').json;
app.use(bodyparser())

app.use('/user', UserRoute)

app.listen(port, ()=>{
    console.log(`server is running on port${port}`);
}) 