import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import mongoose from "mongoose";
import http from "http";
import { Server } from "socket.io";
import cluster from "cluster";
import { cpus } from "os";
const numCPUs = cpus().length;

import "dotenv/config";
import AuthRoute from "./Routes/AuthRoute.js";
import errorHandler from "./Middlewares/errorHandle.js";
import Captain from "./Routes/CaptaineRoute.js";
import UserRoute from "./Routes/UserRoute.js";
import DeveloperRoute from "./Routes/DeveloperRoute.js";
import ChartRoute from "./Routes/ChatRoute.js";
import MessageRoute from "./Routes/MessageRoute.js";
import ContactRoute from "./Routes/ContactRoute.js";
import UserModel from "./Modals/UserModal.js";
import PDFRoute from "./Routes/PdfRoute.js";

import AdminRoute from "./Routes/AdminRoute.js";
import OrderModel from "./Modals/OrderModal.js";

import Payment from "./Routes/PaymentRoute.js";

const app = express();
app.use(bodyParser.json({ limit: "30mb", extended: true }));
app.use(bodyParser.urlencoded({ limit: "30mb", extended: true }));
app.use(
  cors({
    origin: "*", // Allow requests from this origin
    optionsSuccessStatus: 200, // Some legacy browsers choke on 204
  })
);
app.use(express.json());
app.use("/uploads", express.static("uploads"));
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET,POST,PUT,PATCH,DELETE,OPTIONS"
  );
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  next();
});

let requestCount = 0;

// Custom middleware to count requests
app.use((req, res, next) => {
  requestCount++;
  // console.log(`Total Requests: ${requestCount}`);
  next(); // Call the next middleware
});

console.log(requestCount);

// Error Handling Middleware - should be the last middleware added
app.use(errorHandler);

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

// if (cluster.isMaster) {
//   console.log(`Master ${process.pid} is running`);

//   for (let i = 0; i < numCPUs - 3; i++) {
//     cluster.fork();
//   }
//   cluster.on("exit", (worker, code, signal) => {
//     console.log(`Worker ${worker.process.pid} died`);
//   });
// } else {
mongoose
  .connect(`${process.env.MONGODB_URL}`)
  .then(() =>
    server.listen(process.env.PORT, () =>
      console.log(`Server listening on ${process.env.PORT} .....!`)
    )
  )
  .catch((error) => console.log(error));
// mongoose
//   .connect(`${process.env.MONGODB_URL}women_rapido`)
//   .then(() =>
//     server.listen(process.env.PORT, () =>
//       console.log(`Server listening on ${process.env.PORT} .....!`)
//     )
//   )
//   .catch((error) => console.log(error));
// }

app.get("/", (req, res) => {
  return res.status(200).json({ message: "Welcome to Womens Rapido......!" });
});

app.use("/auth", AuthRoute);

app.use("/captain", Captain);

app.use("/user", UserRoute);

app.use("/developer", DeveloperRoute);

app.use("/chat", ChartRoute);

app.use("/message", MessageRoute);

app.use("/contact", ContactRoute);
app.use("/pdf", PDFRoute);

app.use("/admin", AdminRoute);

app.use("/payment", Payment);

// setInterval(checkAndBookRides, 60000);

app.delete("/account-delete/:mobile", async (req, res) => {
  const { mobile } = req.params;
  // console.log(mobile);
  try {
    const user = await UserModel.findOne({ mobile });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    await OrderModel.deleteMany({ head: user._id });
    await UserModel.deleteOne({ mobile });
    return res.status(204).json({ message: "Account deleted successfully." });
  } catch (error) {
    console.error("Account deletion failed", error);
    return res
      .status(500)
      .json({ message: "Failed to delete account. Please try again later." });
  }
});

app.delete("/orders/:orderId", async (req, res) => {
  try {
    await OrderModel.deleteMany({ head: req.params.orderId });
    return res
      .status(204)
      .json({ message: "All orders deleted successfully." });
  } catch (error) {
    console.error("Failed to delete orders", error);
    return res
      .status(500)
      .json({ message: "Failed to delete orders. Please try again later." });
  }
});

let activeUsers = [];
let userCoordinates = {}; // To store user coordinates

io.on("connection", (socket) => {
  // console.log("New user connected");
  socket.on("new-user-add", (newUserId) => {
    if (!activeUsers.some((user) => user.userId === newUserId)) {
      activeUsers.push({ userId: newUserId, socketId: socket.id });
    }
    console.log(activeUsers);
    io.emit("get-users", activeUsers);
  });

  socket.on("disconnect", () => {
    activeUsers = activeUsers.filter((user) => user.socketId !== socket.id);
    io.emit("get-users", activeUsers);
  });

  socket.on("send-message", (data) => {
    const { receiverId } = data;
    const user = activeUsers.find((user) => user.userId === receiverId);

    if (user) {
      io.to(user.socketId).emit("recieve-message", data);
    }
  });

  socket.on("send-coordinates", (data) => {
    // console.log("data", data);
    const { userId, coordinates } = data;
    userCoordinates[userId] = coordinates; // Save user coordinates

    const parentUser = activeUsers.find((user) => user.userId === userId);

    if (parentUser) {
      io.to(parentUser.socketId).emit("receive-coordinates", {
        userId: userId,
        coordinates: coordinates,
      });
    }
  });
});
