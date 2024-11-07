import OrderModel from "../Modals/OrderModal.js";
import UserModel from "../Modals/UserModal.js";

import fs from "fs/promises";
import path from "path";

import { fileURLToPath } from "url";

// Define __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const onDuttyChange = async (req, res) => {
  const { user } = req;
  const { file } = req;
  const captainLiveImage = file ? file.path : null;
  try {
    if (captainLiveImage) {
      // If captainLiveImage is present, update both onDuty and captainLiveImage
      await UserModel.findByIdAndUpdate(
        user._id,
        { $set: { onDuty: !user.onDuty, captainLiveImage } },
        { new: true }
      );
    } else {
      // If no captainLiveImage, just toggle the onDuty flag
      user.onDuty = !user.onDuty;
      await user.save();
    }

    return res.status(201).json({ message: "Updated...!" });
  } catch (error) {
    console.error("On Dutty Change Faield", error);
    return res
      .status(500)
      .json({ message: "On Dutty Change Faield", error: error.message });
  }
};

export const onFetchAllOrders = async (req, res) => {
  const { user } = req;
  try {
    const { longitude, latitude, distance, currentData } = req.params;
    let meters = parseInt(distance) * 1000;

    const orders = await OrderModel.find({
      pickup: {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [parseFloat(longitude), parseFloat(latitude)],
          },
          $maxDistance: meters,
          $minDistance: 0,
        },
      },
      orderPlaceDate: currentData,
      status: { $in: ["pending", "escape"] },
      rejectedCaptaine: { $nin: [user._id] },
      // status: { $in: ["pending", "rejected"] },
    });

    return res.status(200).json(orders);
  } catch (error) {
    console.error("All orders Faield", error);
    return res
      .status(500)
      .json({ message: "All Orders Faield", error: error.message });
  }
};

export const onAcceptOrder = async (req, res) => {
  const { user } = req;
  const { orderId } = req.params;
  try {
    const checkOrderAcceptOrNot = await OrderModel.findOne({
      _id: orderId,
    }).populate("head");
    if (checkOrderAcceptOrNot.status === "accept") {
      return res.status(400).json({ message: "Order Already Accepted ....!" });
    }

    const order = await OrderModel.findOneAndUpdate(
      { _id: orderId },
      { $set: { status: "accept", acceptCaptain: user._id } },
      { new: true } // To return the updated document
    );

    return res.status(200).json({
      message: "Accept Order Successfully...!",
      order: checkOrderAcceptOrNot,
    });
  } catch (error) {
    console.error("Accept order  Faield", error);
    return res
      .status(500)
      .json({ message: "Accept order  Faield", error: error.message });
  }
};

export const onChangeMensProblem = async (req, res) => {
  const { user } = req;
  const { orderId } = req.params;
  try {
    const existingorder = await OrderModel.findById(orderId);

    await OrderModel.findByIdAndUpdate(
      { _id: orderId },
      {
        $set: { mensProblem: !existingorder.mensProblem, status: "escape" },
        $push: { rejectedCaptaine: user._id }, // Push the user ID into rejectedCaptaine array
      },
      { new: true } // Return the updated document
    );

    return res.status(200).json({ message: "Mens problem updated.....!" });
  } catch (error) {
    console.log({
      error: error.message,
      message: "Failed to change mens problem ",
    });
    return res.status(500).json({ message: "Failed to change mens problem " });
  }
};

export const onOrdersDeclaine = async (req, res) => {
  const { user } = req;
  const { orderId } = req.params;
  try {
    await OrderModel.findByIdAndUpdate(
      { _id: orderId },
      { $push: { rejectedCaptaine: user._id } }
    );

    return res.status(200).json({
      message:
        "Order declined and user added to rejectedCaptaine successfully.",
    });
  } catch (error) {
    console.error("remaining order declaine Faield", error);
    return res.status(500).json({
      message: "remaining order declaine Faield",
      error: error.message,
    });
  }
};

export const onOrderCompleted = async (req, res) => {
  const { orderId } = req.params;
  const { distance, price, rideTime } = req.body;
  try {
    // const order = await OrderModel.findOne({ _id: orderId });
    // if (order.status !== "accept") {
    //   return res.status(400).json({
    //     message:
    //       "You Con't accept this order , you cont't updated to complete this order",
    //   });
    // }

    const order = await OrderModel.findByIdAndUpdate(
      { _id: orderId },
      { $set: { status: "completed", distance, price, rideTime } },
      { new: true }
    );

    res
      .status(201)
      .json({ message: "Completed Order Updated successfully...!", order });
  } catch (error) {
    console.error("After ride finish to completed order  Faield", error);
    return res.status(500).json({
      message: "After ride finish to completed order Faield",
      error: error.message,
    });
  }
};

