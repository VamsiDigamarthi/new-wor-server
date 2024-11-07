import FeedbackModel from "../Modals/FeedbackModal.js";
import OrderModel from "../Modals/OrderModal.js";
import BannerOffersModel from "../Modals/BannerOffersModal.js";
import UserModel from "../Modals/UserModal.js";
import "dotenv/config";
import admin from "firebase-admin";
import { readFile } from "fs/promises";

// const serviceAccount = JSON.parse(
//   await readFile(
//     new URL("../config/push-notification-key.json", import.meta.url)
//   )
// );

const serviceAccount = {
  type: "service_account",
  project_id: process.env.PROJECT_ID,
  private_key_id: process.env.PRIVATE_KEY_ID,
  private_key: process.env.PRIVATE_KEY.replace(/\\n/g, "\n"), // to handle newlines
  client_email: process.env.CLIENT_EMAIL,
  client_id: process.env.CLIENT_ID,
  auth_uri: process.env.AUTH_URI,
  token_uri: process.env.TOKEN_URI,
  auth_provider_x509_cert_url: process.env.AUTH_PROVIDER_X509_CERT_URL,
  client_x509_cert_url: process.env.CLIENT_X509_CERT_URL,
  universe_domain: process.env.UNIVERSE_DOMAIN,
};

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

export const pushNotification = async (req, res) => {
  const { token, title, body } = req.body;
  try {
    const message = {
      notification: {
        title: title,
        body: body,
      },
      data: {
        title: "New Order",
      },
      token: token, // Target specific device via token
    };

    const response = await admin.messaging().send(message);
    return res
      .status(200)
      .json({ message: "Notification sent successfully!", response });
  } catch (error) {
    console.error("Push Notification Failed", error.message);
    return res
      .status(500)
      .json({ message: "Push Notification Failed", error: error.message });
  }
};

// send push notifications

// const sendNotificationsToCaptains = async (
//   captains,
//   title,
//   body,
//   orderDetails = null
// ) => {
//   console.log("send", captains);
//   const notificationPromises = captains?.map((captain) => {
//     let me = captain.role === "user" ? "Ride Booked" : "New Order";

//     const message = {
//       notification: {
//         title: me,
//         body: body,
//       },
//       data: {
//         title: me,
//       },
//       token: captain.fbtoken, // Use the fbtoken of each captain
//     };

//     // If there are order details (for future orders), add them to the data payload
//     if (captain.role === "user" && orderDetails) {
//       message.data.orderDetails = JSON.stringify(orderDetails); // Convert order details to a string
//     }

//     return admin.messaging().send(message);
//   });

//   try {
//     const responses = await Promise.all(notificationPromises);
//     console.log("Notifications sent successfully:", responses);
//   } catch (error) {
//     console.error("Error sending notifications:", error);
//   }
// };

const sendNotificationsToCaptains = async (
  captains,
  body,
  orderDetails = null
) => {
  const notificationPromises = captains?.map(async (captain) => {
    // Set the notification title based on the captain's role
    let notificationTitle =
      captain.role === "user" ? "Ride Booked" : "New Order";

    const message = {
      notification: {
        title: notificationTitle, // Use custom title or default
        body: body,
      },
      data: {
        title: notificationTitle, // Include title in data for consistency
      },
      token: captain.fbtoken, // Use the fbtoken of each captain
    };

    // If there are order details (for future orders), add them to the data payload for users
    if (orderDetails) {
      message.data.orderDetails = JSON.stringify(orderDetails); // Convert order details to a string
    }

    try {
      // Send notification via Firebase Admin SDK
      return await admin.messaging().send(message);
    } catch (error) {
      // Handle specific Firebase errors
      if (
        error.errorInfo &&
        error.errorInfo.code === "messaging/registration-token-not-registered"
      ) {
        console.error(
          `Token not registered for ""${captain.role}"": ${captain.fbtoken}`
        );
        // Optionally, remove this token from your database as it's no longer valid
        // e.g., await removeInvalidTokenFromDatabase(captain.fbtoken);
      } else {
        console.error(
          `Error sending notification to ""${captain.role}"":`,
          error
        );
      }
      return null; // Return null if there's an error to prevent stopping other notifications
    }
  });

  try {
    // Await all notification promises, filter out any failed (null) promises
    const responses = await Promise.all(notificationPromises.filter(Boolean));
    console.log("Notifications sent successfully:", responses);
  } catch (error) {
    console.error("Error sending notifications:", error);
  }
};

