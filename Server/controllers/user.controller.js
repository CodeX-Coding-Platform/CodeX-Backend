const User = require("../models/user.model.js");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const handlebars = require("handlebars");
const fs = require("fs");
const path = require("path");
let domains = require("../util/email");
const { google } = require("googleapis");
const OAuth2 = google.auth.OAuth2;
const encrypt = require("../encrypt.js");
const { v4: uuidv4 } = require("uuid");
const {
  auth,
} = require("googleapis/build/src/apis/abusiveexperiencereport/index.js");
const { response } = require("express");

let clientAddress = process.env.clientAddress;
let emailDomains = domains.domains;

const responseUtil = require("../services/responseUtil");

// Retrieve and return all users from the database.
exports.findAll = async (req, res) => {
  try {
    const users = await User.find({});
    return responseUtil.sendResponse(res,true,users,"Users fetched successfully",200);
  } catch(error) {
    return responseUtil.sendResponse(res,false,null,"error occurred while retrieving users" + error.message,400);
  }
};

// Find a single user with a username
exports.findOne = async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username });
    return responseUtil.sendResponse(res,true,user,"User fetched successfully",200);
  } catch(error) {
    return responseUtil.sendResponse(res,false,null,"error occurred while retrieving user" + error.message,400);
  }
};

// Find a single user with a username
exports.findOnePublic = async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username });
    return responseUtil.sendResponse(res,true,user,"User fetched successfully",200);
  } catch(error) {
    return responseUtil.sendResponse(res,false,null,"error occurred while retrieving user" + error.message,400);
  }
};

// Find the branch with a username
exports.findBranch = async (req, res) => {
  try {
    const user = await User.findOne(
      { username: req.params.username },
      { username: 1, name: 1, branch: 1 }
    );
    if (!user) {
      return res.status(404).send({
        success: false,
        message: "User not found with username " + req.params.username,
      });
    }
    let userData = {
      username: user.username.toUpperCase(),
      name: user.name,
      branch: user.branch,
      imgUrl: "../../Client/images/try logo.png",
    };
    return res.status(200).send({
      success: true,
      data: userData,
    });
  } catch (err) {
    return res.status(500).send({
      success: false,
      message:
        "Error retrieving user with id " +
        req.params.username +
        " with error " +
        err.message,
    });
  }
};

// Create and Save a new user
exports.create = (req, res) => {
  // Validate request

  if (req.body.confirmPassword) {
    req.body.password2 = req.body.confirmPassword;
  }
  if (
    req.body.email === undefined ||
    req.body.username === undefined ||
    req.body.password === undefined ||
    req.body.name === undefined ||
    req.body.branch === undefined
  ) {
    return res.status(400).send({
      success: false,
      message: "details can not be empty!",
    });
  }

  if (req.body.password !== req.body.password2) {
    return res.status(400).send({
      success: false,
      message: "Check your password again!",
    });
  }

  if (req.body.username.length === 10) {
    atSign = req.body.email.indexOf("@") + 1;

    if (
      emailDomains.indexOf(
        req.body.email.slice(atSign, req.body.email.length)
      ) === -1
    ) {
      return res.status(400).send({
        success: false,
        message:
          "We do not support this email provider, please try another email ID.",
      });
    }

    let token =
      Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15);
    // Create a user
    const user = new User({
      username: req.body.username,
      name: req.body.name,
      password: req.body.password,
      name: req.body.name,
      email: req.body.email,
      branch: req.body.branch,
      verifyToken: token,
    });

    // Save user in the database
    user
      .save()
      .then((data) => {
        data.success = true;
        mail(user).catch(console.error);
        return responseUtil.sendResponse(res,true,user,"User created successfully",200);
      })
      .catch((err) => {
        err.success = false;
        err.message1 = err.message;
        err.message = "";
        if (err.message1.includes("username")) {
          err.message = err.message + "Username is already taken. \n";
        }
        if (err.message1.includes("email")) {
          err.message = err.message + "Email is already taken. \n";
        }
        return responseUtil.sendResponse(res,false,nul,"User creation failed due to"+err.message,500);
      });

    // Gen token & send email here
    async function mail(user) {
      var readHTMLFile = async function (path, callback) {
        fs.readFile(path, { encoding: "utf-8" }, function (err, html) {
          if (err) {
            callback(err);
          } else {
            callback(null, html);
          }
        });
      };

      let htmlPath = path.join(__dirname, "../util/verifytemplate.html");
      readHTMLFile(htmlPath, function (err, html) {
        if (err) {
          console.log(err);
        }
        // Oauth2 set up
        const oauth2Client = new OAuth2(
          process.env.OAuthClientID, // ClientID
          process.env.OAuthClientSecret, // Client Secret
          "https://developers.google.com/oauthplayground" // Redirect URL
        );
        oauth2Client.setCredentials({
          refresh_token: process.env.OAuthRefreshToken,
        });
        const accessToken = oauth2Client.getAccessToken();
        const smtpTransport = nodemailer.createTransport({
          service: "gmail",
          secure: true,
          auth: {
            type: "OAuth2",
            user: "klhcode@gmail.com",
            clientId: process.env.OAuthClientID,
            clientSecret: process.env.OAuthClientSecret,
            refreshToken: process.env.OAuthRefreshToken,
            accessToken: accessToken,
          },
          tls: {
            rejectUnauthorized: false,
          },
        });

        // Generate Handlebars template
        var template = handlebars.compile(html);
        var replacements = {
          name: user.name,
          username: user.username.toLowerCase(),
          email: user.email,
          password: user.password,
          token: user.verifyToken,
          clientUrl: clientAddress,
        };
        var htmlToSend = template(replacements);

        const mailOptions = {
          from: "klhcode@gmail.com",
          to: user.email,
          subject: "Your Verfication Code - KLHCode",
          generateTextFromHTML: true,
          html: htmlToSend,
        };

        smtpTransport.sendMail(mailOptions, (error, response) => {
          if (error) {
            console.log(error);
          }
          smtpTransport.close();
        });
      });
    }
  } else {
    return res.status(400).send({
      success: false,
      message: "Please enter a valid roll number!",
    });
  }
};

