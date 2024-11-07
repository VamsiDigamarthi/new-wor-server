// import * as tf from "@tensorflow/tfjs-node";
import axios from "axios";
import OtpModel from "../Modals/OtpModal.js";
import UserModel from "../Modals/UserModal.js";
import jwt from "jsonwebtoken";
import Tesseract from "tesseract.js";

// import Jimp from "jimp";
import "dotenv/config";

import { fileURLToPath } from "url";
import { dirname, join } from "path";
import fs from "fs";
import CitiesModel from "../Modals/CitiesModal.js";

import OneSignal from "onesignal-node";

const __dirname = dirname(fileURLToPath(import.meta.url));

import * as faceapi from "face-api.js";
import canvas from "canvas";

const { Canvas, Image } = canvas;
faceapi.env.monkeyPatch({ Canvas, Image });

// sending otp from registration
export const sendOtp = async (req, res) => {
  const { mobile } = req.body;
  console.log(mobile);
  if (!mobile) {
    return res.status(400).json({ message: "Mobile number is required" });
  }

  let otp;

  try {
    const otpExist = await OtpModel.findOne({ mobile: mobile });
    // if (mobile === "9123456789") {
    otp = "123456";
    // }
    // else {
    //   otp = Math.floor(100000 + Math.random() * 900000);
    // }
    // const otp = Math.floor(100000 + Math.random() * 900000);
    // const otp = "123456";
    const otpApiUrl = `https://2factor.in/API/V1/${process.env.OTP_API_KEY}/SMS/+91${mobile}/${otp}/OTP TEMPLATE`;
    try {
      // Send OTP using Axios GET request
      await axios.get(otpApiUrl);

      if (otpExist) {
        // Update the existing OTP document
        otpExist.otp = otp;
        await otpExist.save();
      } else {
        // Create a new OTP document
        const newOtp = new OtpModel({ mobile, otp });
        await newOtp.save();
      }

      return res.status(200).json({ message: "OTP sent successfully!" });
    } catch (error) {
      console.error("Error sending OTP:", error);
      return res.status(500).json({
        message: "Sending OTP failed due to an external server error",
        error: error.message,
      });
    }
  } catch (error) {
    console.error("Error finding/updating OTP:", error);
    return res
      .status(500)
      .json({ message: "OTP send failed", error: error.message });
  }
};

// verifycation otp
export const onVerificationOtp = async (req, res) => {
  const { mobile, otp, termsAndCondition } = req.body;

  if (!mobile) {
    return res.status(400).json({ message: "Please send mobile number..!" });
  }
  if (!otp) {
    return res.status(400).json({ message: "Please send otp ..!" });
  }

  try {
    const existingOtpEntry = await OtpModel.findOne({ mobile });
    if (!existingOtpEntry) {
      return res.status(401).json({ message: "User not found in database" });
    }

    if (existingOtpEntry.otp.toString() !== otp.toString()) {
      return res.status(401).json({ message: "Invalid OTP" });
    }

    const user = await UserModel.findOne({ mobile });
    if (!user) {
      return res.status(404).json({ message: "User does not exist" });
    }

    if (termsAndCondition !== undefined) {
      user.termsAndCondition = termsAndCondition;
    }

    await user.save();

    const payload = { mobile: user.mobile };
    const token = jwt.sign(payload, process.env.JWT_TOKEN_SECRET);

    return res
      .status(200)
      .json({ token, message: "terms and conditions updated" });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Server error during OTP verification",
      error: error.message,
    });
  }
};