export const onPlaceOrder = async (req, res) => {
  const { user } = req;
  const {
    dropLangitude,
    dropLongitude,
    pickupLangitude,
    pickupLongitude,
    pickupAddress,
    dropAddress,
    price,
    orderPlaceTime,
    orderPlaceDate,
    vehicleType,
    parcelType,
    deliveryInstruction,
    time,
    howManyMans,
  } = req.body;

  try {
    if (user.role !== "user") {
      return res
        .status(403)
        .json({ message: "You can't access this feature!" });
    }

    const orderData = {
      price,
      vehicleType,
      orderPlaceDate,
      orderPlaceTime,
      head: user._id,
      pickupAddress,
      dropAddress,
      parcelType,
      deliveryInstruction,
      time,
      howManyMans,
      pickup: {
        type: "Point",
        coordinates: [parseFloat(pickupLongitude), parseFloat(pickupLangitude)],
      },
      drop: {
        type: "Point",
        coordinates: [parseFloat(dropLongitude), parseFloat(dropLangitude)],
      },
      userAuthenticationImage: req.file ? req.file.path : null,
      orderOtp: Math.floor(1000 + Math.random() * 9000),
    };

    if (time) {
      const currentTime = new Date();
      const [hours, minutes] = time.split(":").map(Number);

      const futureOrderTime = new Date(currentTime);
      futureOrderTime.setHours(hours);
      futureOrderTime.setMinutes(minutes);
      futureOrderTime.setSeconds(0);

      if (futureOrderTime > currentTime) {
        console.log("Order is scheduled for future time:", futureOrderTime);

        const delay = futureOrderTime - currentTime;

        setTimeout(async () => {
          await placeOrder(orderData, req, true, user); // Future order
        }, delay);

        return res.status(200).json({
          message: `Order will be placed at ${time}`,
          scheduledTime: futureOrderTime,
        });
      }
    }

    // Immediate order
    const { order, captains } = await placeOrder(orderData, req, false, user);
    return res.status(201).json({
      message: "Order placed successfully!",
      order,
      captains,
    });
  } catch (error) {
    console.error("Place Order Failed", error);
    return res
      .status(500)
      .json({ message: "Place Order Failed", error: error.message });
  }
};

// Helper function to place the order and return the order details and captains
const placeOrder = async (orderData, req, isFutureOrder, user) => {
  try {
    const order = new OrderModel(orderData);
    await order.save();

    // Find available captains near the pickup location
    const captains = await UserModel.find({
      $and: [
        {
          captainLocation: {
            $near: {
              $geometry: {
                type: "Point",
                coordinates: [
                  parseFloat(orderData.pickup.coordinates[0]),
                  parseFloat(orderData.pickup.coordinates[1]),
                ],
              },
              $maxDistance: 3000, // 3 km radius
            },
          },
        },
        { onDuty: true },
        { userVerified: true },
        { role: "captain" },
      ],
    });

    // Send notifications to all captains
    // if (isFutureOrder) {
    //   sendNotificationsToCaptains(
    //     [...captains, user],
    //     "A new order has been scheduled for a future time.",
    //     order
    //   );
    // } else {
    //   sendNotificationsToCaptains(
    //     [...captains, user],
    //     "A new order has just been placed. Please review the details and proceed with pickup.",
    //     order
    //   );
    // }

    // Return the order and captains for the response
    return { order, captains };
  } catch (error) {
    console.error("Error in placing order:", error);
    throw new Error("Error in placing order");
  }
};

// export const onPlaceOrder = async (req, res) => {
//   const { user } = req;
//   const {
//     dropLangitude,
//     dropLongitude,
//     pickupLangitude,
//     pickupLongitude,
//     pickupAddress,
//     dropAddress,
//     price,
//     orderPlaceTime,
//     orderPlaceDate,
//     vehicleType,
//     parcelType,
//     deliveryInstruction,
//     time,
//   } = req.body;

//   try {
//     if (user.role !== "user") {
//       return res
//         .status(403)
//         .json({ message: "You can't access this feature!" });
//     }

