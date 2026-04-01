import { Router } from "express";
import {
    publishVersion,
    getVersion,
    rollbackVersion,
} from "../controllers/versions.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";

const router = Router({ mergeParams: true });

router.post("/", requireAuth, publishVersion);
router.get("/:version", getVersion);
router.post("/:version/rollback", requireAuth, rollbackVersion);

export default router;
