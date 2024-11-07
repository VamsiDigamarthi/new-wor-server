import express from "express";
import {
  createChat,
  findChat,
  ondeletedChat,
  userChats,
} from "../Controllers/ChatControllers.js";
import { authenticateToken } from "../Middlewares/AuthMiddleware.js";
import { CheckingUser } from "../Middlewares/CheckingUser.js";

const router = express.Router();

router.post("/", authenticateToken, CheckingUser, createChat);

router.get("/own-all-chats", authenticateToken, CheckingUser, userChats);
router.get("/find/:receiverId", authenticateToken, CheckingUser, findChat);

router.delete("/:chatId", authenticateToken, CheckingUser, ondeletedChat);

export default router;