//     const orderData = {
//       price,
//       vehicleType,
//       orderPlaceDate,
//       orderPlaceTime,
//       head: user._id,
//       pickupAddress,
//       dropAddress,
//       parcelType,
//       deliveryInstruction,
//       time,
//       pickup: {
//         type: "Point",
//         coordinates: [parseFloat(pickupLongitude), parseFloat(pickupLangitude)],
//       },
//       drop: {
//         type: "Point",
//         coordinates: [parseFloat(dropLongitude), parseFloat(dropLangitude)],
//       },
//       userAuthenticationImage: req.file ? req.file.path : null,
//     };

//     const order = new OrderModel(orderData);
//     await order.save();

//     const captains = await UserModel.find({
//       $and: [
//         {
//           captainLocation: {
//             $near: {
//               $geometry: {
//                 type: "Point",
//                 coordinates: [
//                   parseFloat(pickupLongitude),
//                   parseFloat(pickupLangitude),
//                 ],
//               },
//               $maxDistance: 3000, // 10 km
//             },
//           },
//         },
//         { onDuty: true },
//         { role: "captain" },
//       ],
//     });
//     console.log("Captains found:", captains);
//     console.log(user);

//     // Send notifications to all captains in the background
//     sendNotificationsToCaptains(
//       [...captains, user],
//       "New Order",
//       "A new order has just been placed. Please review the details and proceed with pickup. Tap to view the order."
//     );

//     return res
//       .status(201)
//       .json({ message: "Order placed successfully!", order, captains });
//   } catch (error) {
//     console.error("Place Order Faield", error);
//     return res
//       .status(500)
//       .json({ message: "Place Order Faield", error: error.message });
//   }
// };

export const OnShowStatusOfOrder = async (req, res) => {
  const { orderId } = req.params;
  try {
    const order = await OrderModel.findOne({ _id: orderId }).populate(
      "acceptCaptain"
    );
    // console.log(order);
    if (order) {
      if (order?.status === "pending") {
        return res
          .status(200)
          .json({ message: "Your Order still Pending...!" });
      } else if (order.status === "accept") {
        return res.status(200).json(order);
      } else if (order.status === "completed") {
        return res
          .status(200)
          .json({ message: "Your Ride is completed...!", order });
      } else if (order.status === "escape") {
        return res.status(200).json({ message: "Your Order is escaped" });
      }
    }
  } catch (error) {
    console.error("Order status Faield", error);
    return res
      .status(500)
      .json({ message: "Order status Faield", error: error.message });
  }
};

export const onFetchAllOrders = async (req, res) => {
  const { user } = req;
  try {
    if (user.role !== "user") {
      return res
        .status(403)
        .json({ message: "You can't access this feature!" });
    }

    const orders = await OrderModel.find({ head: user._id });

    return res.status(200).json(orders);
  } catch (error) {
    console.error("Place Order Faield", error);
    return res
      .status(500)
      .json({ message: "Place Order Faield", error: error.message });
  }
};

export const onRePlaceOrder = async (req, res) => {
  const { user } = req;
  try {
    await OrderModel.findByIdAndUpdate(
      { _id: req.params.orderId, head: user._id },
      {
        $set: {
          status: "pending",
          orderPlaceDate: req.body.orderPlaceTime,
          orderPlaceTime: req.body.orderPlaceDate,
          rejectedCaptaine: [],
        },
      },
      { new: true }
    );

    return res.status(201).json({ message: "Re-place ordered...!" });
  } catch (error) {
    console.error("re-place order  Faield", error);
    return res
      .status(500)
      .json({ message: "re-place order Faield", error: error.message });
  }
};

export const onAddFavoriteOrder = async (req, res) => {
  const { orderId } = req.params;
  // console.log(orderId);
  try {
    const order = await OrderModel.findOne({ _id: orderId });
    order.favorite = !order.favorite;
    order.save();
    return res.status(201).json({ message: "Updated...!" });
  } catch (error) {
    console.error("favorite Order  Faield", error);
    return res
      .status(500)
      .json({ message: "favorite Order Faield", error: error.message });
  }
};

export const onFetchAllFaviouriteOrder = async (req, res) => {
  const { user } = req;
  try {
    const favoriteOrders = await OrderModel.find({
      favorite: true,
      head: user._id,
    });
    return res.status(200).json(favoriteOrders);
  } catch (error) {
    console.error("favorite Order fetching Faield", error);
    return res.status(500).json({
      message: "favorite Order fetching Faield",
      error: error.message,
    });
  }
};

