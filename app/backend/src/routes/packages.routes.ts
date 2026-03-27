import { Router } from "express";
import { createPackage, getPackage, getPackages } from "../controllers/packages.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";

const router = Router();

router.post("/", requireAuth, createPackage);
router.get("/", getPackages);
router.get("/:name", getPackage);

export default router;