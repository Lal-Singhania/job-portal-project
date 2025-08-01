import express from "express";
import { transporter } from "../config/mailer.js";
import dotenv from "dotenv";

dotenv.config();

const router = express.Router();

router.get("/faq", (req, res) => {
  res.render("faq", { messageSent: false });
});

router.post("/faq", async (req, res) => {
  const { name, email, message } = req.body;

  try {
    await transporter.sendMail({
      from: process.env.MAIL_USER,
      to: process.env.MAIL_USER,
      subject: `FAQ Message from ${name}`,
      text: `Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`,
    });

    res.render("faq", { messageSent: true });
  } catch (error) {
    console.error("FAQ email send error:", error);
    res.status(500).send("Something went wrong while sending your message.");
  }
});

export default router;
