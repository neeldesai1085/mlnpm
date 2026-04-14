import { env } from "../config/env.js";

export async function sendOtpEmail(to: string, otp: string) {
    const res = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: {
            "api-key": env.BREVO_API_KEY,
            "Content-Type": "application/json",
            "accept": "application/json"
        },
        body: JSON.stringify({
            sender: { email: env.SENDER_EMAIL, name: "mlnpm Verification" },
            to: [{ email: to }],
            subject: "Your mlnpm verification code",
            textContent: `Your OTP is ${otp}. It expires in 10 minutes.`
        })
    });

    if (!res.ok) {
        const errorData = await res.text();
        console.error("Brevo Email Error:", errorData);
        throw new Error(`Failed to send email via Brevo: ${res.status}`);
    }
}

export async function sendPasswordResetOtpEmail(
    to: string,
    username: string,
    otp: string,
) {
    const res = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: {
            "api-key": env.BREVO_API_KEY,
            "Content-Type": "application/json",
            "accept": "application/json"
        },
        body: JSON.stringify({
            sender: { email: env.SENDER_EMAIL, name: "mlnpm Support" },
            to: [{ email: to }],
            subject: "Your mlnpm password reset code",
            textContent: `Username: ${username}\nYour password reset OTP is ${otp}. It expires in 10 minutes.`
        })
    });

    if (!res.ok) {
        const errorData = await res.text();
        console.error("Brevo Password Reset Email Error:", errorData);
        throw new Error(`Failed to send email via Brevo: ${res.status}`);
    }
}
