"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.exportPMsByAccountsExcel = exports.exportDOTInspectionsExcel = exports.getDOTInspectionsByAccounts = exports.getPMScheduleDetail = exports.getPMsByAccounts = void 0;
const pm_service_1 = require("./../../services/pm.service");
const database_config_1 = __importDefault(require("../../config/database.config"));
const responseUtils_1 = require("../../utils/responseUtils");
const flatten_1 = require("../../utils/flatten");
const pagination_1 = require("../../utils/pagination");
const exceljs_1 = __importDefault(require("exceljs"));
const pmService = new pm_service_1.PmService();
const getPMsByAccounts = async (req, res) => {
    try {
        const { data, totalUnits, page, perPage, counts } = await pmService.getPMsByAccounts(req.query);
        return (0, responseUtils_1.sendPaginatedResponse)(res, data, totalUnits, page, perPage, 200, {
            counts,
        });
    }
    catch (error) {
        if (error.message === "INVALID_ACCOUNT_IDS") {
            return (0, responseUtils_1.sendErrorResponse)(res, "No valid account IDs provided", 400);
        }
        if (error.message === "MISSING_ACCOUNT_IDS") {
            return (0, responseUtils_1.sendErrorResponse)(res, "Missing accountIds parameter", 400);
        }
        console.error("getPMsByAccounts error:", error);
        return (0, responseUtils_1.sendErrorResponse)(res, "Internal Server Error");
    }
};
exports.getPMsByAccounts = getPMsByAccounts;
const getPMScheduleDetail = async (req, res) => {
    try {
        const pmScheduleId = Number(req.params.pmScheduleId);
        if (!pmScheduleId || isNaN(pmScheduleId)) {
            return (0, responseUtils_1.sendErrorResponse)(res, "Missing or invalid pmScheduleId parameter", 400);
        }
        const detail = await pmService.getPMScheduleDetail(pmScheduleId);
        return (0, responseUtils_1.sendSuccessResponse)(res, detail);
    }
    catch (error) {
        if (error.message === "NO_PM_SCHEDULE_FOUND") {
            return (0, responseUtils_1.sendErrorResponse)(res, "No PM Schedule found", 404);
        }
        console.error("getPMScheduleDetail error:", error);
        return (0, responseUtils_1.sendErrorResponse)(res, "Internal Server Error");
    }
};
exports.getPMScheduleDetail = getPMScheduleDetail;
const getDOTInspectionsByAccounts = async (req, res) => {
    try {
        const accountIdsParam = req.query.accountIds;
        const { page, perPage, skip, take } = (0, pagination_1.getPagination)(req.query);
        if (!accountIdsParam) {
            return (0, responseUtils_1.sendErrorResponse)(res, "Missing accountIds parameter", 400);
        }
        const accountIds = accountIdsParam
            .split(",")
            .map((id) => Number(id.trim()))
            .filter((id) => Number.isFinite(id));
        if (!accountIds.length) {
            return (0, responseUtils_1.sendErrorResponse)(res, "No valid account IDs provided", 400);
        }
        // ----------------------------
        // Extract filters from query
        // ----------------------------
        const { inspection_date_from, inspection_date_to, inspector_name, inspection_result, notes, next_inspection_due_from, next_inspection_due_to, equipment_id, unit_number, equipment_type, violation_code, severity_level, } = req.query;
        // ----------------------------
        // Build dynamic filters
        // ----------------------------
        const filters = {
            account_id: { in: accountIds },
            ...(inspection_result && {
                inspection_result: {
                    contains: String(inspection_result),
                    mode: "insensitive",
                },
            }),
            ...(inspector_name && {
                inspector_name: {
                    contains: String(inspector_name),
                    mode: "insensitive",
                },
            }),
            ...(notes && { notes: { contains: String(notes), mode: "insensitive" } }),
            // Date range filters for inspection date
            ...(inspection_date_from || inspection_date_to
                ? {
                    inspection_date: {
                        ...(inspection_date_from && {
                            gte: new Date(String(inspection_date_from)),
                        }),
                        ...(inspection_date_to && {
                            lte: new Date(String(inspection_date_to)),
                        }),
                    },
                }
                : {}),
            // Date range filters for next inspection due
            ...(next_inspection_due_from || next_inspection_due_to
                ? {
                    next_inspection_due: {
                        ...(next_inspection_due_from && {
                            gte: new Date(String(next_inspection_due_from)),
                        }),
                        ...(next_inspection_due_to && {
                            lte: new Date(String(next_inspection_due_to)),
                        }),
                    },
                }
                : {}),
            // Nested equipment filters
            ...(equipment_id || unit_number || equipment_type
                ? {
                    equipment: {
                        ...(equipment_id && { equipment_id: Number(equipment_id) }),
                        ...(unit_number && {
                            unit_number: {
                                contains: String(unit_number),
                                mode: "insensitive",
                            },
                        }),
                        ...(equipment_type && {
                            equipment_type_lookup_ref: {
                                equipment_type: {
                                    contains: String(equipment_type),
                                    mode: "insensitive",
                                },
                            },
                        }),
                    },
                }
                : {}),
            // Nested violation filters
            ...(violation_code || severity_level
                ? {
                    dot_inspection_violation: {
                        some: {
                            ...(violation_code && {
                                violation_code: {
                                    contains: String(violation_code),
                                    mode: "insensitive",
                                },
                            }),
                            ...(severity_level && {
                                severity_level: {
                                    contains: String(severity_level),
                                    mode: "insensitive",
                                },
                            }),
                        },
                    },
                }
                : {}),
        };
        // ----------------------------
        // Today's date for specific counts
        // ----------------------------
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        // ----------------------------
        // Run counts and main query in parallel
        // ----------------------------
        const [totalInspections, failedInspections, unitsDueForInspection, unitsWithExpiredPermits, inspections,] = await Promise.all([
            database_config_1.default.dot_inspection.count({ where: filters }),
            database_config_1.default.dot_inspection.count({
                where: {
                    ...filters,
                    inspection_result: { in: ["FAIL", "FAILED", "FAILURE"] },
                },
            }),
            database_config_1.default.dot_inspection.count({
                where: {
                    ...filters,
                    next_inspection_due: { lte: today },
                },
            }),
            database_config_1.default.dot_inspection.count({
                where: {
                    ...filters,
                    next_inspection_due: { lt: today },
                },
            }),
            database_config_1.default.dot_inspection.findMany({
                where: filters,
                skip,
                take,
                orderBy: { inspection_date: "desc" },
                select: {
                    dot_inspection_id: true,
                    equipment_id: true,
                    account_id: true,
                    schedule_agreement_id: true,
                    inspection_date: true,
                    inspector_name: true,
                    inspection_result: true,
                    notes: true,
                    next_inspection_due: true,
                    created_at: true,
                    updated_at: true,
                    equipment: {
                        select: {
                            unit_number: true,
                            equipment_type_lookup_ref: { select: { equipment_type: true } },
                        },
                    },
                    dot_inspection_violation: {
                        select: {
                            dot_inspection_violation_id: true,
                            violation_code: true,
                            description: true,
                            severity_level: true,
                            corrective_action_taken: true,
                        },
                        orderBy: { dot_inspection_violation_id: "asc" },
                    },
                },
            }),
        ]);
        // ----------------------------
        // Transform output
        // ----------------------------
        const transformed = inspections.map((insp) => (0, flatten_1.flattenObject)({
            dotInspectionId: insp.dot_inspection_id,
            equipmentId: insp.equipment_id,
            accountId: insp.account_id,
            scheduleAgreementId: insp.schedule_agreement_id,
            inspectionDate: insp.inspection_date?.toISOString(),
            inspectorName: insp.inspector_name,
            inspectionResult: insp.inspection_result,
            notes: insp.notes,
            nextInspectionDue: insp.next_inspection_due?.toISOString(),
            createdAt: insp.created_at?.toISOString(),
            updatedAt: insp.updated_at?.toISOString(),
            equipment: insp.equipment,
            violations: insp.dot_inspection_violation,
        }));
        // ----------------------------
        // Return API response
        // ----------------------------
        return (0, responseUtils_1.sendPaginatedResponse)(res, transformed, totalInspections, page, perPage, 200, {
            counts: {
                totalInspections,
                failedInspections,
                unitsDueForInspection,
                unitsWithExpiredPermits,
            },
        });
    }
    catch (error) {
        console.error("getDOTInspectionsByAccounts error:", error);
        return (0, responseUtils_1.sendErrorResponse)(res, "Internal Server Error");
    }
};
exports.getDOTInspectionsByAccounts = getDOTInspectionsByAccounts;
const exportDOTInspectionsExcel = async (req, res) => {
    try {
        // --- Parse account IDs ---
        let accountIds = [];
        if (typeof req.query.accountIds === "string") {
            accountIds = req.query.accountIds
                .split(",")
                .map((id) => Number(id.trim()))
                .filter((id) => !isNaN(id) && id > 0);
        }
        if (accountIds.length === 0) {
            return res.status(400).json({ error: "Please provide valid accountIds" });
        }
        // --- Extract filters (same as getDOTInspectionsByAccounts) ---
        const { inspection_date_from, inspection_date_to, inspector_name, inspection_result, notes, next_inspection_due_from, next_inspection_due_to, equipment_id, unit_number, equipment_type, violation_code, severity_level, } = req.query;
        const filters = {
            account_id: { in: accountIds },
            ...(inspection_result && {
                inspection_result: {
                    contains: String(inspection_result),
                    mode: "insensitive",
                },
            }),
            ...(inspector_name && {
                inspector_name: {
                    contains: String(inspector_name),
                    mode: "insensitive",
                },
            }),
            ...(notes && {
                notes: { contains: String(notes), mode: "insensitive" },
            }),
            ...(inspection_date_from || inspection_date_to
                ? {
                    inspection_date: {
                        ...(inspection_date_from && {
                            gte: new Date(String(inspection_date_from)),
                        }),
                        ...(inspection_date_to && {
                            lte: new Date(String(inspection_date_to)),
                        }),
                    },
                }
                : {}),
            ...(next_inspection_due_from || next_inspection_due_to
                ? {
                    next_inspection_due: {
                        ...(next_inspection_due_from && {
                            gte: new Date(String(next_inspection_due_from)),
                        }),
                        ...(next_inspection_due_to && {
                            lte: new Date(String(next_inspection_due_to)),
                        }),
                    },
                }
                : {}),
            ...(equipment_id || unit_number || equipment_type
                ? {
                    equipment: {
                        ...(equipment_id && { equipment_id: Number(equipment_id) }),
                        ...(unit_number && {
                            unit_number: {
                                contains: String(unit_number),
                                mode: "insensitive",
                            },
                        }),
                        ...(equipment_type && {
                            equipment_type_lookup_ref: {
                                equipment_type: {
                                    contains: String(equipment_type),
                                    mode: "insensitive",
                                },
                            },
                        }),
                    },
                }
                : {}),
            ...(violation_code || severity_level
                ? {
                    dot_inspection_violation: {
                        some: {
                            ...(violation_code && {
                                violation_code: {
                                    contains: String(violation_code),
                                    mode: "insensitive",
                                },
                            }),
                            ...(severity_level && {
                                severity_level: {
                                    contains: String(severity_level),
                                    mode: "insensitive",
                                },
                            }),
                        },
                    },
                }
                : {}),
        };
        // --- Fetch inspections ---
        const inspections = await database_config_1.default.dot_inspection.findMany({
            where: filters,
            orderBy: { inspection_date: "desc" },
            select: {
                dot_inspection_id: true,
                equipment_id: true,
                account_id: true,
                schedule_agreement_id: true,
                inspection_date: true,
                inspector_name: true,
                inspection_result: true,
                notes: true,
                next_inspection_due: true,
                created_at: true,
                updated_at: true,
                equipment: {
                    select: {
                        unit_number: true,
                        equipment_type_lookup_ref: { select: { equipment_type: true } },
                    },
                },
                dot_inspection_violation: {
                    select: {
                        violation_code: true,
                        description: true,
                        severity_level: true,
                        corrective_action_taken: true,
                    },
                },
            },
        });
        if (inspections.length === 0) {
            return res.status(404).json({ error: "No DOT inspections found" });
        }
        // --- Create Excel Workbook ---
        const workbook = new exceljs_1.default.Workbook();
        const worksheet = workbook.addWorksheet("DOT Inspections");
        worksheet.columns = [
            { header: "DOT Inspection ID", key: "dot_inspection_id", width: 18 },
            { header: "Account ID", key: "account_id", width: 12 },
            { header: "Equipment ID", key: "equipment_id", width: 12 },
            { header: "Unit Number", key: "unit_number", width: 15 },
            { header: "Equipment Type", key: "equipment_type", width: 20 },
            {
                header: "Schedule Agreement ID",
                key: "schedule_agreement_id",
                width: 20,
            },
            { header: "Inspection Date", key: "inspection_date", width: 20 },
            { header: "Inspector Name", key: "inspector_name", width: 25 },
            { header: "Inspection Result", key: "inspection_result", width: 18 },
            { header: "Notes", key: "notes", width: 30 },
            { header: "Next Inspection Due", key: "next_inspection_due", width: 20 },
            { header: "Violations", key: "violations", width: 50 },
            { header: "Created At", key: "created_at", width: 20 },
            { header: "Updated At", key: "updated_at", width: 20 },
        ];
        inspections.forEach((insp) => {
            worksheet.addRow({
                dot_inspection_id: insp.dot_inspection_id,
                account_id: insp.account_id,
                equipment_id: insp.equipment_id,
                unit_number: insp.equipment?.unit_number || "",
                equipment_type: insp.equipment?.equipment_type_lookup_ref?.equipment_type || "",
                schedule_agreement_id: insp.schedule_agreement_id,
                inspection_date: insp.inspection_date?.toISOString().split("T")[0],
                inspector_name: insp.inspector_name,
                inspection_result: insp.inspection_result,
                notes: insp.notes || "",
                next_inspection_due: insp.next_inspection_due?.toISOString().split("T")[0] || "",
                violations: insp.dot_inspection_violation
                    .map((v) => `${v.violation_code} (${v.severity_level}) - ${v.description} ${v.corrective_action_taken
                    ? `| Action: ${v.corrective_action_taken}`
                    : ""}`)
                    .join("; "),
                created_at: insp.created_at?.toISOString().split("T")[0],
                updated_at: insp.updated_at?.toISOString().split("T")[0] || "",
            });
        });
        worksheet.getRow(1).font = { bold: true };
        // --- Send File ---
        res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        res.setHeader("Content-Disposition", "attachment; filename=dot_inspections.xlsx");
        await workbook.xlsx.write(res);
        res.end();
    }
    catch (error) {
        console.error("Export DOT Inspections Error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};
exports.exportDOTInspectionsExcel = exportDOTInspectionsExcel;
const exportPMsByAccountsExcel = async (req, res) => {
    try {
        // --- Parse account IDs ---
        let accountIds = [];
        if (typeof req.query.accountIds === "string") {
            accountIds = req.query.accountIds
                .split(",")
                .map((id) => Number(id.trim()))
                .filter((id) => !isNaN(id) && id > 0);
        }
        if (accountIds.length === 0) {
            return res.status(400).json({ error: "Please provide valid accountIds" });
        }
        // --- Collect filters from query ---
        const { pm_type, pm_task_description, frequency_interval, frequency_type, status, equipment_id, unit_number, equipment_type, facility_code, facility_name, } = req.query;
        const filters = {
            account_id: { in: accountIds },
            ...(pm_type && {
                pm_type: { contains: String(pm_type), mode: "insensitive" },
            }),
            ...(pm_task_description && {
                pm_task_description: {
                    contains: String(pm_task_description),
                    mode: "insensitive",
                },
            }),
            ...(frequency_interval && {
                frequency_interval: Number(frequency_interval),
            }),
            ...(frequency_type && {
                frequency_type: { equals: String(frequency_type), mode: "insensitive" },
            }),
            ...(status && {
                status: { equals: String(status), mode: "insensitive" },
            }),
            ...(equipment_id || unit_number || equipment_type
                ? {
                    equipment: {
                        ...(equipment_id && { equipment_id: Number(equipment_id) }),
                        ...(unit_number && {
                            unit_number: {
                                contains: String(unit_number),
                                mode: "insensitive",
                            },
                        }),
                        ...(equipment_type && {
                            equipment_type_lookup_ref: {
                                equipment_type: {
                                    contains: String(equipment_type),
                                    mode: "insensitive",
                                },
                            },
                        }),
                    },
                }
                : {}),
            ...(facility_code || facility_name
                ? {
                    facility_lookup: {
                        ...(facility_code && {
                            facility_code: {
                                contains: String(facility_code),
                                mode: "insensitive",
                            },
                        }),
                        ...(facility_name && {
                            facility_name: {
                                contains: String(facility_name),
                                mode: "insensitive",
                            },
                        }),
                    },
                }
                : {}),
        };
        // --- Fetch all matching PM schedules ---
        const schedules = await database_config_1.default.preventive_maintenance_schedule.findMany({
            where: filters,
            orderBy: { pm_schedule_id: "asc" },
            select: {
                pm_schedule_id: true,
                pm_task_description: true,
                frequency_interval: true,
                frequency_type: true,
                pm_type: true,
                status: true,
                equipment: {
                    select: {
                        equipment_id: true,
                        unit_number: true,
                        equipment_type_lookup_ref: { select: { equipment_type: true } },
                    },
                },
                facility_lookup: {
                    select: { facility_code: true, facility_name: true },
                },
                preventive_maintenance_events: {
                    select: {
                        pm_event_id: true,
                        performed_date: true,
                        next_due_date: true,
                        status: true,
                    },
                    orderBy: { performed_date: "desc" },
                },
            },
        });
        if (schedules.length === 0) {
            return res.status(404).json({ error: "No PM Schedules found" });
        }
        // --- Prepare Excel ---
        const workbook = new exceljs_1.default.Workbook();
        const worksheet = workbook.addWorksheet("PM Schedules");
        worksheet.columns = [
            { header: "PM Schedule ID", key: "pm_schedule_id", width: 15 },
            { header: "PM Task Description", key: "pm_task_description", width: 40 },
            { header: "Frequency Interval", key: "frequency_interval", width: 20 },
            { header: "Frequency Type", key: "frequency_type", width: 15 },
            { header: "PM Type", key: "pm_type", width: 15 },
            { header: "Schedule Status", key: "status", width: 15 },
            { header: "Equipment ID", key: "equipment_id", width: 15 },
            { header: "Unit Number", key: "unit_number", width: 20 },
            { header: "Equipment Type", key: "equipment_type", width: 20 },
            { header: "Facility Code", key: "facility_code", width: 20 },
            { header: "Facility Name", key: "facility_name", width: 30 },
            { header: "Last Event ID", key: "last_event_id", width: 15 },
            { header: "Last Event Date", key: "last_event_date", width: 20 },
            { header: "Next Event ID", key: "next_event_id", width: 15 },
            { header: "Next Event Date", key: "next_event_date", width: 20 },
        ];
        schedules.forEach((sched) => {
            const lastEvent = sched.preventive_maintenance_events.find((ev) => ev.status === "COMPLETED") || null;
            const nextEvent = [...sched.preventive_maintenance_events]
                .reverse()
                .find((ev) => ev.status === "SCHEDULED") || null;
            worksheet.addRow({
                pm_schedule_id: sched.pm_schedule_id,
                pm_task_description: sched.pm_task_description,
                frequency_interval: sched.frequency_interval,
                frequency_type: sched.frequency_type,
                pm_type: sched.pm_type,
                status: sched.status,
                equipment_id: sched.equipment?.equipment_id || "",
                unit_number: sched.equipment?.unit_number || "",
                equipment_type: sched.equipment?.equipment_type_lookup_ref?.equipment_type || "",
                facility_code: sched.facility_lookup?.facility_code || "",
                facility_name: sched.facility_lookup?.facility_name || "",
                last_event_id: lastEvent?.pm_event_id || "",
                last_event_date: lastEvent?.performed_date?.toISOString().split("T")[0] || "",
                next_event_id: nextEvent?.pm_event_id || "",
                next_event_date: nextEvent?.next_due_date?.toISOString().split("T")[0] || "",
            });
        });
        worksheet.getRow(1).font = { bold: true };
        // --- Send File ---
        res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        res.setHeader("Content-Disposition", "attachment; filename=pm_schedules.xlsx");
        await workbook.xlsx.write(res);
        res.end();
    }
    catch (error) {
        console.error("Export PM Schedules Error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};
exports.exportPMsByAccountsExcel = exportPMsByAccountsExcel;
