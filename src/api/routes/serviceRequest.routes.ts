import { Router } from "express"
import { asyncHandler } from "../../utils/asyncHandler"
import { createServiceRequest } from "../controllers/serviceRequest.controller"

const router = Router()

router.post("/", asyncHandler(createServiceRequest))

export default router
