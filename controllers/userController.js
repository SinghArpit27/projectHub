const User = require("../models/userModel");
const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");
const randomstring = require("randomstring");
const config = require("../config/config");
const Product = require("../models/productModel");
const { ObjectId } = require("mongodb");
// const { set } = require("../routes/userRoute");

// pass converting into hashing like encrypting
const securePassword = async (password) => {
  try {
    const passwordHash = await bcrypt.hash(password, 10);
    return passwordHash;
  } catch (error) {
    console.log(error.message);
  }
};

// for send mail
const sendVerifyMail = async (name, email, user_id) => {
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
      subject: "Verification mail",
      html:
        "<p>Hi " +
        name +
        ', please click here to <a href="http://localhost:3000/verify?id=' +
        user_id +
        '"> Verify </a> your mail.</p>',
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
        ', please click here to <a href="http://localhost:3000/forget-password?token=' +
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

const loadRegister = async (req, res) => {
  try {
    res.render("registration");
  } catch (error) {
    console.log(error.message);
  }
};

const insertUser = async (req, res) => {
  try {
    const spassword = await securePassword(req.body.password);
    const user = new User({
      name: req.body.name,
      email: req.body.email,
      mobile: req.body.mobile,
      image: req.file.filename,
      password: spassword,
      is_admin: 0,
    });

    const userData = await user.save();

    if (userData) {
      sendVerifyMail(req.body.name, req.body.email, userData._id);
      res.render("registration", {
        message: "Registration successfully done, Please verify your mail",
      });
    } else {
      res.render("registration", { message: "Registration failed..." });
    }
  } catch (error) {
    console.log(error.message);
  }
};

const verifyMail = async (req, res) => {
  try {
    const updateInfo = await User.updateOne(
      { _id: req.query.id },
      { $set: { is_varified: 1 } }
    );

    console.log(updateInfo);
    res.render("email-verified");
  } catch (error) {
    console.log(error.message);
  }
};
// User Login method begin
const loginLoad = async (req, res) => {
  try {
    res.render("login");
  } catch (error) {
    console.log(error.message);
  }
};

const verifyLogin = async (req, res) => {
  try {
    const email = req.body.email;
    const password = req.body.password;

    const userData = await User.findOne({ email: email });
    // this is for email checking
    if (userData) {
      const passwordMatch = await bcrypt.compare(password, userData.password);
      // this is for password matching
      if (passwordMatch) {
        // if password is matched then we check mail is verified or not
        if (userData.is_varified === 0) {
          res.render("login", { message: "Please verify your Email." });
        } else {
          req.session.user_id = userData._id;
          res.redirect("/home");
        }
      } else {
        res.render("login", { message: "Email and password is incorrect." });
      }
    } else {
      res.render("login", { message: "Email and password is incorrect." });
    }
  } catch (error) {
    console.log("Email : " + error.message);
  }
};

// home
const loadHome = async (req, res) => {
  try {
    const userData = await User.findById({ _id: req.session.user_id });
    // const productData = await Product.findById({ _id: req.session.product_id });
    // const productData = await Product.findById();
    // const result = await Promise.all([userData, productData]);
    res.render("home", { user: userData });
  } catch (error) {
    console.log(error.message);
  }
};

// logout
const userLogout = async (req, res) => {
  try {
    req.session.destroy();
    res.redirect("/");
  } catch (error) {
    console.log(error.message);
  }
};

// forget password code start

const forgetLoad = async (req, res) => {
  try {
    res.render("forget");
  } catch (error) {
    console.log(error.message);
  }
};

const forgetVerify = async (req, res) => {
  try {
    const email = req.body.email;
    const userData = await User.findOne({ email: email });
    if (userData) {
      if (userData.is_varified === 0) {
        res.render("forget", { message: "Please Verify Your Email" });
      } else {
        const randomString = randomstring.generate();
        const updatedData = await User.updateOne(
          { email: email },
          { $set: { token: randomString } }
        );
        sendResetPasswordMail(userData.name, userData.email, randomString);
        res.render("forget", {
          message: "Please check your mail to Reset password",
        });
      }
    } else {
      res.render("forget", { message: "Invalid Email" });
    }
  } catch (error) {
    console.log(error.message);
  }
};

const forgetPasswordLoad = async (req, res) => {
  try {
    const token = req.query.token;
    const tokenData = await User.findOne({ token: token });
    if (tokenData) {
      res.render("forget-password", { user_id: tokenData._id });
    } else {
      res.render("404", { message: "Token is Invalid" });
    }
  } catch (error) {
    console.log(error.message);
  }
};

const resetPassword = async (req, res) => {
  try {
    const password = req.body.password;
    const user_id = req.body.user_id;

    const secure_password = await securePassword(password);

    const updatedData = await User.findByIdAndUpdate(
      { _id: user_id },
      { $set: { password: secure_password, token: "" } }
    );

    res.redirect("/");
  } catch (error) {
    console.log(error.message);
  }
};
// for verification send email link
const verificationLoad = async (req, res) => {
  try {
    res.render("verification");
  } catch (error) {
    console.log(error.message);
  }
};

const sentVerificationLink = async (req, res) => {
  try {
    const email = req.body.email;
    const userData = await User.findOne({ email: email });
    if (userData) {
      sendVerifyMail(userData.name, userData.email, userData._id);

      res.render("verification", {
        message:
          "verification mail is sent in your registered mail id please check",
      });
    } else {
      res.render("verification", { message: "This email is not exist" });
    }
  } catch (error) {
    console.log(error.message);
  }
};
// user profile edit and update

const editLoad = async (req, res) => {
  try {
    const id = req.query.id;

    const userData = await User.findById({ _id: id });

    if (userData) {
      res.render("edit", { user: userData });
    } else {
      res.redirect("/home");
    }
  } catch (error) {
    console.log(error.message);
  }
};

const updateProfile = async (req, res) => {
  try {
    if (req.file) {
      const userData = await User.findByIdAndUpdate(
        { _id: req.body.user_id },
        {
          $set: {
            name: req.body.name,
            email: req.body.email,
            mobile: req.body.mobile,
            image: req.file.filename,
          },
        }
      );
    } else {
      const userData = await User.findByIdAndUpdate(
        { _id: req.body.user_id },
        {
          $set: {
            name: req.body.name,
            email: req.body.email,
            mobile: req.body.mobile,
          },
        }
      );
    }

    res.redirect("home");
  } catch (error) {
    console.log(error.message);
  }
};

const loadNewProject = async (req,res) =>{

  try {
      res.render("add-project");
  } catch (error) {
      console.log(error.message);
  }

};

// const productDetails = Product.find({});
// insert product details
const insertProductDetails = async(req, res) =>{

  try {
    
    const product = new Product({
      productTitle: req.body.productTitle,
      tutorialBy: req.body.tutorialBy,
      aboutProduct: req.body.aboutProduct,
      image: req.files.image[0].filename,
      projectCode: req.body.projectCode,
      synopsis: req.files.synopsis[0].filename,
      report: req.files.report[0].filename,
      projectDescription: req.body.projectDescription
    });

    const productData = await product.save();
    // await product.save()


      // // send data to a home page
      // productDetails.exec(function(error, data){
      //   if (error) {
      //     console.log(error);
      //   }

      //   res.render('projects', {productRecord: data});

      // });





    if (productData) {

      res.render("add-project", {
        message: "Project Added successfully done",
        productRecord: productData
      });
    } else {
      res.render("add-project", { message: "Project Adding Failed..." });
    }




  } catch (error) {
    console.log(error.message);
  }

};

const productDetails = Product.find({});
const loadProjects = async(req,res) =>{

  try {


    // const productData = await Product.findById();

      res.render("project-card",{productRecord: productDetails});
      // console.log(productRecord);
  } catch (error) {
      console.log(error.message);
  }
  


};


module.exports = {
  loadRegister,
  insertUser,
  verifyMail,
  loginLoad,
  verifyLogin,
  loadHome,
  userLogout,
  forgetLoad,
  forgetVerify,
  forgetPasswordLoad,
  resetPassword,
  verificationLoad,
  sentVerificationLink,
  editLoad,
  updateProfile,
  loadNewProject,
  insertProductDetails,
  loadProjects
};