export const onFetchAllCompletedOrders = async (req, res) => {
  const { user } = req;
  try {
    const orders = await OrderModel.find({
      acceptCaptain: user._id,
      status: "completed",
    });

    return res.status(200).json(orders);
  } catch (error) {
    console.error("Completed Order Fetching  Faield", error);
    return res.status(500).json({
      message: "Completed Order Fetching Faield",
      error: error.message,
    });
  }
};

// export const onUploadSecuritiesImages = async (req, res) => {
//   const { adhar, license, pan, rc, authenticationImage } = req.files;
//   const { user } = req;

//   // Prepare an object to hold the updates

//   const updateFields = {};

//   // Helper function to delete old image if it exists
//   const deleteOldImage = async (filePath) => {
//     if (filePath) {
//       const fullPath = path.join(__dirname, "..", filePath); // Adjust the path based on where your images are stored
//       try {
//         await fs.access(fullPath); // Check if the file exists
//         await fs.unlink(fullPath); // Delete the file
//         console.log(`Deleted old image: ${fullPath}`);
//       } catch (err) {
//         if (err.code === "ENOENT") {
//           console.log(`Old image not found: ${fullPath}`); // File does not exist
//         } else {
//           console.log(`Failed to delete old image: ${err}`); // Other errors
//         }
//       }
//     }
//   };

//   // Find the user to check existing images
//   const existingUser = await UserModel.findById(user._id);

//   // Conditionally update fields and delete old images
//   if (license) {
//     await deleteOldImage(existingUser.license); // Delete old license image
//     updateFields.license = license[0].path; // Save new license image path
//   }
//   if (pan) {
//     await deleteOldImage(existingUser.pan); // Delete old pan image
//     updateFields.pan = pan[0].path; // Save new pan image path
//   }
//   if (adhar) {
//     await deleteOldImage(existingUser.adhar); // Delete old adhar image
//     updateFields.adhar = adhar[0].path; // Save new adhar image path
//   }
//   if (rc) {
//     await deleteOldImage(existingUser.rc); // Delete old rc image
//     updateFields.rc = rc[0].path; // Save new rc image path
//   }
//   if (authenticationImage) {
//     await deleteOldImage(existingUser.authenticationImage); // Delete old authentication image
//     updateFields.authenticationImage = authenticationImage[0].path; // Save new authentication image path
//   }

//   try {
//     // Update only the fields present in the updateFields object
//     const updatedUser = await UserModel.findByIdAndUpdate(
//       user._id,
//       { $set: updateFields },
//       { new: true }
//     );

//     if (!updatedUser) {
//       return res.status(404).json({ message: "User not found" });
//     }

//     return res.status(200).json({
//       message: "Security images uploaded successfully",
//       user: updatedUser,
//     });
//   } catch (error) {
//     console.log(error);
//     return res.status(500).json({
//       message: "Edit-profile failed..!",
//       error: error.message,
//     });
//   }
// };

// export const onUploadSecuritiesImages = async (req, res) => {
//   const { license, pan, adhar, rc, authenticationImage } = req.files;
//   const { user } = req;

//   // Prepare an object to hold the updates
//   const updateFields = {};

//   // Conditionally add fields to the update object if they are present
//   if (license) updateFields.license = license[0].path;
//   if (pan) updateFields.pan = pan[0].path;
//   if (adhar) updateFields.adhar = adhar[0].path;
//   if (rc) updateFields.rc = rc[0].path;
//   if (authenticationImage)
//     updateFields.authenticationImage = authenticationImage[0].path;

//   try {
//     // Update only the fields present in the updateFields object
//     const updatedUser = await UserModel.findByIdAndUpdate(
//       user._id,
//       { $set: updateFields },
//       { new: true }
//     );

//     if (!updatedUser) {
//       return res.status(404).json({ message: "User not found" });
//     }

