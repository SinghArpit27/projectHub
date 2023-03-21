const mongoose = require("mongoose");
mongoose.connect("mongodb://127.0.0.1:27017/Project_Hub");

const express = require("express");
const app = express();

// this is for css config
app.use(express.static(__dirname + '/public'));

// for user routes
const userRoute = require('./routes/userRoute');
app.use('/',userRoute);


// for admin routes
const adminRoute = require('./routes/adminRoute');
app.use('/admin',adminRoute);

// // for product routes
// const productRoute = require('./routes/productRoute');
// app.use('/newProduct',productRoute);


app.listen(3000, function(){
    
    console.log("Server is running...");
});



//object={github link:'', pdf:'', title:'',desc:'',}