import express from "express";
import { addMessage, getMessages } from "../Controllers/MessageControllers.js";
import { authenticateToken } from "../Middlewares/AuthMiddleware.js";
import { CheckingUser } from "../Middlewares/CheckingUser.js";

const router = express.Router();

router.post("/", authenticateToken, CheckingUser, addMessage);

router.get("/:chatId", authenticateToken, CheckingUser, getMessages);

export default router;