// user registration
export const onUserRegister = async (req, res) => {
  const {
    name,
    gender,
    mobile,
    role,
    termsAndCondition,
    vehicleNumber,
    dateOfBirth,
    email,
    uniqueKey,
    longitude,
    latitude,
    address,
    personalContact,
  } = req.body;
  const authenticationImage = req.file ? req.file.path : null;
  try {
    const existingUser = await UserModel.findOne({ mobile });
    if (existingUser) {
      return res.status(400).json({ message: "User Already Exist ....!" });
    }

    const user = new UserModel({
      name,
      gender,
      mobile,
      role,
      authenticationImage,
      termsAndCondition,
      vehicleNumber,
      email,
      dateOfBirth,
      uniqueKey,
      address,
      personalContact,
      captainLocation: {
        type: "Point",
        coordinates: [parseFloat(longitude), parseFloat(latitude)], // Store longitude and latitude in [longitude, latitude] format
      },
    });

    await user.save();
    const payload = { mobile: mobile };
    const token = jwt.sign(payload, process.env.JWT_TOKEN_SECRET);
    return res.status(200).json({ token });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Registration failed..!",
      error: error.message,
    });
  }
};

export const onNewRegister = async (req, res) => {
  // console.log(req.body);
  const {
    name,
    email,
    dateOfBirth,
    address,
    mobile,
    longitude,
    latitude,
    role,
  } = req.body;
  const profilePic = req.file ? req.file.path : null;
  try {
    const existingUser = await UserModel.findOne({ mobile });
    if (existingUser) {
      return res.status(400).json({ message: "User Already Exist ....!" });
    }
    const user = new UserModel({
      name,
      email,
      dateOfBirth,
      address,
      mobile,
      role,
      profilePic,
      signUpCompletePercentage: role === "user" ? 25 : 16,
      captainLocation: {
        type: "Point",
        coordinates: [parseFloat(longitude), parseFloat(latitude)], // Store longitude and latitude in [longitude, latitude] format
      },
    });
    await user.save();
    const payload = { mobile: mobile };
    const token = jwt.sign(payload, process.env.JWT_TOKEN_SECRET);
    return res.status(200).json({ token });
  } catch (error) {
    console.log({ error: error.message, message: "Registration failed : " });
    return res.status(500).json({
      message: "Registration failed : " + error.message,
    });
  }
};

export const onFetchProfile = async (req, res) => {
  const { user } = req;
  try {
    const userWithoutPassword = user.toObject();

    // Remove the password field from the object
    delete userWithoutPassword.password;

    // Send the response with the password field excluded
    return res.status(200).json(userWithoutPassword);
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Profile failed..!",
      error: error.message,
    });
  }
};

// change roles

export const onChangeRole = async (req, res) => {
  const { user } = req;
  const { role } = req.body;
  try {
    await UserModel.findByIdAndUpdate(
      { _id: user._id },
      { $set: { role: role } },
      { new: true }
    );
    return res.status(201).json({ message: "Change role successfully....!" });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Change role failed..!",
      error: error.message,
    });
  }
};

export const onLogin = async (req, res) => {
  const { mobile } = req.body;
  try {
    const result = await UserModel.findOne({ mobile });
    if (result) {
      const payload = { mobile: mobile };
      const token = jwt.sign(payload, process.env.JWT_TOKEN_SECRET);
      return res.status(200).json({ token });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Login failed..!",
      error: error.message,
    });
  }
};

export const onEditProfile = async (req, res) => {
  const { user } = req;
  const { Name, email, dateOfBirth, address } = req.body;
  // const { name } = req.body;
  // console.log(Name);
  const updateData = {};
  if (Name) updateData.name = Name;
  if (email) updateData.email = email;
  if (dateOfBirth) updateData.dateOfBirth = dateOfBirth;
  if (address) updateData.address = address;
  const profilePic = req.file ? req.file.path : null;
  // console.log(profilePic);
  if (profilePic) updateData.profilePic = profilePic;
  try {
    if (user.profilePic) {
      const oldImagePath = join(__dirname, "..", user.profilePic);

      // fs.unlink(oldImagePath, (err) => {
      //   if (err) {
      //     console.log(`Failed to delete old image: ${err}`);
      //   } else {
      //     console.log(`Deleted old image: ${user.image}`);
      //   }
      // });
      fs.access(oldImagePath, fs.constants.F_OK, (err) => {
        if (err) {
          console.log(`Old image not found: ${oldImagePath}`);
        } else {
          // If the file exists, delete it
          fs.unlink(oldImagePath, (err) => {
            if (err) {
              console.log(`Failed to delete old image: ${err}`);
            } else {
              console.log(`Deleted old image: ${oldImagePath}`);
            }
          });
        }
      });
    }
    await UserModel.findByIdAndUpdate(
      { _id: user._id },
      { $set: updateData },
      { new: true }
    );

    return res
      .status(201)
      .json({ message: "Profile updated successfully ....!" });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Edit-profile  failed..!",
      error: error.message,
    });
  }
};

