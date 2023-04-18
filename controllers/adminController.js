const User = require("../models/userModel");
const bcrypt = require('bcrypt');
const randomstring = require('randomstring');
const config = require("../config/config");
const nodemailer = require("nodemailer");


const excelJS = require('exceljs');





// pass converting into hashing like encrypting
const securePassword = async (password) => {
    try {
      const passwordHash = await bcrypt.hash(password, 10);
      return passwordHash;
    } catch (error) {
      console.log(error.message);
    }
  };




// for reset password send mail
const sendResetPasswordMail = async (name, email, token) => {
    try {
      const transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 587,
        secure: false,
        requireTLS: true,
        auth: {
          user: config.emailUser,
          pass: config.emailPassword,
        },
      });
      const mailOptions = {
        from: config.emailUser,
        to: email,
        subject: "For Reset password",
        html:
          "<p>Hi " +
          name +
          ', please click here to <a href="http://localhost:3000/admin/forget-password?token=' +
          token +
          '"> Reset </a> your Password.</p>',
      };
      transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
          console.log(error);
        } else {
          console.log("Email has been sent:- ", info.response);
        }
      });
    } catch (error) {
      console.log(error.message);
    }
  };

  // for send mail
const addUserMail = async (name, email, password, user_id) => {
    try {
      const transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 587,
        secure: false,
        requireTLS: true,
        auth: {
          user: config.emailUser,
          pass: config.emailPassword,
        },
      });
      const mailOptions = {
        from: config.emailUser,
        to: email,
        subject: "You are added into iitian project hub Verify mail",
        html:
          "<p>Hi " +
          name +
          ', please click here to <a href="http://localhost:3000/verify?id=' +
          user_id +
          '"> Verify </a> your mail.</p> <br><br> <b>Email:- </b>'+email+'<br> <b>Password:- </b>'+password+'',
      };
      transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
          console.log(error);
        } else {
          console.log("Email has been sent:- ", info.response);
        }
      });
    } catch (error) {
      console.log(error.message);
    }
  };







const loadLogin = async(req,res)=>{

    try {
        
        res.render('login');

    } catch (error) {
        console.log(error.message);
    } 
}

const verifyLogin = async(req,res)=>{

    try {
        
        const email = req.body.email;
        const password = req.body.password;

        const userData = await User.findOne({email:email});
        if (userData) {

            const passwordMatch = await bcrypt.compare(password, userData.password);
            if (passwordMatch) {
                
                if (userData.is_admin === 0) {
                    res.render('login',{message:"Email and Password is incorrect"});
                } else {
                    req.session.user_id = userData._id;
                    res.redirect('/admin/home');
                }

            } else {
                res.render('login',{message:"Email and Password is incorrect"});
            }
        } else {
            res.render('login',{message:"Email and Password is incorrect"});
        }


    } catch (error) {
        console.log(error.message);
    }

}

const loadDashboard = async(req,res)=>{
    
    try {
        const userData = await User.findById({_id:req.session.user_id});
        res.render('home',{admin:userData});


    } catch (error) {
        console.log(error.message);
    }

}

const logout = async(req,res)=>{

    try {
        
        req.session.destroy();
        res.redirect('/admin');
        
    } catch (error) {
        console.log(error.message);
    }

}
const forgetLoad = async(req,res)=>{

    try {
        
        res.render('forget');

    } catch (error) {
        console.log(error.message)
    }

}
const forgetVerify = async(req,res)=>{

    try {
        
        const email = req.body.email;
        const userData = await User.findOne({email:email});
        if (userData) {
            if (userData.is_admin === 0) {
                res.render('forget',{message:"Incorrect Email Please enter valid Email"});
            } else {
                
                const randomString = randomstring.generate();
                const updatedData = await User.updateOne({email:email},{$set:{token:randomString}});
                sendResetPasswordMail(userData.name, userData.email, randomString);
                res.render('forget',{message:"Please check your mail to reset your password"});
            }
        } else {
            res.render('forget',{message:"Incorrect Email Please enter valid Email"});
        }

    } catch (error) {
        console.log(error.message);
    }

}
const forgetPasswordLoad = async(req,res)=>{

    try {
        
        // res.render('forget-password');
        const token = req.query.token;

        const tokenData = await User.findOne({token:token});

        if (tokenData) {
            
            res.render('forget-password',{user_id:tokenData._id});

        } else {
            res.render('404',{message:"Invalid Link"});
        }


    } catch (error) {
        console.log(error.message);
    }

}
const resetPassword = async(req,res)=>{

    try {
        
        const password = req.body.password;
        const user_id = req.body.user_id;

        const securePass = await securePassword(password);
        const updatedData = await User.findByIdAndUpdate({ _id:user_id }, { $set:{ password:securePass,token:'' } });

        res.redirect('/admin');

    } catch (error) {
        console.log(error.message);
    }

}

