import { Router } from "express";
import {
    publishVersion,
    getVersion,
    verifyVersion,
    rollbackVersion,
    deleteVersion,
} from "../controllers/versions.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";

const router = Router({ mergeParams: true });

router.post("/", requireAuth, publishVersion);
router.get("/:version", getVersion);
router.post("/:version/verify", requireAuth, verifyVersion);
router.post("/:version/rollback", requireAuth, rollbackVersion);
router.delete("/:version", requireAuth, deleteVersion);

export default router;
