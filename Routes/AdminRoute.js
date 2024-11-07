import express from "express";
import { authenticateToken } from "../Middlewares/AuthMiddleware.js";
import { CheckingUser } from "../Middlewares/CheckingUser.js";
import { ensureAdminRole } from "../Middlewares/AdminMiddlewware.js";
import {
  onAdminLogin,
  onCaptainsAlongWithOrders,
  onCaptainUnVerified,
  onCaptainVerified,
  onFetchAllCaptains,
  onForgotPassword,
  onGetProfile,
  onVerifiedCaptainPanAadhar,
  onVerifyEmailOtp,
  onHoldingCaptain,
  onAllReviewsFetch,
} from "../Controllers/AdminController.js";

const router = express.Router();

router.post("/login", onAdminLogin);

router.get("/forgot-password", onForgotPassword);

router.post("/verify-email-otp", onVerifyEmailOtp);

router.get(
  "/profile",
  authenticateToken,
  CheckingUser,
  ensureAdminRole,
  onGetProfile
);

router.get(
  "/captains/:role",
  authenticateToken,
  CheckingUser,
  ensureAdminRole,
  onFetchAllCaptains
);

router.patch(
  "/captain-verified/:captainId",
  // authenticateToken,
  // CheckingUser,
  // ensureAdminRole,
  onCaptainVerified
);

router.patch("/captain-unverified/:captainId", onCaptainUnVerified);

router.patch(
  "/new-pan-verified/:captainId/context/:context",
  // authenticateToken,
  // CheckingUser,
  // ensureAdminRole,
  onVerifiedCaptainPanAadhar
);

router.get("/captain-review", onCaptainsAlongWithOrders);

router.patch("/holding-captain/:captanId", onHoldingCaptain);

router.get("/all-reviews", onAllReviewsFetch);

export default router;
