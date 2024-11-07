import jwt from "jsonwebtoken";
import "dotenv/config";
import UserModel from "../Modals/UserModal.js";
import bcrypt from "bcrypt";
import nodemailer from "nodemailer";
import OtpModel from "../Modals/OtpModal.js";
import OrderModel from "../Modals/OrderModal.js";

export const onAdminLogin = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res
      .status(400)
      .json({ message: "Please provide mobile and password" });
  }
  try {
    // Check if admin exists by mobile number
    const admin = await UserModel.findOne({ email });
    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }
    // return res.status(200).json(admin);
    const isPasswordValid = bcrypt.compareSync(password, admin.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid password" });
    }
    const payload = { mobile: admin.mobile };
    const token = jwt.sign(payload, process.env.JWT_TOKEN_SECRET);
    return res.status(200).json({
      token,
    });
  } catch (error) {
    console.log({ error: error.message, message: "Admin login failed" });
    return res
      .status(500)
      .json({ error: error.message, message: "Admin login failed" });
  }
};

const sendEmails = async (user, otp) => {
  const transporter = nodemailer.createTransport({
    host: "smtp.hostinger.com", // Hostinger's SMTP server
    port: 465, // Secure SMTP port
    secure: true, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  // console.log("if block exicuted");
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: user.email,
    subject: `Your One-Time Password (OTP) for verifying your account is:`,
    text: `Dear ${user?.name}
                  **${otp}**

                  This OTP is valid for the next 10 minutes. Please do not share this code with anyone for your security.

                  If you did not request this, please ignore this email.

                  Best Regards,
                  DHARANI
                  NUHVIN GLOBAL SERVICES PRIVATE LIMITES 
                  
               `,
    html: `<div>
                    <h2>Dear ${user?.name}</h2>
                     **${otp}**

                    This OTP is valid for the next 10 minutes. Please do not share this code with anyone for your security.

                    If you did not request this, please ignore this email.

                    <p>Best regards,</p>
                    <h4>
                       DHARANI
                    </h4>
                    <h4>
                        NUHVIN GLOBAL SERVICES PRIVATE LIMITES 
                    </h4>
               </div>`,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Email sent to ${user.email}`);
  } catch (error) {
    console.error(`Failed to send email to ${user.email}: ${error.message}`);
  }
};

export const onForgotPassword = async (req, res) => {
  // const { user } = req;
  const { email } = req.body;
  const otp = Math.floor(100000 + Math.random() * 900000);
  const user = await UserModel.findOne({ email: email });
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  try {
    const otpExist = await OtpModel.findOne({ mobile: user?.mobile });
    if (otpExist) {
      // Update the existing OTP document
      otpExist.otp = otp;
      await otpExist.save();
    } else {
      // Create a new OTP document
      const newOtp = new OtpModel({ mobile: user.mobile, otp });
      await newOtp.save();
    }

    sendEmails(user, otp);

    return res.status(200).json({ message: "OTP sent successfully!" });
  } catch (error) {
    console.log({ error: error.message, message: "forgot password error" });
    return res
      .status(500)
      .json({ message: "forgot password error", error: error.message });
  }
};

export const onVerifyEmailOtp = async (req, res) => {
  const { otp, email } = req.body;
  const user = await UserModel.findOne({ email: email });
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }
  try {
    const otpExist = await OtpModel.findOne({ mobile: user.mobile });
    if (!otpExist) {
      return res.status(404).json({ message: "OTP not found" });
    }
    if (otpExist.otp === otp) {
      return res.status(200).json({ message: "Email verified successfully!" });
    } else {
      return res.status(401).json({ message: "Invalid OTP" });
    }
  } catch (error) {
    console.log({ error: error.message, message: "verify-otp failed" });
    return res.status(500).json({
      message: "verify-otp failed",
      error: error.message,
    });
  }
};

// profile

export const onGetProfile = async (req, res) => {
  const { user } = req;
  try {
    return res.status(200).json(user);
  } catch (error) {
    console.log({ error: error.message, message: "Profile Faield" });
    return res
      .status(500)
      .json({ message: "Profile Faield", error: error.message });
  }
};

export const onFetchAllCaptains = async (req, res) => {
  const { role } = req.params;
  try {
    const captains = await UserModel.find({
      role: role,
      userVerified: false,
    }).select("-createdAt -__v -updatedAt");
    return res.status(200).json(captains);
  } catch (error) {
    console.log({
      error: error.mmessage,
      message: "fetching captains faileds",
    });
    return res
      .status(500)
      .json({ message: "fetching captains faileds", error: error.message });
  }
};

export const onCaptainVerified = async (req, res) => {
  const { captainId } = req.params;
  try {
    // Find captain by ID
    const captain = await UserModel.findById(captainId);
    if (!captain) {
      return res.status(404).json({
        message: "Captain not found!",
      });
    }
    captain.userVerified = true;
    captain.reviewToVerified = false; // Set reviewToVerified to false
    await captain.save();
    return res.status(200).json({
      message: "Captain verified successfully!",
    });
  } catch (error) {
    console.log({
      error: error.message,
      message: " captaine verified failed ",
    });
    return res.status(500).json({
      message: "captaine verified failed",
      error: error.message,
    });
  }
};

export const onCaptainUnVerified = async (req, res) => {
  const { captainId } = req.params; // captainId from URL params
  const { storeUnVerifiedDetails } = req.body;
  try {
    // Find captain by ID
    const captain = await UserModel.findById(captainId);
    if (!captain) {
      return res.status(404).json({
        message: "Captain not found!",
      });
    }
    captain.userVerified = false;
    captain.reviewToVerified = true;
    captain.storeUnVerifiedDetails = storeUnVerifiedDetails;
    await captain.save();
    return res.status(200).json({
      message: "Captain unverified successfully!",
    });
  } catch (error) {
    console.log({ error: error.message, message: "captain un verified" });
    return res
      .status(500)
      .json({ error: error.message, message: "captain unverified" });
  }
};

export const onVerifiedCaptainPanAadhar = async (req, res) => {
  const { captainId, context } = req.params; // captainId and context from URL params

  try {
    // Find captain by ID
    const captain = await UserModel.findById(captainId);
    if (!captain) {
      return res.status(404).json({
        message: "Captain not found!",
      });
    }

    switch (context) {
      case "pan-aadhar":
        captain.panAadharCardVerified = !captain.panAadharCardVerified;
        break;
      case "rc":
        captain.rcCardVerified = !captain.rcCardVerified;
        break;
      case "license":
        captain.licenseCardVerified = !captain.licenseCardVerified;
        break;

      default:
        return res.status(400).json({
          message:
            "Invalid context! Please provide 'pan', 'aadhar', 'rc', or 'license'.",
        });
    }

    // Save the updated captain record
    await captain.save();

    return res.status(200).json({
      message: `Captain ${context} card verification updated successfully!`,
    });
  } catch (error) {
    console.log({
      error: error.message,
      message: "Captain card verification update failed..!",
    });
    return res.status(500).json({
      message: "Captain card verification update failed..!",
      error: error.message,
    });
  }
};

export const onCaptainsAlongWithOrders = async (req, res) => {
  try {
    // Fetch all captains along with their respective orders and the user (head) of each order
    const captainsWithOrders = await UserModel.aggregate([
      {
        $match: {
          role: "captain", // Match captains only
        },
      },
      {
        $lookup: {
          from: "orders", // Collection to join (orders)
          localField: "_id", // Field from User (Captain) model
          foreignField: "acceptCaptain", // Field from Order model to match captain
          as: "orders", // Output field for the orders array
        },
      },
      {
        $unwind: { path: "$orders", preserveNullAndEmptyArrays: true }, // Unwind the orders array for further processing
      },
      {
        $lookup: {
          from: "users", // Collection to join (users for the head field)
          localField: "orders.head", // Field in orders to match with user
          foreignField: "_id", // Field in users to match (user's _id)
          as: "headDetails", // Output field for head user details
        },
      },
      {
        $unwind: { path: "$headDetails", preserveNullAndEmptyArrays: true }, // Unwind headDetails to make it accessible in the projection
      },
      {
        $group: {
          _id: "$_id", // Group by captain
          name: { $first: "$name" }, // Retain captain's name
          mobile: { $first: "$mobile" }, // Retain captain's mobile
          profilePic: { $first: "$profilePic" },
          email: { $first: "$email" },
          signUpDateAndTime: { $first: "$signUpDateAndTime" },
          holdingCaptain: { $first: "$holdingCaptain" },
          orders: {
            $push: {
              reviewRating: "$orders.reviewRating", // Include necessary order details
              reviewTest: "$orders.reviewTest",
              // price: "$orders.price",
              // vehicleType: "$orders.vehicleType",
              // orderPlaceDate: "$orders.orderPlaceDate",
              // status: "$orders.status",
              head: {
                name: "$headDetails.name", // Fetch head details (user details for each order)
                mobile: "$headDetails.mobile",
                profilePic: "$headDetails.profilePic",
              },
            },
          },
          averageRating: { $avg: "$orders.reviewRating" }, // Calculate average rating
        },
      },
    ]);

    return res.status(200).json(captainsWithOrders);
  } catch (error) {
    console.log({
      error: error.message,
      message: "Captains along with orders and head fetch failed",
    });
    return res.status(500).json({
      message: "Captains along with orders and head fetch failed",
      error: error.message,
    });
  }
};

export const onHoldingCaptain = async (req, res) => {
  const { captanId } = req.params;
  try {
    const captain = await UserModel.findOne({ _id: captanId });
    captain.holdingCaptain = !captain.holdingCaptain;
    captain.save();

    return res.status(201).json({ message: "Holding Captain...!" });
  } catch (error) {
    console.error("Holding Captaine failed", error);
    return res
      .status(500)
      .json({ message: "Holding Captaine failed", error: error.message });
  }
};

export const onAllReviewsFetch = async (req, res) => {
  try {
    const allReviews = await OrderModel.find({})
      .select("reviewRating reviewTest") // Select only reviewRating and reviewTest fields from OrderModel
      .populate("head", "name mobile profilePic");
    //.sort({ orderPlaceDate: -1 })
    return res.status(200).json(allReviews);
  } catch (error) {
    console.log({ error: error.message, message: "All reviws faield" });
    return res
      .status(500)
      .json({ message: "All reviws faield", error: error.message });
  }
};
