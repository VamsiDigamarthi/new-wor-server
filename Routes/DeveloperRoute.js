import express from "express";
import { authenticateToken } from "../Middlewares/AuthMiddleware.js";

import { CheckingUser } from "../Middlewares/CheckingUser.js";
import { ensureDeveloperRole } from "../Middlewares/DeveloperMiddleware.js";
import {
  onAddCities,
  onAdminRegister,
  onDeleteAllOrders,
  onDeleteOneCaptaine,
  onDeleteUser,
  onFetchAllBanners,
  onPostBanners,
  onPostBannersOffer,
  onVerificationOfUser,
} from "../Controllers/DeveloperController.js";
import upload from "../Middlewares/fileUpload.js";

const router = express.Router();

router.post(
  "/baners",
  authenticateToken,
  CheckingUser,
  ensureDeveloperRole,
  upload.single("bannerImage"),
  onPostBanners
);

router.post(
  "/banners-offers",
  authenticateToken,
  CheckingUser,
  ensureDeveloperRole,
  upload.single("bannerImage"),
  onPostBannersOffer
);

router.get("/baners", authenticateToken, CheckingUser, onFetchAllBanners);

router.delete(
  "/orders",
  authenticateToken,
  CheckingUser,
  ensureDeveloperRole,
  onDeleteAllOrders
);

router.delete(
  "/delete-one-captaine/:captainId",
  authenticateToken,
  CheckingUser,
  ensureDeveloperRole,
  onDeleteOneCaptaine
);

router.patch("/delete-user", onDeleteUser);

// add cities

router.post(
  "/add-cities",
  authenticateToken,
  CheckingUser,
  ensureDeveloperRole,
  onAddCities
);

router.post(
  "/admin-reg",
  authenticateToken,
  CheckingUser,
  ensureDeveloperRole,
  onAdminRegister
);

router.patch(
  "/verification/:mobile",
  // authenticateToken,
  // CheckingUser,
  // ensureDeveloperRole,
  onVerificationOfUser
);

export default router;
