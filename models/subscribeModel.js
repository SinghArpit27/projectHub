const mongoose = require("mongoose");

const subscribeSchema = new mongoose.Schema({
    email:{
        type:String,
        required:true
    }
});

module.exports = mongoose.model("Subscriber", subscribeSchema);