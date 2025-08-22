"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const http_errors_1 = __importDefault(require("http-errors"));
const path_1 = __importDefault(require("path"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const morgan_1 = __importDefault(require("morgan"));
const database_config_1 = __importDefault(require("./src/config/database.config"));
const dotenv_1 = __importDefault(require("dotenv"));
const account_routes_1 = __importDefault(require("./src/api/routes/account.routes"));
const fleet_view_routes_1 = __importDefault(require("./src/api/routes/fleet.view.routes"));
const geofence_routes_1 = __importDefault(require("./src/api/routes/geofence.routes"));
const test_routes_1 = __importDefault(require("./src/api/routes/test.routes"));
const tagLookup_routes_1 = __importDefault(require("./src/api/routes/tagLookup.routes"));
const roles_routes_1 = __importDefault(require("./src/api/routes/roles.routes"));
const users_routes_1 = __importDefault(require("./src/api/routes/users.routes"));
const auth_routes_1 = __importDefault(require("./src/api/routes/auth.routes"));
const telematicsAlerts_routes_1 = __importDefault(require("./src/api/routes/telematicsAlerts.routes"));
const pm_dot_routes_1 = __importDefault(require("./src/api/routes/pm.dot.routes"));
const pm_routes_1 = __importDefault(require("./src/api/routes/pm.routes"));
const event_master_routes_1 = __importDefault(require("./src/api/routes/event.master.routes"));
const lodash_1 = __importDefault(require("lodash"));
const cors_1 = __importDefault(require("cors"));
// Load environment variables early
dotenv_1.default.config();
const app = (0, express_1.default)();
// CORS configuration
const corsOptions = {
    origin: process.env.ALLOWED_ORIGINS?.split(",") ?? "*",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
};
// Middleware setup
app.use((0, cors_1.default)(corsOptions));
app.use((0, morgan_1.default)("dev"));
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: false }));
app.use((0, cookie_parser_1.default)());
app.use(express_1.default.static(path_1.default.join(__dirname, "public")));
// Attach Prisma to each request
app.use((req, res, next) => {
    ;
    req.prisma = database_config_1.default;
    next();
});
const swagger_1 = require("./swagger");
// app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument))
(0, swagger_1.setupSwagger)(app);
// API Routes
app.use("/api/roles", roles_routes_1.default);
app.use("/api/user", users_routes_1.default);
app.use("/api/", auth_routes_1.default);
app.use("/api/account", account_routes_1.default);
app.use("/api/fleet", fleet_view_routes_1.default);
app.use("/api/geofence", geofence_routes_1.default);
app.use("/api/test", test_routes_1.default);
app.use("/api/tagLookup", tagLookup_routes_1.default);
app.use("/api/telematicsAlerts", telematicsAlerts_routes_1.default);
app.use("/api/", pm_dot_routes_1.default);
app.use("/api/pm", pm_routes_1.default);
app.use("/api/eventMaster", event_master_routes_1.default);
// 404 Error Catcher
app.use(function (req, res, next) {
    next((0, http_errors_1.default)(404));
});
// Global Error Handler
app.use(function (err, req, res, next) {
    res.locals.message = err.message;
    res.locals.error = req.app.get("env") === "development" ? err : {};
    res
        .status(lodash_1.default.get(err, "status", 500))
        .json({ message: "Unknown issue occurred", error: err });
});
exports.default = app;
