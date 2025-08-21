import express, { Express, Request, Response, NextFunction } from "express"
import createError from "http-errors"
import path from "path"
import cookieParser from "cookie-parser"
import logger from "morgan"
import prisma from "./src/config/database.config"
import dotenv from "dotenv"

import accountRoutes from "./src/api/routes/account.routes"
import FleetViewRouter from "./src/api/routes/fleet.view.routes"
import geoFenceRouter from "./src/api/routes/geofence.routes"
import testRouter from "./src/api/routes/test.routes"
import tagLookup from "./src/api/routes/tagLookup.routes"
import RolesRouter from "./src/api/routes/roles.routes"
import UsersRouter from "./src/api/routes/users.routes"
import authRouter from "./src/api/routes/auth.routes"
import telematicsAlertsRouter from "./src/api/routes/telematicsAlerts.routes"
import pmRouter from "./src/api/routes/pm.dot.routes"
import preventiveRouter from "./src/api/routes/pm.routes"
import eventMaster from "./src/api/routes/event.master.routes"

import _ from "lodash"
import cors from "cors"

// Load environment variables early
dotenv.config()

const app: Express = express()

// CORS configuration
const corsOptions: cors.CorsOptions = {
  origin: process.env.ALLOWED_ORIGINS?.split(",") ?? "*",
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
}

// Middleware setup
app.use(cors(corsOptions))
app.use(logger("dev"))
app.use(express.json())
app.use(express.urlencoded({ extended: false }))
app.use(cookieParser())
app.use(express.static(path.join(__dirname, "public")))

// Attach Prisma to each request
app.use((req, res, next) => {
  ;(req as any).prisma = prisma
  next()
})

import swaggerUi from "swagger-ui-express"
import swaggerDocument from "./swagger-output.json"
import { setupSwagger } from "./swagger"

// app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument))

setupSwagger(app)

// API Routes
app.use("/api/roles", RolesRouter)
app.use("/api/user", UsersRouter)
app.use("/api/", authRouter)
app.use("/api/account", accountRoutes)
app.use("/api/fleet", FleetViewRouter)
app.use("/api/geofence", geoFenceRouter)
app.use("/api/test", testRouter)
app.use("/api/tagLookup", tagLookup)
app.use("/api/telematicsAlerts", telematicsAlertsRouter)
app.use("/api/", pmRouter)
app.use("/api/pm", preventiveRouter)
app.use("/api/eventMaster", eventMaster)

// 404 Error Catcher
app.use(function (req: Request, res: Response, next: NextFunction) {
  next(createError(404))
})

// Global Error Handler
app.use(function (err: any, req: Request, res: Response, next: NextFunction) {
  res.locals.message = err.message
  res.locals.error = req.app.get("env") === "development" ? err : {}

  res
    .status(_.get(err, "status", 500))
    .json({ message: "Unknown issue occurred", error: err })
})

export default app
