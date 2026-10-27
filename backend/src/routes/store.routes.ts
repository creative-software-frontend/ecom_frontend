import { Router } from "express";
import { getStoreSettings } from "../controllers/store.controller.js";

const router = Router();

router.get("/", getStoreSettings);

export default router;
