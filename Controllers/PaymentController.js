import Razorpay from "razorpay";
import crypto from "crypto";
import "dotenv/config";
import Payment from "../Modals/PaymentModal.js";
import QRCode from "qrcode";
// Replace with your Razorpay Key and Secret
const razorpay = new Razorpay({
  key_id: process.env.YOUR_RAZORPAY_KEY_ID,
  key_secret: process.env.YOUR_RAZORPAY_KEY_SECRET,
});

export const onOrderCreate = async (req, res) => {
  const { amount, currency } = req.body;
  console.log(amount, currency);
  const options = {
    amount: amount * 100, // Convert amount to paise
    currency: currency || "INR",
    receipt: `receipt_${Math.random().toString(36).substring(2)}`,
  };
  try {
    const order = await razorpay.orders.create(options);
    const qrCodeData = {
      order_id: order.id,
      amount: options.amount,
      currency: options.currency,
    };

    // Create QR code
    const qrCodeURL = await QRCode.toDataURL(JSON.stringify(qrCodeData));
    console.log("QR code generated");
    // Send order details and QR code to client
    return res.status(200).json({
      order_id: order.id,
      qr_code: qrCodeURL,
    });

    // console.log(order);
    // return res.status(200).json(order);
  } catch (error) {
    console.log({ error: error, message: "Order creation error " });

    return res.status(500).json({ message: "Order creation error" });
  }
};

//

export const onQrCodePaymentVerification = async (req, res) => {
  const { order_id, amount } = req.body;
  console.log(order_id, amount);
  try {
    // Fetch payment details using the order ID
    const payment = await razorpay.payments.fetch(order_id);

    // Check if the payment is captured and the amount matches
    if (payment.status === "captured" && payment.amount === amount * 100) {
      return res
        .status(200)
        .json({ status: "success", message: "Payment verified" });
    } else {
      return res
        .status(400)
        .json({ status: "failure", message: "Payment verification failed" });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Error verifying payment" });
  }
};

export const onVerifyPayment = async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
    req.body;

  const secret = process.env.YOUR_RAZORPAY_KEY_SECRET;
  const generated_signature = crypto
    .createHmac("sha256", secret)
    .update(`${razorpay_order_id?.trim()}|${razorpay_payment_id?.trim()}`)
    .digest("hex");

  console.log("order id", razorpay_order_id);
  console.log("----------------------------------------------");
  console.log("paymnet_id", razorpay_payment_id);
  console.log("----------------------------------------------");
  console.log("signature", razorpay_signature);
  console.log("----------------------------------------------");
  console.log(generated_signature);
  if (generated_signature === razorpay_signature?.trim()) {
    // Payment is verified, send success response to the client

    console.log("Payment verification completed");
    return res.status(200).json({
      status: "Payment Verified",
      message: "Payment was successful!",
    });
  } else {
    // Payment failed verification, send error response
    console.log("Payment Error: ");
    return res.status(400).json({
      status: "Payment Verification Failed",
      message: "Payment verification failed",
    });
  }
};

// const payment = new Payment({
//   order_id: razorpay_order_id,
//   payment_id: razorpay_payment_id,
//   signature: razorpay_signature,
//   status: "verified",
// });
// try {
//   await payment.save();
//   console.log("Payment details saved to database successfully.");
// } catch (dbError) {
//   // Log the database error for monitoring
//   console.error(
//     "Database error occurred while saving payment details:",
//     dbError
//   );
// }