export const onEditUserData = async (req, res) => {
  const { user } = req;
  const { name, email, dateOfBirth, address } = req.body;
  const updateData = {};
  if (name) updateData.name = name;
  if (email) updateData.email = email;
  if (dateOfBirth) updateData.dateOfBirth = dateOfBirth;
  if (address) updateData.address = address;

  try {
    await UserModel.findByIdAndUpdate(
      { _id: user._id },
      { $set: updateData },
      { new: true }
    );

    return res
      .status(201)
      .json({ message: "Profile Updated successfully...!" });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Edit-profile  failed..!",
      error: error.message,
    });
  }
};

export const onP = async (req, res) => {
  const { mobile } = req.params;
  try {
    const result = await UserModel.findOne({ mobile });
    if (result) {
      return res.status(200).json(result);
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Edit-profile  failed..!",
      error: error.message,
    });
  }
};

export const onFetchAll = async (req, res) => {
  try {
    const result = await UserModel.find({});
    if (result) {
      return res.status(200).json(result);
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Edit-profile  failed..!",
      error: error.message,
    });
  }
};

export const onAadharCardVerification = async (req, res) => {
  const { user } = req;
  const { result } = req.body;
  const { name, dob, gender, fatherName } = result.dataFromAadhaar || {};

  const aadhaarImagePath = user.adhar;

  // aadhar card ocr logic

  if (aadhaarImagePath) {
    try {
      const {
        data: { text },
      } = await Tesseract.recognize(aadhaarImagePath, "eng", {
        tessedit_char_whitelist:
          "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz ", // Allow letters and spaces
        preserve_interword_spaces: "1",
        tessedit_pageseg_mode: Tesseract.PSM.SINGLE_BLOCK,
      });

      // Filter the extracted text to retain valid characters
      const filteredText = text.match(/[A-Za-z\s]+/g)?.join(" ") || "";
      console.log("Extracted Text:", filteredText);

      // Extract Name from the filtered text (assuming name follows a specific format)
      const extractedName = filteredText.match(
        /([A-Z][a-z]+(?:\s[A-Z][a-z]+)*)+/g
      )?.[0]; // Adjust this regex as needed for your expected name format
      console.log(extractedName);
      // Check if extracted name is valid
      if (extractedName) {
        const isVerified = result.name === extractedName.trim(); // Trim spaces for accurate comparison
        console.log(
          isVerified
            ? "Aadhaar Name Verification successful"
            : "Aadhaar Name Verification failed"
        );
      } else {
        console.log("Could not extract name from Aadhaar image.");
      }
    } catch (ocrError) {
      console.error(
        "Error extracting text from Aadhaar image:",
        ocrError.message
      );
    }
  }

  // aadhar card ocr logic

  const updateFields = {
    aadharCardDetails: {
      name: name,
      dob: dob,
      gender: gender, // Convert gender code to string
      fatherName: fatherName,
    },
  };

  try {
    const updatedUser = await UserModel.findByIdAndUpdate(
      user._id,
      {
        $set: updateFields,
        $inc: { signUpCompletePercentage: user?.role === "user" ? 25 : 16 },
      },
      { new: true } // Return the updated document
    );

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    return res
      .status(200)
      .json({ message: "Aadhar details updated successfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Edit-profile failed..!",
      error: error.message,
    });
  }
};

// export const onPanCardVerification = async (req, res) => {
//   const { user } = req;
//   const { result } = req.body; // Destructure the incoming data

