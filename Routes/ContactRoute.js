import express from "express";
import { onContact } from "../Controllers/ContactController.js";

const router = express.Router();

router.post("/", onContact);

export default router;
