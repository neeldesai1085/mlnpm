import { Router } from "express";
import {
    register,
    login,
    getProfile,
    updateProfile,
    getCloudinarySignature,
    verifyOtp,
    resendOtp,
    requestPasswordReset,
    resendPasswordReset,
    verifyPasswordReset,
    resetPassword,
} from "../controllers/auth.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";

const router = Router();

router.post("/register", register);
router.post("/verify-otp", verifyOtp);
router.post("/resend-otp", resendOtp);
router.post("/request-password-reset", requestPasswordReset);
router.post("/resend-password-reset", resendPasswordReset);
router.post("/verify-password-reset", verifyPasswordReset);
router.post("/reset-password", resetPassword);
router.post("/login", login);
router.get("/me", requireAuth, getProfile);
router.patch("/profile", requireAuth, updateProfile);
router.get("/cloudinary-signature", requireAuth, getCloudinarySignature);

export default router;