// Update a user identified by the username in the request
exports.update = (req, res) => {
  if (req.body.username === undefined || req.body.password === undefined) {
    return res.status(400).send({
      success: false,
      message: "User content can not be empty",
    });
  }

  // Find user and update it with the request body
  User.findOneAndUpdate(
    { username: req.body.username },
    {
      $set: {
        username: req.body.username,
        password: req.body.password,
      },
    },
    { new: true },
    (err, doc) => {
      if (err) {
        console.log(err);
      }
    }
  )
    .then((user) => {
      if (!user) {
        return responseUtil.sendResponse(res,false,null,"User not found with username  " + req.params.username,404);
      }
      return responseUtil.sendResponse(res,true,user,"User found with username  " + req.params.username,200);
    })
    .catch((err) => {
      return responseUtil.sendResponse(res,false,null,"User not found with username  " + req.params.username+" due to"+err.message,404);
    });
};

exports.updateOne = async (req, res) => {
  // 1
  if (
    req.body.email === undefined ||
    req.body.newPassword === undefined ||
    req.body.password === undefined ||
    req.body.name === undefined
  ) {
    return responseUtil.sendResponse(res,false,null,"details can not be empty!",404);
  }

  // 2
  atSign = req.body.email.indexOf("@") + 1;
  if (
    emailDomains.indexOf(
      req.body.email.slice(atSign, req.body.email.length)
    ) === -1
  ) {
    return responseUtil.sendResponse(res,false,null,"We do not support this email provider, please try another email ID.",404);
  }

  // 3
  User.find({ username: req.params.username })
    .then(async (user) => {
      if (!user) {
        return responseUtil.sendResponse(res,false,null,"User not found with username " + req.params.username,404);
      }
      if (user[0].password !== req.body.password) {
        return responseUtil.sendResponse(res,false,null,"Incorrect password entered.",404);
      }
      const result = await updateProfile();
      return result;
    })
    .catch((err) => {
      return responseUtil.sendResponse(res,false,null,"User not found with username " + req.params.username,404);
    });

  // 4
  // Find user and update it with the request body
  const updateProfile = async (error, resolve) => {
    return User.findOneAndUpdate(
      { username: req.params.username },
      {
        $set: {
          name: req.body.name,
          email: req.body.email,
          phone: req.body.phone,
          password: req.body.newPassword,
        },
      },
      { new: true },
      (err, doc) => {
        if (err) {
          console.log(err);
        }
      }
    )
      .then((user) => {
        if (!user) {
          return responseUtil.sendResponse(res,false,null,"User not found with username " + req.params.username,404);
        }
        return responseUtil.sendResponse(res,true,user,"Profile updated successfully with username" + req.params.username,404);
      })
      .catch((err) => {
        if (err.kind === "ObjectId") {
          return responseUtil.sendResponse(res,false,null,"User not found with username " + req.params.username,404);
        }
        err.message1 = err.message;
        err.message = "";
        if (err.message1.includes("phone")) {
          err.message = err.message + "Mobile number is already taken. \n";
        }
        if (err.message1.includes("email")) {
          err.message = err.message + "Email is already taken. \n";
        }
        return responseUtil.sendResponse(res,false,null,"Error updating user with username " + req.params.username+" due to "+err.message,404);
      });
  };
};