//   // Check if result is provided
//   if (!result || Object.keys(result).length === 0) {
//     console.log("Pan Card Details Empty -- Perfios");
//   }

//   // Prepare the update object conditionally based on provided data
//   const panCardDetails = {};

//   if (result?.pan) panCardDetails.pan = result.pan;
//   if (result?.name) panCardDetails.name = result.name;
//   if (result?.firstName) panCardDetails.firstName = result.firstName;
//   if (result?.middleName) panCardDetails.middleName = result.middleName;
//   if (result?.lastName) panCardDetails.lastName = result.lastName;
//   if (result?.gender) panCardDetails.gender = result.gender;
//   if (result?.dob) panCardDetails.dob = result.dob;

//   if (user.pan) {
//     const panImagePath = user.pan; // Path to the stored PAN image

//     try {
//       // Perform OCR on the PAN image using Tesseract.js
//       const {
//         data: { text },
//       } = await Tesseract.recognize(panImagePath, "eng");

//       // Filter the extracted text to retain only English characters
//       const filteredText = text.match(/[A-Za-z0-9\s.,]+/g).join(" ") || "";

//       // Print the filtered text
//       console.log(filteredText);
//     } catch (ocrError) {
//       console.error("Error extracting text from PAN image:", ocrError.message);
//       return res.status(500).json({
//         message: "Failed to extract text from PAN image",
//         error: ocrError.message,
//       });
//     }
//   }

//   try {
//     const updatedUser = await UserModel.findByIdAndUpdate(
//       user._id,
//       { $set: { panCardDetails } }, // Use $set to update only the fields in the panCardDetails
//       { new: true } // Return the updated document
//     );

//     if (!updatedUser) {
//       return res.status(404).json({ message: "User not found" });
//     }

//     return res.status(200).json({
//       message: "PAN details updated successfully",
//       user: updatedUser,
//     });
//   } catch (error) {
//     console.error(error);
//     return res.status(500).json({
//       message: "PAN details update failed",
//       error: error.message,
//     });
//   }
// };

// import Tesseract from "tesseract.js"; // Import OCR library (tesseract.js)

export const onPanCardVerification = async (req, res) => {
  const { user } = req;
  const { result } = req.body; // Destructure the incoming data

  // Check if result is provided and is not empty
  if (!result || Object.keys(result).length === 0) {
    console.log("Pan Card Details Empty -- Perfios");
    // Do not send a response, just log the message.
  }

  // Prepare the update object conditionally based on provided data
  const panCardDetails = {};

  if (result?.pan) panCardDetails.pan = result.pan;
  if (result?.name) panCardDetails.name = result.name;
  if (result?.firstName) panCardDetails.firstName = result.firstName;
  if (result?.middleName) panCardDetails.middleName = result.middleName;
  if (result?.lastName) panCardDetails.lastName = result.lastName;
  if (result?.gender) panCardDetails.gender = result.gender;
  if (result?.dob) panCardDetails.dob = result.dob;

  // Proceed only if the user has a PAN image and the result is not empty
  if (user.pan && Object.keys(result).length > 0) {
    const panImagePath = user.pan; // Path to the stored PAN image

    try {
      const {
        data: { text },
      } = await Tesseract.recognize(panImagePath, "eng", {
        tessedit_char_whitelist: "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789",
        preserve_interword_spaces: "1",
        tessedit_pageseg_mode: Tesseract.PSM.SINGLE_BLOCK,
      });

      // Filter the extracted text to retain valid characters
      const filteredText = text.match(/[A-Za-z0-9\s/.-]+/g)?.join(" ") || "";
      // Adjust common OCR errors
      const correctedText = filteredText.replace(/O/g, "0").replace(/I/g, "1");

      // Extract PAN and Name from the corrected text
      const extractedPan = correctedText.match(/([A-Z]{5}\d{4}[A-Z])/i)?.[0];
      const extractedName = correctedText.match(
        /([A-Z]+\s[A-Z]+(?:\s[A-Z]+)?)/i
      )?.[0];

      console.log("Extracted PAN:", extractedPan);
      console.log("Extracted Name:", extractedName);

      // Check if extracted values are not null or undefined
      if (extractedPan) {
        // Compare with the client-provided values
        const isVerified = result.pan === extractedPan;

        if (isVerified) {
          console.log("Verification successful: Verified");
        } else {
          console.log("Verification failed: Not Verified");
        }
      } else {
        console.log("Could not extract PAN from image.");
      }
    } catch (ocrError) {
      console.error("Error extracting text from PAN image:", ocrError.message);
    }
  }

  try {
    const updatedUser = await UserModel.findByIdAndUpdate(
      user._id,
      { $set: { panCardDetails } }, // Use $set to update only the fields in the panCardDetails
      { new: true } // Return the updated document
    );

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({
      message: "PAN details updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "PAN details update failed",
      error: error.message,
    });
  }
};

