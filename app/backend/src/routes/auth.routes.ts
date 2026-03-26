import { Router } from "express";
import {
    register,
    login,
    verifyOtp,
    resendOtp,
    requestPasswordReset,
    resendPasswordReset,
    verifyPasswordReset,
    resetPassword,
} from "../controllers/auth.controller.js";

const router = Router();

router.post("/register", register);
router.post("/verify-otp", verifyOtp);
router.post("/resend-otp", resendOtp);
router.post("/request-password-reset", requestPasswordReset);
router.post("/resend-password-reset", resendPasswordReset);
router.post("/verify-password-reset", verifyPasswordReset);
router.post("/reset-password", resetPassword);
router.post("/login", login);

export default router;
