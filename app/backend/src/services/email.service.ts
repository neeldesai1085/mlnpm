import nodemailer from "nodemailer";
import { env } from "../config/env.js";

const transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_SECURE,
    auth: {
        user: env.SMTP_USER,
        pass: env.SMTP_PASS,
    },
});

export async function sendOtpEmail(to: string, otp: string) {
    await transporter.sendMail({
        from: env.SMTP_FROM,
        to,
        subject: "Your mlnpm verification code",
        text: `Your OTP is ${otp}. It expires in 10 minutes.`,
    });
}