exports.forgotPass = (req, res) => {
  User.findOne({ username: req.body.username })
    .then((user) => {
      if (user.length === 0) {
        return responseUtil.sendResponse(res,false,null,"User not found with username " + req.params.username,404);
      }
      mailUser(user).catch((err) => console.log(err));
      return responseUtil.sendResponse(res,true,user,"Please check you mail!",200);
    })
    .catch((err) => {
      if (err.kind === "ObjectId") {
        return responseUtil.sendResponse(res,false,null,"User not found with username " + req.params.username,404);
      }
    });
  // Gen token & send email here
  async function mailUser(user) {
    var readHTMLFile = async function (path, callback) {
      fs.readFile(path, { encoding: "utf-8" }, function (err, html) {
        if (err) {
          callback(err);
        } else {
          callback(null, html);
        }
      });
    };

    let htmlPath = path.join(__dirname, "../util/forgotPass.html");
    readHTMLFile(htmlPath, function (err, html) {
      if (err) {
        console.log(err);
      }
      // Oauth2 set up
      const oauth2Client = new OAuth2(
        process.env.OAuthClientID, // ClientID
        process.env.OAuthClientSecret, // Client Secret
        "https://developers.google.com/oauthplayground" // Redirect URL
      );

      oauth2Client.setCredentials({
        refresh_token: process.env.OAuthRefreshToken,
      });
      const accessToken = oauth2Client.getAccessToken();

      const smtpTransport = nodemailer.createTransport({
        service: "gmail",
        auth: {
          type: "OAuth2",
          user: "klhcode@gmail.com",
          clientId: process.env.OAuthClientID,
          clientSecret: process.env.OAuthClientSecret,
          refreshToken: process.env.OAuthRefreshToken,
          accessToken: accessToken,
        },
        tls: {
          rejectUnauthorized: false,
        },
      });

      // Generate Handlebars template
      var template = handlebars.compile(html);
      console.log("USER", user);
      var replacements = {
        name: user.name,
        username: user.username.toUpperCase(),
        email: user.email,
        password: user.password,
        clientUrl: clientAddress,
      };
      var htmlToSend = template(replacements);

      const mailOptions = {
        from: "recode.verify@gmail.com",
        to: user.email,
        subject: "Your Password - KLHCode",
        generateTextFromHTML: true,
        html: htmlToSend,
      };
      smtpTransport.sendMail(mailOptions, (error, response) => {
        if (error) {
          console.log(error);
        }
        smtpTransport.close();
      });
    });
  }
};

// Find username and check pass
exports.checkPass = (req, res) => {
  User.find({ username: req.body.username })
    .then(async (user) => {
      if (user.length === 0) {
        return responseUtil.sendResponse(res,false,null,"User not found with username " + req.params.username,404);
      }
      if (user[0].password === req.body.password) {
        if (user[0].isVerified === true) {
          // Login successful
          let token = jwt.sign(
            {
              username: user[0].username,
              isVerified: user[0].isVerified,
              admin: user[0].admin,
            },
            process.env.secret,
            { expiresIn: "730h" }
          );
          res.cookie("token", token);
          res.cookie("username", user[0].username.toUpperCase());

          // return the JWT token for the future API calls
          if (user[0].admin) {
            res.send({
              success: true,
              admin: true,
              token: token,
              username: user[0].username.toUpperCase(),
              message: "Auth successful",
            });
          } else {
            res.send({
              success: true,
              token: token,
              username: user[0].username.toUpperCase(),
              message: "Auth successful",
              branch: user[0].branch.toLowerCase(),
            });
          }
        } else {
          res.status(404).send({
            success: false,
            message: "Please verify account to continue.",
          });
        }
      } else {
        res.status(404).send({
          success: false,
          message: "Incorrect password entered.",
        });
      }
    })
    .catch((err) => {
      if (err.kind === "ObjectId") {
        return res.status(404).send({
          success: false,
          message:
            "[caught] User not found with username  " + req.body.username,
        });
      }
      return res.status(404).send({
        success: false,
        message: "Error retrieving user with id hello " + req.body.username,
      });
    });
};

// Check Token and activate account
exports.checkToken = (req, res) => {
  User.findOneAndUpdate(
    { email: req.body.email, verifyToken: req.body.token },
    {
      $set: {
        isVerified: true,
      },
    },
    { new: true }
  )
    .then((user) => {
      if (!user) {
        return res.status(404).send({
          success: false,
          message: "Could not verify account " + req.body.email,
        });
      } else {
        res.send({
          success: true,
          message: "Account successfully verified, log in to continue.",
        });
      }
    })
    .catch((err) => {
      if (err) {
        console.log(err);
      }
      if (err.kind === "ObjectId") {
        return res.status(404).send({
          success: false,
          message: "Could not verify account " + req.body.email,
        });
      } else {
        return res.status(404).send({
          success: false,
          message: "Could not verify account " + req.body.email,
        });
      }
    });
};

