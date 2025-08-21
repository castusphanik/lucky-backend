import { Router } from "express"
import {
  loginHandler,
  exchangeTokenHandler,
} from "../controllers/auth.controller"

const router = Router()

router.post("/login", loginHandler)
router.post("/exchangeToken", exchangeTokenHandler)

export default router