export const onAddSavedOrder = async (req, res) => {
  const { orderId } = req.params;
  try {
    const order = await OrderModel.findOne({ _id: orderId });
    order.saved = !order.saved;
    order.save();
    return res.status(201).json({ message: "Updated...!" });
  } catch (error) {
    console.error("saved  Order  Faield", error);
    return res
      .status(500)
      .json({ message: "saved  Order Faield", error: error.message });
  }
};

export const onSavedOrdersFetch = async (req, res) => {
  const { user } = req;
  try {
    const savedOrders = await OrderModel.find({ head: user._id, saved: true });

    return res.status(200).json(savedOrders);
  } catch (error) {
    console.error("saved  Order fetch Faield", error);
    return res
      .status(500)
      .json({ message: "saved  Order fetch Faield", error: error.message });
  }
};

// feed back
export const onAddFeedBack = async (req, res) => {
  const { user } = req;
  try {
    const docs = new FeedbackModel({
      text: req.body.text,
      head: user._id,
    });
    await docs.save();

    return res.status(201).json({ message: "Thank You for your support..!" });
  } catch (error) {
    console.error("Feed back added  Faield", error);
    return res
      .status(500)
      .json({ message: "Feed back added  Faield", error: error.message });
  }
};

// first fetch completed order afer writen reviews
export const onFetchCompletedOrder = async (req, res) => {
  const { orderId } = req.params;
  const { user } = req;
  try {
    const completedOrder = await OrderModel.findOne({
      _id: orderId,
      head: user._id,
      status: "completed",
    }).populate({
      path: "acceptCaptain",
      select: "name mobile", // Only 'name' and 'mobile' fields will be populated
    });

    return res.status(200).json(completedOrder);
  } catch (error) {
    console.error("Fetch Completed order  Faield", error);
    return res
      .status(500)
      .json({ message: "Fetch Completed order  Faield", error: error.message });
  }
};

// review
export const onWriteReviews = async (req, res) => {
  const { orderId } = req.params;
  const { reviewRating, reviewTest, giveVehicleNumber } = req.body;
  try {
    await OrderModel.findByIdAndUpdate(
      { _id: orderId },
      {
        $set: {
          reviewRating,
          reviewTest,
          giveVehicleNumber,
        },
      },
      { new: true }
    );
    return res.status(201).json({ message: "reviews added succesfully...!" });
  } catch (error) {
    console.error("Post review Faield", error);
    return res
      .status(500)
      .json({ message: "Post review Faield", error: error.message });
  }
};

// cancel order

export const onCancelOrder = async (req, res) => {
  const { user } = req;
  const { orderId } = req.params;
  const { reason } = req.body;
  try {
    const updatedOrder = await OrderModel.findOneAndUpdate(
      { _id: orderId }, // Ensure only the order owner can cancel
      {
        $set: {
          cancelReason: {
            user: user._id,
            reason: reason,
          },
          status: "cancelled", // Optionally update the status to 'cancelled'
        },
      },
      { new: true } // Return the updated document
    );

    return res
      .status(201)
      .json({ message: "Order Canceled....!", updatedOrder });
  } catch (error) {
    console.error("Cancel Order Faield", error);
    return res
      .status(500)
      .json({ message: "Cancel Order Faield", error: error.message });
  }
};

export const onFetchOffersBanners = async (req, res) => {
  try {
    const bannerOffers = await BannerOffersModel.find({});

    return res.status(200).json(bannerOffers);
  } catch (error) {
    console.error("Holding Captaine failed", error);
    return res
      .status(500)
      .json({ message: "Holding Captaine failed", error: error.message });
  }
};

export const onLocationBasedCaptain = async (req, res) => {
  const { latitude, longitude } = req.params;
  const { user } = req;
  try {
    const captains = await UserModel.find({
      $and: [
        {
          captainLocation: {
            $near: {
              $geometry: {
                type: "Point",
                coordinates: [longitude, latitude],
              },
              $maxDistance: 3000, // 10 km
            },
          },
        },
        { onDuty: true },
      ],
    }).select("captainLocation");
    return res.status(200).json(captains);
  } catch (error) {
    console.error("Location Based Captain failed", error);
    return res
      .status(500)
      .json({ message: "Location Based Captain failed", error: error.message });
  }
};
