"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createTelematicsAlert = createTelematicsAlert;
exports.getTelematicsAlert = getTelematicsAlert;
exports.getTelematicsAlertsByCustomer = getTelematicsAlertsByCustomer;
exports.updateTelematicsAlert = updateTelematicsAlert;
exports.deleteTelematicsAlert = deleteTelematicsAlert;
exports.previewTelematicsAlert = previewTelematicsAlert;
const database_config_1 = __importDefault(require("../../config/database.config"));
const responseUtils_1 = require("../../utils/responseUtils");
const toDateOrNull = (v) => !v ? null : v instanceof Date ? v : new Date(v);
const deliveryMethodLabel = (code) => code === 1
    ? "Text"
    : code === 2
        ? "Email"
        : code === 3
            ? "In portal"
            : code === 4
                ? "Webhook"
                : "Not set";
const ALLOWED_FREQUENCY = new Set(["AS_IT_HAPPENS", "DAILY", "WEEKLY"]);
const validateFrequency = (raw) => {
    if (!raw)
        return null;
    if (typeof raw === "string") {
        const v = raw.trim().toUpperCase();
        return ALLOWED_FREQUENCY.has(v) ? { type: v } : null;
    }
    if (typeof raw === "object" && !Array.isArray(raw)) {
        const v = raw.type?.trim()?.toUpperCase();
        return ALLOWED_FREQUENCY.has(v) ? { type: v } : null;
    }
    if (Array.isArray(raw)) {
        const validated = raw
            .map((item) => {
            if (typeof item === "object" && item?.type) {
                const v = item.type.trim().toUpperCase();
                return ALLOWED_FREQUENCY.has(v) ? { type: v } : null;
            }
            return null;
        })
            .filter(Boolean);
        return validated.length ? validated : null;
    }
    return null;
};
function buildPreview(a) {
    const events = Array.isArray(a.selected_events)
        ? a.selected_events
            .map((e) => e?.name ?? e)
            .filter(Boolean)
            .join(", ")
        : "";
    const period = a.between_hours_from && a.between_hours_to
        ? "Between Hours"
        : Array.isArray(a.specific_days) && a.specific_days.length
            ? "Specific Weekdays"
            : a.start_date || a.end_date
                ? "Start / End Date"
                : "Always";
    const equipment = Array.isArray(a.equipment_list) && a.equipment_list.length
        ? `${a.equipment_list.length} selected`
        : "Not set";
    const recipients = a.recipients ?? "Recipients not set";
    // delivery_frequency is Json in schema; we store a single string value
    const freq = typeof a.delivery_frequency === "string"
        ? a.delivery_frequency
        : a.delivery_frequency
            ? JSON.stringify(a.delivery_frequency)
            : "Not set";
    return {
        Events: events || "None",
        Period: period,
        Equipment: equipment,
        "Delivery Method": deliveryMethodLabel(a.delivery_methods),
        Recipients: recipients,
        "Delivery Frequency": freq,
    };
}
async function createTelematicsAlert(req, res) {
    try {
        const b = req.body ?? {};
        const required = [
            "customer_id",
            "account_id",
            "geofence_event_type_lookup_id",
            "status",
            "delivery_methods",
            "delivery_frequency",
        ];
        for (const k of required) {
            if (b[k] === undefined || b[k] === null) {
                return (0, responseUtils_1.sendErrorResponse)(res, `Missing required field: ${k}`, 400);
            }
        }
        const freq = validateFrequency(b.delivery_frequency);
        if (!freq) {
            return (0, responseUtils_1.sendErrorResponse)(res, "delivery_frequency must be declared", 400);
        }
        const dm = Number(b.delivery_methods);
        if (![1, 2, 3, 4].includes(dm)) {
            return (0, responseUtils_1.sendErrorResponse)(res, "delivery_methods must be 1|2|3|4", 400);
        }
        const now = new Date();
        const r = await database_config_1.default.geofence_alerts.create({
            data: {
                customer_id: Number(b.customer_id),
                account_id: b.account_id,
                geofence_event_type_lookup_id: Number(b.geofence_event_type_lookup_id),
                status: String(b.status),
                delivery_methods: dm,
                delivery_frequency: freq,
                deleted_at: now,
                updated_at: now,
                is_deleted: false,
                deleted_by: b.deleted_by ?? null,
                created_by: b.created_by ?? null,
                updated_by: b.updated_by ?? null,
                selected_events: b.selected_events ?? null,
                between_hours_from: b.between_hours_from ?? null,
                between_hours_to: b.between_hours_to ?? null,
                specific_days: b.specific_days ?? null,
                start_date: toDateOrNull(b.start_date),
                end_date: toDateOrNull(b.end_date),
                event_duration: b.event_duration ?? null,
                equipment_list: b.equipment_list ?? null,
                recipients: b.recipients ?? null,
                alert_enabled: b.alert_enabled ?? true,
            },
        });
        return (0, responseUtils_1.sendSuccessResponse)(res, { alert: r, preview: buildPreview(r) }, "Success", 201);
    }
    catch (e) {
        console.error("createTelematicsAlert error:", e);
        return (0, responseUtils_1.sendErrorResponse)(res, "Failed to create alert", 500);
    }
}
async function getTelematicsAlert(req, res) {
    try {
        const id = Number(req.params.id);
        const r = await database_config_1.default.geofence_alerts.findUnique({
            where: { geofence_alert_id: id },
        });
        if (!r)
            return (0, responseUtils_1.sendErrorResponse)(res, "Alert not found", 404);
        return (0, responseUtils_1.sendSuccessResponse)(res, { alert: r, preview: buildPreview(r) });
    }
    catch (e) {
        console.error("getTelematicsAlert error:", e);
        return (0, responseUtils_1.sendErrorResponse)(res, "Failed to get alert", 500);
    }
}
async function getTelematicsAlertsByCustomer(req, res) {
    try {
        const { customer_id } = req.query;
        if (!customer_id) {
            return (0, responseUtils_1.sendErrorResponse)(res, "Missing required parameter: customer_id", 400);
        }
        const customerIdNum = Number(customer_id);
        if (isNaN(customerIdNum)) {
            return (0, responseUtils_1.sendErrorResponse)(res, "customer_id must be a number", 400);
        }
        const alerts = await database_config_1.default.geofence_alerts.findMany({
            where: { customer_id: customerIdNum },
        });
        return (0, responseUtils_1.sendSuccessResponse)(res, { alerts });
    }
    catch (error) {
        console.error("Error fetching telematics alerts:", error);
        return (0, responseUtils_1.sendErrorResponse)(res, "Failed to fetch telematics alerts", 500);
    }
}
async function updateTelematicsAlert(req, res) {
    try {
        const id = Number(req.params.id);
        const b = req.body ?? {};
        // optional validation if these keys are present
        let freqUpdate;
        if ("delivery_frequency" in b) {
            const v = validateFrequency(b.delivery_frequency);
            if (!v) {
                return (0, responseUtils_1.sendErrorResponse)(res, "delivery_frequency must be one of: As it happens, Once per day, Once per week", 400);
            }
            freqUpdate = v;
        }
        let dmUpdate;
        if ("delivery_methods" in b) {
            const dm = Number(b.delivery_methods);
            if (![1, 2, 3, 4].includes(dm)) {
                return (0, responseUtils_1.sendErrorResponse)(res, "delivery_methods must be 1|2|3|4", 400);
            }
            dmUpdate = dm;
        }
        const r = await database_config_1.default.geofence_alerts.update({
            where: { geofence_alert_id: id },
            data: {
                customer_id: b.customer_id !== undefined ? Number(b.customer_id) : undefined,
                account_id: b.account_id !== undefined ? b.account_id : undefined, // Json
                geofence_event_type_lookup_id: b.geofence_event_type_lookup_id !== undefined
                    ? Number(b.geofence_event_type_lookup_id)
                    : undefined,
                status: b.status !== undefined ? String(b.status) : undefined,
                delivery_methods: dmUpdate,
                delivery_frequency: freqUpdate,
                updated_at: new Date(),
                updated_by: b.updated_by ?? undefined,
                selected_events: b.selected_events ?? undefined,
                between_hours_from: b.between_hours_from ?? undefined,
                between_hours_to: b.between_hours_to ?? undefined,
                specific_days: b.specific_days ?? undefined,
                start_date: b.start_date !== undefined ? toDateOrNull(b.start_date) : undefined,
                end_date: b.end_date !== undefined ? toDateOrNull(b.end_date) : undefined,
                event_duration: b.event_duration ?? undefined,
                equipment_list: b.equipment_list ?? undefined,
                recipients: b.recipients ?? undefined,
                alert_enabled: b.alert_enabled ?? undefined,
            },
        });
        return (0, responseUtils_1.sendSuccessResponse)(res, { alert: r, preview: buildPreview(r) });
    }
    catch (e) {
        console.error("updateTelematicsAlert error:", e);
        return (0, responseUtils_1.sendErrorResponse)(res, "Failed to update alert", 500);
    }
}
async function deleteTelematicsAlert(req, res) {
    try {
        const id = Number(req.params.id);
        const { user_id } = (req.body || {});
        const r = await database_config_1.default.geofence_alerts.update({
            where: { geofence_alert_id: id },
            data: {
                is_deleted: true,
                deleted_at: new Date(),
                deleted_by: user_id ?? null,
                updated_at: new Date(),
            },
        });
        return (0, responseUtils_1.sendSuccessResponse)(res, { alert: r });
    }
    catch (e) {
        console.error("deleteTelematicsAlert error:", e);
        return (0, responseUtils_1.sendErrorResponse)(res, "Failed to delete alert", 500);
    }
}
async function previewTelematicsAlert(req, res) {
    try {
        const p = buildPreview(req.body ?? {});
        return (0, responseUtils_1.sendSuccessResponse)(res, { preview: p });
    }
    catch (e) {
        console.error("previewTelematicsAlert error:", e);
        return (0, responseUtils_1.sendErrorResponse)(res, "Failed to build preview", 500);
    }
}
