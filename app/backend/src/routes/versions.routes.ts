import { Router } from "express";
import { publishVersion, getVersion } from "../controllers/versions.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";

const router = Router({ mergeParams: true });

router.post("/", requireAuth, publishVersion);
router.get("/:version", getVersion);

export default router;