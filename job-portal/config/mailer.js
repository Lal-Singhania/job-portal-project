import nodemailer from "nodemailer"

export const transporter = 
nodemailer.createTransport({
    service: "gamil",
    auth:{
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS
    }
});