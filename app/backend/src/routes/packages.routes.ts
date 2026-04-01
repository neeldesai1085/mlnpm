import { Router } from "express";
import {
    createPackage,
    getPackage,
    getPackages,
    updatePackage,
} from "../controllers/packages.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";

const router = Router();

router.post("/", requireAuth, createPackage);
router.patch("/:name", requireAuth, updatePackage);
router.get("/", getPackages);
router.get("/:name", getPackage);

export default router;