export const onRCCardVerification = async (req, res) => {
  const { user } = req;
  console.log(req.body);
  const { result } = req.body;
  const rcCardDetails = {
    rc_body_type_desc: result.rc_body_type_desc,
    rc_eng_no: result.rc_eng_no,
    rc_maker_desc: result.rc_maker_desc,
    rc_maker_model: result.rc_maker_model,
    rc_manu_month_yr: result.rc_manu_month_yr,
    rc_mobile_no: result.rc_mobile_no,
    rc_owner_name: result.rc_owner_name,
    rc_owner_sr: result.rc_owner_sr,
    rc_permanent_address: result.rc_permanent_address,
    rc_present_address: result.rc_present_address,
    rc_registered_at: result.rc_registered_at,
    rc_regn_no: result.rc_regn_no,
  };
  try {
    const updatedUser = await UserModel.findByIdAndUpdate(
      user._id,
      {
        $set: { rcCardDetails }, // Update the rcCardDetails field
        $inc: { signUpCompletePercentage: 16 }, // Increment the signUpCompletePercentage by 16
      }, // Update the panCardDetails field
      { new: true } // Return the updated document
    );

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({ message: "RC details updated successfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Edit-profile failed..!",
      error: error.message,
    });
  }
};

export const onLicenseCardVerification = async (req, res) => {
  const { user } = req;
  console.log(req.body);
  const { result } = req.body;
  try {
    user.licenseCardDetails = {
      issueDate: result.issueDate,
      fatherOrHusband: result["father/husband"], // Adjusted field name
      name: result.name,
      bloodGroup: result.bloodGroup,
      dob: result.dob,
      dlNumber: result.dlNumber,
      validity: {
        nonTransport: result.validity.nonTransport,
        transport: result.validity.transport,
      },
      status: result.status,
    };

    user.signUpCompletePercentage += 16;

    await user.save();

    return res
      .status(200)
      .json({ message: "License details updated successfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Edit-profile failed..!",
      error: error.message,
    });
  }
};

export const onAllCardVerificationStatus = async (req, res) => {
  const { user } = req;
  const { allVerificationStatus } = req.body;
  try {
    await UserModel.findByIdAndUpdate(
      user._id,
      {
        $set: { allVerificationStatus: allVerificationStatus },
      },
      { new: true }
    );
    return res
      .status(200)
      .json({ message: "All card verification status updated successfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Edit-profile failed..!",
      error: error.message,
    });
  }
};

export const onFetchCities = async (req, res) => {
  try {
    const cities = await CitiesModel.find({}).select(
      "-createdAt -updatedAt -__v"
    );
    return res.status(200).json(cities);
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Edit-profile failed..!",
      error: error.message,
    });
  }
};

export const onUpdateFirebaseToken = async (req, res) => {
  const { user } = req;
  const { fbtoken } = req.body;

  if (!fbtoken) {
    return res.status(400).json({ message: "Firebase token is required" });
  }

  try {
    await UserModel.findByIdAndUpdate(
      user._id,
      {
        $set: { fbtoken: fbtoken },
      },
      { new: true }
    );
    return res.status(200).json({ message: "token updated successfully...!" });
  } catch (error) {
    console.log({ error: error.message, message: "update token failed..!" });
    return res.status(500).json({ message: "update token failed..!" });
  }
};

