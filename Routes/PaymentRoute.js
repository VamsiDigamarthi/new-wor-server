import express from "express";
import {
  onOrderCreate,
  onQrCodePaymentVerification,
  onVerifyPayment,
} from "../Controllers/PaymentController.js";

const router = express.Router();

router.post("/create-order", onOrderCreate);

router.post("/qr-payemnt-verification", onQrCodePaymentVerification);

router.post("/verify-payment", onVerifyPayment);

export default router;