//     return res.status(200).json({
//       message: "Security images uploaded successfully",
//       user: updatedUser,
//     });
//   } catch (error) {
//     console.log(error);
//     return res.status(500).json({
//       message: "Edit-profile failed..!",
//       error: error.message,
//     });
//   }
// };
export const onUploadSecuritiesImages = async (req, res) => {
  const { license, pan, adhar, rc, authenticationImage, adharBack } =
    req.files || {}; // Use optional chaining to avoid errors
  const { user } = req;

  // Prepare an object to hold the updates
  const updateFields = {};

  // Helper function to delete old image if it exists
  const deleteOldImage = async (filePath) => {
    if (filePath) {
      const fullPath = path.join(__dirname, "..", filePath); // Adjust the path based on where your images are stored
      try {
        await fs.access(fullPath); // Check if the file exists
        await fs.unlink(fullPath); // Delete the file
        console.log(`Deleted old image: ${fullPath}`);
      } catch (err) {
        if (err.code === "ENOENT") {
          console.log(`Old image not found: ${fullPath}`); // File does not exist
        } else {
          console.log(`Failed to delete old image: ${err}`); // Other errors
        }
      }
    }
  };

  // Find the user to check existing images
  const existingUser = await UserModel.findById(user._id);

  // Conditionally update fields and delete old images only if new files are uploaded
  if (license) {
    await deleteOldImage(existingUser.license); // Delete old license image if exists
    updateFields.license = license[0].path; // Save new license image path
  }
  if (pan) {
    await deleteOldImage(existingUser.pan); // Delete old pan image if exists
    updateFields.pan = pan[0].path; // Save new pan image path
  }
  if (adhar) {
    await deleteOldImage(existingUser.adhar); // Delete old adhar image if exists
    updateFields.adhar = adhar[0].path; // Save new adhar image path
  }
  if (adharBack) {
    await deleteOldImage(existingUser.adharBack); // Delete old adhar image if exists
    updateFields.adharBack = adharBack[0].path; // Save new adhar image path
  }

  if (rc) {
    await deleteOldImage(existingUser.rc); // Delete old rc image if exists
    updateFields.rc = rc[0].path; // Save new rc image path
  }
  if (authenticationImage) {
    await deleteOldImage(existingUser.authenticationImage); // Delete old authentication image if exists
    updateFields.authenticationImage = authenticationImage[0].path; // Save new authentication image path
    updateFields.$inc = {
      signUpCompletePercentage: user?.role === "user" ? 25 : 16,
    };
  }

  try {
    // Update only the fields present in the updateFields object
    const updatedUser = await UserModel.findByIdAndUpdate(
      user._id,
      {
        $set: updateFields,
        ...(updateFields.$inc ? { $inc: updateFields.$inc } : {}),
      }, // Use $inc only if it exists
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({
      message: "Security images uploaded successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Edit-profile failed..! ",
      error: error.message,
    });
  }
};

export const onCaptaineGiveRatingToRide = async (req, res) => {
  const { orderId } = req.params;
  const { ratingByCaptain } = req.body;
  try {
    await OrderModel.findByIdAndUpdate(
      { _id: orderId },
      { $set: { ratingByCaptain } },
      { new: true }
    );

    return res.status(201).json({ message: "rating updated.....!" });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Captain-given-rating  failed..!",
      error: error.message,
    });
  }
};

export const onIsRideStartNaviage = async (req, res) => {
  const { orderId } = req.params;
  try {
    const order = await OrderModel.findOne({ _id: orderId });

    await OrderModel.findByIdAndUpdate(
      { _id: orderId },
      { $set: { onNaviagtionChange: !order.onNaviagtionChange } },
      { new: true }
    );

    return res.status(201).json({ message: "navigation started successfully" });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "onrideSratnavigation  failed..!",
      error: error.message,
    });
  }
};

export const onCaptainLocationTracking = async (req, res) => {
  const { longitude, latitude } = req.body;
  const { user } = req;
  try {
    const updatedCaptain = await UserModel.findByIdAndUpdate(
      user._id, // assuming 'user._id' is the captain's ID
      {
        $set: {
          "captainLocation.type": "Point",
          "captainLocation.coordinates": [
            parseFloat(longitude),
            parseFloat(latitude),
          ],
        },
      },
      { new: true } // return the updated document
    );

    if (!updatedCaptain) {
      return res.status(404).json({ message: "Captain not found" });
    }

    return res
      .status(201)
      .json({ message: "captain location updated successfully" });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "captain location added failed..!",
      error: error.message,
    });
  }
};

export const onOrderOTPVerification = async (req, res) => {
  const { otp } = req.body;
  const { orderId } = req.params;
  const { user } = req;
  try {
    const order = await OrderModel.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }
    if (order.orderOtp?.toString() !== otp?.toString()) {
      return res.status(401).json({ message: "Invalid OTP" });
    }
    return res.status(200).json({ message: "Order OTP verified..!" });
  } catch (error) {
    console.log({
      error: error.message,
      message: "Order OTP Verification Failed",
    });
    return res.status(500).json({ message: "Order OTP Verification Failed" });
  }
};
