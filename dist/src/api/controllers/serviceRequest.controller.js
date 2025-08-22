"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createServiceRequest = createServiceRequest;
const database_config_1 = __importDefault(require("../../config/database.config"));
const responseUtils_1 = require("../../utils/responseUtils");
async function createServiceRequest(req, res) {
    try {
        const { 
        // required in DB
        urgency_code, issue_description, created_at, created_by, 
        // one of these
        equipment_id, external_unit_number, 
        // optional DB fields
        service_type_lookup_id, saved_location_id, po_reference, driver_name, driver_phone, driver_with_unit, // Boolean in schema
        primary_contact_name, primary_contact_phone, primary_contact_email, pref_email, pref_phone, pref_sms, location_line1, location_line2, save_location, last_pm_date, next_pm_due, attachment_id, agreed_terms, 
        // UI-only
        secondary_contact_name, secondary_contact_phone, secondary_contact_email, } = req.body ?? {};
        // ---- Requireds
        if (!urgency_code)
            return (0, responseUtils_1.sendErrorResponse)(res, "urgency_code is required", 400);
        if (!issue_description)
            return (0, responseUtils_1.sendErrorResponse)(res, "issue_description is required", 400);
        if (!created_at)
            return (0, responseUtils_1.sendErrorResponse)(res, "created_at (ISO datetime) is required", 400);
        if (!created_by)
            return (0, responseUtils_1.sendErrorResponse)(res, "created_by is required", 400);
        // ---- Exactly one of equipment_id OR external_unit_number
        const hasEquipmentId = equipment_id != null;
        const hasExternalUnit = !!external_unit_number;
        if ((hasEquipmentId ? 1 : 0) + (hasExternalUnit ? 1 : 0) !== 1) {
            return (0, responseUtils_1.sendErrorResponse)(res, "Provide exactly one of equipment_id OR external_unit_number (not both).", 400);
        }
        // ---- Resolve urgency_code
        const urgency = await database_config_1.default.service_urgency_lookup.findUnique({
            where: { urgency_code },
            select: { service_urgency_lookup_id: true },
        });
        if (!urgency)
            return (0, responseUtils_1.sendErrorResponse)(res, `Unknown urgency_code '${urgency_code}'`, 400);
        // ---- Optional FK checks
        let equipmentId = null;
        if (hasEquipmentId) {
            const eq = await database_config_1.default.equipment.findUnique({
                where: { equipment_id: Number(equipment_id) },
                select: { equipment_id: true },
            });
            if (!eq)
                return (0, responseUtils_1.sendErrorResponse)(res, "Equipment not found", 404);
            equipmentId = eq.equipment_id;
        }
        let serviceTypeId = null;
        if (service_type_lookup_id != null) {
            const st = await database_config_1.default.service_type_lookup.findUnique({
                where: { service_type_lookup_id: Number(service_type_lookup_id) },
                select: { service_type_lookup_id: true },
            });
            if (!st)
                return (0, responseUtils_1.sendErrorResponse)(res, "service_type_lookup_id not found", 400);
            serviceTypeId = st.service_type_lookup_id;
        }
        let savedLocId = null;
        if (saved_location_id != null) {
            const sl = await database_config_1.default.service_saved_location.findUnique({
                where: { service_saved_location_id: Number(saved_location_id) },
                select: { service_saved_location_id: true },
            });
            if (!sl)
                return (0, responseUtils_1.sendErrorResponse)(res, "saved_location_id not found", 400);
            savedLocId = sl.service_saved_location_id;
        }
        // attachment_id is a FK (BigInt). If provided, verify it exists.
        let attachmentIdBig = null;
        if (attachment_id != null) {
            const att = await database_config_1.default.attachment.findUnique({
                where: { attachment_id: BigInt(attachment_id) },
                select: { attachment_id: true },
            });
            if (!att)
                return (0, responseUtils_1.sendErrorResponse)(res, "attachment_id not found", 400);
            attachmentIdBig = att.attachment_id;
        }
        // ---- Optional: basic validation for secondary contact echo
        const anySecondary = !!secondary_contact_name ||
            !!secondary_contact_phone ||
            !!secondary_contact_email;
        if (anySecondary) {
            if (!secondary_contact_phone || !secondary_contact_email) {
                return (0, responseUtils_1.sendErrorResponse)(res, "secondary_contact_phone and secondary_contact_email are required when adding a secondary contact.", 400);
            }
        }
        // ---- Build create payload
        const data = {
            equipment_id: equipmentId,
            external_unit_number: equipmentId ? null : external_unit_number ?? null,
            service_urgency_lookup_id: urgency.service_urgency_lookup_id,
            service_type_lookup_id: serviceTypeId,
            issue_description,
            po_reference: po_reference ?? null,
            driver_name: driver_name ?? null,
            driver_phone: driver_phone ?? null,
            driver_with_unit: typeof driver_with_unit === "boolean" ? driver_with_unit : false,
            primary_contact_name: primary_contact_name ?? null,
            primary_contact_phone: primary_contact_phone ?? null,
            primary_contact_email: primary_contact_email ?? null,
            pref_email: Boolean(pref_email ?? false),
            pref_phone: Boolean(pref_phone ?? false),
            pref_sms: Boolean(pref_sms ?? false),
            location_line1: location_line1 ?? null,
            location_line2: location_line2 ?? null,
            saved_location_id: savedLocId,
            save_location: Boolean(save_location ?? false),
            last_pm_date: last_pm_date ? new Date(last_pm_date) : null,
            next_pm_due: next_pm_due ? new Date(next_pm_due) : null,
            attachment_id: attachmentIdBig, // verified above; may be null
            agreed_terms: Boolean(agreed_terms ?? false),
            created_at: new Date(created_at),
            created_by: String(created_by),
        };
        // ---- Create
        const created = await database_config_1.default.service_request.create({
            data,
            // Don’t select BigInt fields (attachment_id) to avoid JSON issues.
            select: {
                service_request_id: true,
                equipment_id: true,
                external_unit_number: true,
                service_urgency_lookup_id: true,
                service_type_lookup_id: true,
                saved_location_id: true,
                issue_description: true,
                po_reference: true,
                driver_name: true,
                driver_phone: true,
                driver_with_unit: true,
                primary_contact_name: true,
                primary_contact_phone: true,
                primary_contact_email: true,
                pref_email: true,
                pref_phone: true,
                pref_sms: true,
                location_line1: true,
                location_line2: true,
                save_location: true,
                last_pm_date: true,
                next_pm_due: true,
                agreed_terms: true,
                created_by: true,
                created_at: true,
            },
        });
        // ---- Build response (stringify BigInt if you want to return attachment_id)
        const responseBody = {
            service_request: {
                ...created,
                ...(attachmentIdBig != null
                    ? { attachment_id: attachmentIdBig.toString() }
                    : {}),
            },
            secondary_contact: anySecondary
                ? {
                    name: secondary_contact_name ?? null,
                    phone: secondary_contact_phone ?? null,
                    email: secondary_contact_email ?? null,
                }
                : null,
        };
        return (0, responseUtils_1.sendSuccessResponse)(res, responseBody, "Created", 201);
    }
    catch (err) {
        console.error("Create Service Request error:", err);
        if (err?.code === "P2002" &&
            err?.meta?.target?.includes?.("attachment_id")) {
            return (0, responseUtils_1.sendErrorResponse)(res, "attachment_id must be unique (already used)", 400);
        }
        if (err?.code === "P2003" &&
            String(err?.meta?.field_name || "").includes("attachment_id")) {
            return (0, responseUtils_1.sendErrorResponse)(res, "Invalid attachment_id (FK constraint)", 400);
        }
        return (0, responseUtils_1.sendErrorResponse)(res, "Internal server error.", 500);
    }
}
