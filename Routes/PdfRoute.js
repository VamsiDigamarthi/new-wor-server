import express from "express";

import { authenticateToken } from "../Middlewares/AuthMiddleware.js";
import { CheckingUser } from "../Middlewares/CheckingUser.js";
import {
  onGetPDF,
  onGetPDFThoughEmail,
} from "../Controllers/PdfControllers.js";

const router = express.Router();

router.get("/:mobile", onGetPDF);

router.post("/:mobile/through-email", onGetPDFThoughEmail);

export default router;