// on update time and date

export const onUpdateTimeAndDate = async (req, res) => {
  const { user } = req;
  const { time } = req.body;

  try {
    await UserModel.findByIdAndUpdate(
      user._id,
      {
        $set: { time: time },
      },
      { new: true }
    );
    return res.status(200).json({ message: "Time updated successfully...!" });
  } catch (error) {
    console.log({
      error: error.message,
      message: "update time and date failed..!",
    });
    return res.status(500).json({ message: "update time and date failed..!" });
  }
};

export const onChangeRoleVerifyOtp = async (req, res) => {
  const { mobile, otp } = req.body;

  if (!mobile) {
    return res.status(400).json({ message: "Please send mobile number..!" });
  }
  if (!otp) {
    return res.status(400).json({ message: "Please send otp ..!" });
  }

  try {
    const existingOtpEntry = await OtpModel.findOne({ mobile });
    if (!existingOtpEntry) {
      return res.status(401).json({ message: "User not found in database" });
    }

    if (existingOtpEntry.otp.toString() !== otp.toString()) {
      return res.status(401).json({ message: "Invalid OTP" });
    }

    const user = await UserModel.findOne({ mobile });
    if (!user) {
      return res.status(401).json({ message: "User does not exist" });
    }

    // const payload = { mobile: user.mobile };
    // const token = jwt.sign(payload, process.env.JWT_TOKEN_SECRET);

    return res.status(200).json({ message: "OTP Verified successfully..!" });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Server error during OTP verification",
      error: error.message,
    });
  }
};
// const pushy = new Pushy("66fbb23b5e43869d04c784ec");
// const pushy = new Pushy(
//   "0dfa9049f87849cc4c74bb106f1d93d36c2f284e580b7346e2658be2e7515f34"
// );

// export const onPushyNotification = async (req, res) => {
//   const { deviceToken, title, message, payload } = req.body;
//   const data = {
//     message: message, // Payload to send to the Flutter app
//     ...payload, // Additional payload data
//   };

//   const notification = {
//     to: deviceToken,
//     data: data,
//     notification: {
//       title: title,
//       body: message,
//     },
//   };

//   try {
//     // Send the push notification
//     let response = await pushy.sendPush(notification);
//     console.log("Push sent successfully:", response);
//     return res.status(200).json({ message: "notification send successfully" });
//   } catch (error) {
//     console.error("Failed to send push notification:", error);
//   }
// };

// export const onPushyNotification = async (req, res) => {
//   // Set push payload data to deliver to device(s)
//   let { deviceTokens, title, description, payload } = req.body;

//   // Default message if not provided
//   const data = {
//     message: description || "Hello World!",
//     ...payload, // Include any additional payload data
//   };

//   // Set optional push notification options (such as iOS notification fields)
//   const options = {
//     notification: {
//       badge: 1,
//       sound: "ping.aiff",
//       title: title || "Test Notification", // Use provided title or default
//       body: description || "Hello World! \u270c", // Use provided description or default
//     },
//   };

//   try {
//     // Send push notification via the Send Notifications API
//     const id = await pushy.sendPushNotification(data, deviceTokens, options);
//     // Log success
//     console.log(`Push sent successfully! (ID: ${id})`);
//     res.status(200).json({ success: true, id });
//   } catch (err) {
//     // Log errors to console
//     console.error("Fatal Error", err);
//     res.status(500).json({ success: false, error: err.message });
//   }
// };

// export const onPushyNotification = async (req, res) => {
//   // Set push payload data to deliver to device(s)
//   let { deviceTokens } = req.body;
//   const data = {
//     message: "Hello World!",
//   };

//   // Set optional push notification options (such as iOS notification fields)
//   const options = {
//     notification: {
//       badge: 1,
//       sound: "ping.aiff",
//       title: "Test Notification",
//       body: "Hello World \u270c",
//     },
//   };

