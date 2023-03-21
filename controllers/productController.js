
const config = require("../config/config");




const loadNewProject = async (req,res) =>{

    try {
        res.render("add-project");
    } catch (error) {
        console.log(error.message);
    }

};



module.exports = {
    loadNewProject
};