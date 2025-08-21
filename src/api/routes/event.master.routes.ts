import { Router } from "express";
import { asyncHandler } from "../../utils/asyncHandler";

import {
  createEventMaster,
  getAllEventMasters,
} from "../controllers/event.master.controller";

const router = Router();

// POST -> create new event master
router.post("/", asyncHandler(createEventMaster));
router.get("/", asyncHandler(getAllEventMasters));

export default router;
