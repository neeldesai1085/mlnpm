import { Router } from "express";
import { getManifest } from "../controllers/manifest.controller.js";

const router = Router({ mergeParams: true });

router.get("/:version/manifest", getManifest);

export default router;