// Delete a user with username
exports.delete = (req, res) => {
  User.findOneAndRemove({ username: req.params.username })
    .then((user) => {
      if (!user) {
        return res.status(404).send({
          success: false,
          message: "User not found with username  " + req.params.username,
        });
      }
      res.send({ message: "user deleted successfully!" });
    })
    .catch((err) => {
      if (err.kind === "ObjectId" || err.name === "NotFound") {
        return res.status(404).send({
          success: false,
          message: "User not found with username  " + req.params.username,
        });
      }
      return res.status(500).send({
        success: false,
        message: "Could not delete user with id " + req.params.username,
      });
    });
};

//delete multiple users
exports.deleteMultiple = (req, res) => {
  var hours = 0;
  if (req.body.hours) {
    hours = Number(req.body.hours);
  }
  User.deleteMany({
    createdAt: {
      $lte: new Date(Date.now() - hours * 60 * 60 * 1000),
    },
    isVerified: false,
  })
    .then((deletedUsers) => {
      res.send(deletedUsers);
    })
    .catch((err) => {
      return res.status(500).send({
        success: false,
        message: "Could not delete users",
      });
    });
};

exports.generateSecret = (req, res) => {
  let secretText = req.decoded.username + Math.floor(Math.random() * 10);
  let encrypted = encrypt.encrypt(secretText);
  console.log(encrypted);

  function sendMail(user, secret) {
    var readHTMLFile = async function (path, callback) {
      fs.readFile(path, { encoding: "utf-8" }, function (err, html) {
        if (err) {
          callback(err);
        } else {
          callback(null, html);
        }
      });
    };

    let htmlPath = path.join(__dirname, "../util/generateSecret.html");
    readHTMLFile(htmlPath, function (err, html) {
      if (err) {
        console.log(err);
      }
      const oauth2Client = new OAuth2(
        process.env.OAuthClientID, // ClientID
        process.env.OAuthClientSecret, // Client Secret
        "https://developers.google.com/oauthplayground" // Redirect URL
      );
      oauth2Client.setCredentials({
        refresh_token: process.env.OAuthRefreshToken,
      });
      const accessToken = oauth2Client.getAccessToken();
      const transport = nodemailer.createTransport({
        service: "gmail",
        auth: {
          type: "OAuth2",
          user: "klhcode@gmail.com",
          clientId: process.env.OAuthClientID,
          clientSecret: process.env.OAuthClientSecret,
          refreshToken: process.env.OAuthRefreshToken,
          accessToken: accessToken,
        },
      });

      var template = handlebars.compile(html);
      var replacements = {
        name: user.name.toUpperCase(),
        username: user.username.toLowerCase(),
        email: user.email,
        password: user.password,
        token: user.verifyToken,
        clientUrl: clientAddress,
        secret: secret,
        year: new Date().getFullYear(),
      };
      var htmlToSend = template(replacements);

      const options = {
        from: "recode.verify@gmail.com",
        to: user.email,
        subject: "KLHCode Password Change",
        html: htmlToSend,
      };
      transport.sendMail(options, (err, response) => {
        if (err) {
          console.log("err");
          return false;
        } else {
          console.log("sent");
          return true;
        }
      });
    });
  }

  User.find({ username: req.decoded.username }).then((user) => {
    try {
      let ret = sendMail(user[0], encrypted);
      if (ret) {
        res.send({
          success: true,
        });
      } else {
        res.send({
          success: false,
        });
      }
    } catch {
      res.send({
        success: false,
      });
    }
  });
};

exports.updatePassword = (req, res) => {
  let username = req.body.username.toLowerCase();
  if (req.body.password === req.body.cpassword) {
    if (1) {
      User.findOneAndUpdate(
        { username: username },
        {
          $set: {
            password: req.body.password,
          },
        }
      )
        .then(() => {
          res.send({
            success: true,
            message: "Password updated",
          });
        })
        .catch((err) => {
          res.send({
            success: false,
            message: "Some error occurred",
          });
        });
    } else {
      res.send({
        success: false,
        message: "Entered wrong secret",
      });
    }
  } else {
    res.send({
      success: false,
      message: "Passwords did not match",
    });
  }
};

exports.makeVerify = (req, res) => {
  User.findOneAndUpdate(
    { username: req.body.username },
    {
      $set: {
        isVerified: true,
      },
    }
  )
    .then(() => {
      res.send({
        success: true,
      });
    })
    .catch(() => {
      res.send({
        success: false,
      });
    });
};

exports.findAllUsernames = async (req, res) => {
  User.find()
    .then((users) => {
      let resArr = [];
      users.forEach((user) => {
        resArr.push(user.username);
      });
      res.send(resArr);
    })
    .catch((err) => {
      res.send([]);
    });
};
