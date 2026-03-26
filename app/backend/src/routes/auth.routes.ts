import { Router } from "express";
import {
    register,
    login,
    verifyOtp,
    resendOtp,
} from "../controllers/auth.controller.js";

const router = Router();

router.post("/register", register);
router.post("/verify-otp", verifyOtp);
router.post("/resend-otp", resendOtp);
router.post("/login", login);

export default router;
