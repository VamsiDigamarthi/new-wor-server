import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema({
  orderId: { type: String },
  paymentId: { type: String },
  signature: { type: String },
  status: { type: String },
});

const Payment = mongoose.model("Payment", paymentSchema);

export default Payment;