const adminDashboard = async(req,res)=>{

    try {


        var search = '';
        if (req.query.search) {
            search = req.query.search;
        }

        var page = 1;
        if (req.query.page) {
            page = req.query.page;
        }


        const limit = 4;
 

        const usersData = await User.find({
            is_admin:0,
            $or:[
                { name:{ $regex: '.*' + search + '.*',$options:'i' } },
                { email:{ $regex: '.*' + search + '.*',$options:'i' } },
                { mobile:{ $regex: '.*' + search + '.*',$options:'i' } }
            ]
        })
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .exec();

        const count = await User.find({
            is_admin:0,
            $or:[
                { name:{ $regex: '.*' + search + '.*',$options:'i' } },
                { email:{ $regex: '.*' + search + '.*',$options:'i' } },
                { mobile:{ $regex: '.*' + search + '.*',$options:'i' } }
            ]
        }).countDocuments();
        

        res.render('dashboard',{
            users:usersData,
            totalPages: Math.ceil(count/limit),
            currentPage: page
            // next:page+1,
            // previous:page-1
        });

    } catch (error) {
        console.log(error.message);
    }

}

const newUserLoad = async(req,res)=>{

    try {
        
        res.render('new-user');

    } catch (error) {
        console.log(error.message);
    }

}
const addUser = async(req,res)=>{

    try {
        
        const name = req.body.name;
        const email = req.body.email;
        const mobile = req.body.mobile;
        const image = req.file.filename;
        const password = randomstring.generate(8);

        const spassword = await securePassword(password);

        const user = new User({
            name:name,
            email:email,
            mobile:mobile,
            image:image,
            password:spassword,
            is_admin:0
        });

        const userData = await user.save();

        if (userData) {
            addUserMail(name, email, password, userData._id);
            res.redirect('/admin/dashboard');

        } else {
            res.render('new-user',{message:"Something wrong!!!"});
        }

    } catch (error) {
        console.log(error.message);
    }
}


// edit user functionality
const editUserLoad = async(req,res)=>{

    try {
        const id = req.query.id;
        const userData = await User.findById({ _id:id });
        if (userData) {
            res.render('edit-user',{user:userData});
        } else {
            res.redirect('/admin/dashboard');
        }

    } catch (error) {
        console.log(error.message);
    }

}
const updateUsers = async(req,res)=>{

    try {
        
        const userData = await User.findByIdAndUpdate({ _id:req.body.id },{ $set:{ name:req.body.name, email:req.body.email, mobile:req.body.mobile, is_varified:req.body.verify } });

        res.redirect('/admin/dashboard');


    } catch (error) {
        console.log(error.message);
    }

}

const deleteUser = async(req,res)=>{

    try {
        
        const id = req.query.id;
        await User.deleteOne({ _id:id });
        res.redirect('/admin/dashboard');

    } catch (error) {
        console.log(error.message);
    }

}


// export users data
const exportUsers = async(req,res)=>{

    try {
        
        const workbook = new excelJS.Workbook();
        const worksheet = workbook.addWorksheet("Users Data");      //Users data is the name of worksheet 
        

        worksheet.columns = [


            { header:"S no.", key:"s_no" },
            { header:"Name", key:"name" },
            { header:"Email ID", key:"email" },
            { header:"Mobile", key:"mobile" },
            { header:"Image", key:"image" },
            { header:"Is Admin", key:"is_admin" },
            { header:"Is Verified", key:"is_varified" },

        ];
        let counter = 1;

        const userData = await User.find({ is_admin:0 });

        userData.forEach((user)=>{
            user.s_no = counter;
            worksheet.addRow(user);
            counter++;
        });

        worksheet.getRow(1).eachCell((cell) => {
            cell.font = { bold:true };
        });

        res.setHeader(
            "Content-Type",
            "application/vnd.openxmlformats-officedocument.spreadsheatml.sheet"
        );
        
        res.setHeader("Content-Disposition",`attachment; filename=users.xlsx`);

        return workbook.xlsx.write(res).then(()=>{
            res.status(200);
        });

    } catch (error) {
        console.log(error.message);
    }

}



module.exports = {
    loadLogin,
    verifyLogin,
    loadDashboard,
    logout,
    forgetLoad,
    forgetVerify,
    forgetPasswordLoad,
    resetPassword,
    adminDashboard,
    newUserLoad,
    addUser,
    editUserLoad,
    updateUsers,
    deleteUser,
    exportUsers
}