//   try {
//     // Send push notification via the Send Notifications API
//     const id = await pushy.sendPushNotification(data, deviceTokens, options);
//     // Log success
//     console.log(`Push sent successfully! (ID: ${id})`);
//   } catch (err) {
//     // Log errors to console
//     console.error("Fatal Error", err);
//   }
// };

export const onEmergencyContactNumber = async (req, res) => {
  const { user } = req;
  const { personalContact } = req.body;
  try {
    const updatedUser = await UserModel.findByIdAndUpdate(
      user._id,
      {
        $set: { personalContact: personalContact }, // Update the rcCardDetails field
        $inc: { signUpCompletePercentage: user?.role === "user" ? 25 : 16 }, // Increment the signUpCompletePercentage by 16
      },
      { new: true }
    );
    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }
    return res
      .status(200)
      .json({ message: "Emergency contact number updated successfully" });
  } catch (error) {
    console.log({
      error: error.message,
      message: "emergency contact number failed ",
    });
    return res
      .status(500)
      .json({ message: "emergency contact number failed..!" });
  }
};

export const onCompareImage = async (req, res) => {
  const { user } = req;
  const authenticationImage = req.file ? req.file.path : null;
  try {
    if (user.compareImage) {
      const oldImagePath = join(__dirname, "..", user.compareImage);

      fs.access(oldImagePath, fs.constants.F_OK, (err) => {
        if (err) {
          console.log(`Old image not found: ${oldImagePath}`);
        } else {
          // If the file exists, delete it
          fs.unlink(oldImagePath, (err) => {
            if (err) {
              console.log(`Failed to delete old image: ${err}`);
            } else {
              console.log(`Deleted old image: ${oldImagePath}`);
            }
          });
        }
      });
    }

    const updatedUser = await UserModel.findByIdAndUpdate(
      user._id,
      { compareImage: authenticationImage },
      { new: true }
    );
    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }
    return res.status(200).json({ url: updatedUser?.compareImage });
  } catch (error) {
    console.log({ error: error.message, message: "compareImage failed" });
    return res.status(500).json({ message: "compareImage failed..!" });
  }
};

const loadModels = async () => {
  const modelPath = join(__dirname, "..", "facemodals"); // Path to your model directory

  await faceapi.nets.ssdMobilenetv1.loadFromDisk(modelPath);
  await faceapi.nets.faceLandmark68Net.loadFromDisk(modelPath);
  await faceapi.nets.faceRecognitionNet.loadFromDisk(modelPath);
};

// export const onCompareImage = async (req, res) => {
//   const { user } = req;
//   const imagePath = req.file.path;
//   const savedImagePath = user?.authenticationImage;
//   try {
//     // Ensure models are loaded before running face detection
//     await loadModels();
//     const savedImage = await canvas.loadImage(savedImagePath);
//     const uploadedImage = await canvas.loadImage(imagePath);

//     // Detect faces in both images
//     const detections1 = await faceapi
//       .detectAllFaces(savedImage)
//       .withFaceLandmarks()
//       .withFaceDescriptors();
//     const detections2 = await faceapi
//       .detectAllFaces(uploadedImage)
//       .withFaceLandmarks()
//       .withFaceDescriptors();

//     if (!detections1.length || !detections2.length) {
//       return res
//         .status(400)
//         .json({ message: "No faces detected in one or both images" });
//     }

//     const faceMatcher = new faceapi.FaceMatcher(detections1);
//     const bestMatch = faceMatcher.findBestMatch(detections2[0].descriptor);

//     if (bestMatch.label === "unknown") {
//       res.json({ match: false, message: "Images are not of the same person" });
//     } else {
//       res.json({ match: true, message: "Images are of the same person" });
//     }
//   } catch (error) {
//     console.log({
//       error: error.message,
//       status: 500,
//       message: "face matching failed",
//     });
//     return res
//       .status(500)
//       .json({ error: error.message, message: "face matching failed" });
//   } finally {
//     if (fs.existsSync(imagePath)) {
//       fs.unlinkSync(imagePath);
//     }
//   }
// };
