"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllEventMasters = exports.createEventMaster = void 0;
const database_config_1 = __importDefault(require("../../config/database.config"));
const responseUtils_1 = require("../../utils/responseUtils");
// POST - Create Event Master
const createEventMaster = async (req, res) => {
    try {
        const { event_name, event_type, metric_value, operation_type } = req.body;
        // Basic validation
        if (!event_name || typeof event_name !== "string") {
            return (0, responseUtils_1.sendErrorResponse)(res, "Invalid or missing event_name", 400);
        }
        if (!event_type || typeof event_type !== "string") {
            return (0, responseUtils_1.sendErrorResponse)(res, "Invalid or missing event_type", 400);
        }
        if (metric_value !== undefined && typeof metric_value !== "number") {
            return (0, responseUtils_1.sendErrorResponse)(res, "metric_value must be a number", 400);
        }
        // if (!operation_type || typeof operation_type !== "string") {
        //   return sendErrorResponse(res, "Invalid or missing operation_type", 400);
        // }
        // Create new event_master record
        const newEvent = await database_config_1.default.event_master.create({
            data: {
                event_name,
                event_type,
                metric_value: metric_value ?? 0, // default 0 if not provided
                operation_type,
                created_at: new Date(),
                updated_at: new Date(),
            },
            select: {
                event_master_id: true,
                event_name: true,
                event_type: true,
                metric_value: true,
                operation_type: true,
                created_at: true,
                updated_at: true,
            },
        });
        return (0, responseUtils_1.sendSuccessResponse)(res, newEvent, "Event created successfully");
    }
    catch (error) {
        console.error("createEventMaster error:", error);
        if (error.code === "P2002") {
            return (0, responseUtils_1.sendErrorResponse)(res, "Duplicate event found", 400);
        }
        return (0, responseUtils_1.sendErrorResponse)(res, "Internal server error");
    }
};
exports.createEventMaster = createEventMaster;
const getAllEventMasters = async (req, res) => {
    try {
        const events = await database_config_1.default.event_master.findMany({
            orderBy: {
                event_master_id: "asc",
            },
            select: {
                event_master_id: true,
                event_name: true,
                event_type: true,
                metric_value: true,
                operation_type: true,
                created_at: true,
                updated_at: true,
            },
        });
        // return res.status(200).json({
        //   success: true,
        //   count: events.length,
        //   data: events,
        // });
        return (0, responseUtils_1.sendSuccessResponse)(res, events, "Event fetched successfully");
    }
    catch (error) {
        console.error("❌ Error fetching event masters:", error); // log full object
        return res.status(500).json({
            success: false,
            message: "Failed to fetch event masters",
            error: error.message || error, // show message if present
        });
    }
};
exports.getAllEventMasters = getAllEventMasters;
