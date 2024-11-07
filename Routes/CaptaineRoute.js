import express from "express";
import { authenticateToken } from "../Middlewares/AuthMiddleware.js";
import {
  onAcceptOrder,
  onCaptaineGiveRatingToRide,
  onCaptainLocationTracking,
  onChangeMensProblem,
  onDuttyChange,
  onFetchAllCompletedOrders,
  onFetchAllOrders,
  onIsRideStartNaviage,
  onOrderCompleted,
  onOrderOTPVerification,
  onOrdersDeclaine,
  onUploadSecuritiesImages,
} from "../Controllers/CaptaineController.js";
import { CheckingUser } from "../Middlewares/CheckingUser.js";
import { ensureCaptainRole } from "../Middlewares/CaptaineMiddleware.js";
import upload from "../Middlewares/fileUpload.js";
import UserModel from "../Modals/UserModal.js";
import OrderModel from "../Modals/OrderModal.js";

const router = express.Router();

router.patch(
  "/change-dutty",
  authenticateToken,
  CheckingUser,
  ensureCaptainRole,
  upload.single("captainLiveImage"),
  onDuttyChange
);

// router.get(
//   "/orders/:longitude/:latitude/:distance/:currentData",
//   authenticateToken,
//   CheckingUser,
//   ensureCaptainRole,
//   onFetchAllOrders
// );

router.get(
  "/orders/:longitude/:latitude/:distance/:currentData",
  authenticateToken,
  CheckingUser,
  ensureCaptainRole,
  onFetchAllOrders
);

router.patch(
  "/mens-problem/:orderId",
  authenticateToken,
  CheckingUser,
  ensureCaptainRole,
  onChangeMensProblem
);

router.patch(
  "/accept-order/:orderId",
  authenticateToken,
  CheckingUser,
  ensureCaptainRole,
  onAcceptOrder
);

router.patch(
  "/isridestart-naviage/:orderId",
  authenticateToken,
  CheckingUser,
  ensureCaptainRole,
  onIsRideStartNaviage
);

router.patch(
  "/orders-rejected/:orderId",
  authenticateToken,
  CheckingUser,
  ensureCaptainRole,
  onOrdersDeclaine
);

router.patch(
  "/order-completed/:orderId",
  authenticateToken,
  CheckingUser,
  ensureCaptainRole,
  onOrderCompleted
);

router.get(
  "/completed-all-orders",
  authenticateToken,
  CheckingUser,
  ensureCaptainRole,
  onFetchAllCompletedOrders
);

router.patch(
  "/upload-security-image",
  authenticateToken,
  CheckingUser,
  // ensureCaptainRole,
  upload.fields([
    { name: "license", maxCount: 1 },
    { name: "pan", maxCount: 1 },
    { name: "adhar", maxCount: 1 },
    { name: "adharBack", maxCount: 1 },
    { name: "rc", maxCount: 1 },
    { name: "authenticationImage", maxCount: 1 },
  ]),
  onUploadSecuritiesImages
);

router.patch(
  "/rating-by-captain/:orderId",
  authenticateToken,
  CheckingUser,
  ensureCaptainRole,
  onCaptaineGiveRatingToRide
);

router.patch(
  "/location-tracking",
  authenticateToken,
  CheckingUser,
  ensureCaptainRole,
  onCaptainLocationTracking
);

/* 
  Captain Verified OTP this otp is each order chechking OTP
*/

router.patch(
  "/order-otp-verified/:orderId",
  authenticateToken,
  CheckingUser,
  ensureCaptainRole,
  onOrderOTPVerification
);

export default router;
