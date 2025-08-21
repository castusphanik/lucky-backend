import { Router } from "express"
import {
  createTagLookup,
  fetchTagLookups,
  getTagLookupById,
  updateTagLookup,
  //   deleteTagLookup,
} from "../controllers/tagLookup.controller" // adjust path
import { asyncHandler } from "../../utils/asyncHandler"

const router = Router()

router.post("/", asyncHandler(createTagLookup))
router.get("/", asyncHandler(fetchTagLookups))
router.get("/:id", asyncHandler(getTagLookupById))
router.patch("/:id", asyncHandler(updateTagLookup))
// router.delete("/:id", deleteTagLookup);

export default router
