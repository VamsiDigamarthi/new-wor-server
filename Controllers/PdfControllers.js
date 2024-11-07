import PDFDocument from "pdfkit";
import nodemailer from "nodemailer";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { Readable } from "stream";
import "dotenv/config";
import UserModel from "../Modals/UserModal.js";

// Get __dirname equivalent in ES6 module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to the root `uploads` folder (relative to the root of the project)
const uploadsDir = path.join(process.cwd(), "uploads");

export const onGetPDF = async (req, res) => {
  try {
    const user = await UserModel.findOne({ mobile: req.params.mobile });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Create a PDF document
    const doc = new PDFDocument();

    // Generate a unique file name using timestamp (Date.now())
    const fileName = `${Date.now()}.pdf`;

    // Store the PDF in the root uploads folder
    const pdfPath = path.join(uploadsDir, fileName);
    const pdfStream = fs.createWriteStream(pdfPath);
    doc.pipe(pdfStream);

    // Customize the PDF content
    doc
      .fontSize(25)
      .text("User Profile", { align: "center" })
      .moveDown()
      .fontSize(18)
      .text(`Name: ${user.name}`)
      .text(`Email: ${user.mobile}`)
      .text(`Gender: ${user.gender}`);

    doc.end();

    // On PDF stream finish, send the response
    pdfStream.on("finish", () => {
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${fileName}"`
      );

      // Send JSON and PDF URL in the response
      res.status(200).json({
        message: "PDF generated and data sent",
        pdfUrl: `/uploads/${fileName}`,
        user,
      });
    });
  } catch (error) {
    console.log({ error: error.message, message: "pdf generation failed" });
    return res
      .status(500)
      .json({ message: "pdf generation failed", error: error.message });
  }
};

export const onGetPDFThoughEmail = async (req, res) => {
  try {
    const user = await UserModel.findOne({ mobile: req.params.mobile });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Create a PDF document in memory
    const doc = new PDFDocument();
    let buffers = [];

    // Capture PDF data in memory
    doc.on("data", buffers.push.bind(buffers));
    doc.on("end", async () => {
      // Create a readable stream from the buffers
      const pdfBuffer = Buffer.concat(buffers);
      const pdfStream = Readable.from(pdfBuffer);

      const hostingerEmail = process.env.EMAIL_USER;
      const hostingerPassword = process.env.EMAIL_PASS;

      let transporter = nodemailer.createTransport({
        host: "smtp.hostinger.com", // Hostinger's SMTP server
        port: 465, // Secure SMTP port
        secure: true, // true for 465, false for other ports
        auth: {
          user: hostingerEmail,
          pass: hostingerPassword,
        },
      });

      // Send the email
      const mailOptions = {
        from: hostingerEmail,
        to: req.body.email, // Use the user's email
        subject: "Your User Profile PDF",
        text: "Please find attached your user profile PDF.",
        attachments: [
          {
            filename: "user_profile.pdf",
            content: pdfBuffer,
            contentType: "application/pdf",
          },
        ],
      };

      // Send the email
      try {
        await transporter.sendMail(mailOptions);
        return res
          .status(200)
          .json({ message: "PDF generated and sent via email", user });
      } catch (emailError) {
        console.log({
          error: emailError.message,
          message: "Email sending failed",
        });
        return res
          .status(500)
          .json({ message: "Email sending failed", error: emailError.message });
      }
    });

    // Customize the PDF content
    doc
      .fontSize(25)
      .text("User Profile", { align: "center" })
      .moveDown()
      .fontSize(18)
      .text(`Name: ${user.name}`)
      .text(`Email: ${user.email}`) // Updated to use user.email instead of user.mobile
      .text(`Gender: ${user.gender}`);

    doc.end();
  } catch (error) {
    console.log({ error: error.message, message: "PDF generation failed" });
    return res
      .status(500)
      .json({ message: "PDF generation failed", error: error.message });
  }
};
