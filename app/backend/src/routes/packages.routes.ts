import { Router } from "express";
import { createPackage, getPackage } from "../controllers/packages.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";

const router = Router();

router.post("/", requireAuth, createPackage);
router.get("/:name", getPackage);

export default router;