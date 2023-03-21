const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
    productTitle:{
        type:String,
        required:true
    },
    tutorialBy:{
        type:String,
        required:true
    },
    aboutProduct:{
        type:String,
        required:true
    },
    image:{
        type:String,
        required:true
    },

    projectCode:{
        type:String,
        required:true
    },
    synopsis:{
        type:String,
        required:true
    },
    report:{
        type:String,
        required:true
    },
    projectDescription:{
        type:String,
        required:true
    }

});

module.exports = mongoose.model('Product',productSchema);