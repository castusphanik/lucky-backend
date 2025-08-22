"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PmService = void 0;
// src/modules/auth/services/auth.service.ts
const pagination_1 = require("../utils/pagination");
const database_config_1 = __importDefault(require("../config/database.config"));
const flatten_1 = require("../utils/flatten");
class PmService {
    async getPMsByAccounts(query) {
        const accountIdsParam = query.accountIds;
        const { page, perPage, skip, take } = (0, pagination_1.getPagination)(query);
        if (!accountIdsParam)
            throw new Error("MISSING_ACCOUNT_IDS");
        const accountIds = String(accountIdsParam)
            .split(",")
            .map((id) => Number(id.trim()))
            .filter((id) => Number.isFinite(id));
        if (!accountIds.length)
            throw new Error("INVALID_ACCOUNT_IDS");
        // Build filters
        const filters = {
            account_id: { in: accountIds },
            ...(query.pm_type && {
                pm_type: { contains: String(query.pm_type), mode: "insensitive" },
            }),
            ...(query.pm_task_description && {
                pm_task_description: {
                    contains: String(query.pm_task_description),
                    mode: "insensitive",
                },
            }),
            ...(query.frequency_interval && {
                frequency_interval: Number(query.frequency_interval),
            }),
            ...(query.frequency_type && {
                frequency_type: {
                    equals: String(query.frequency_type),
                    mode: "insensitive",
                },
            }),
            ...(query.status && {
                status: { equals: String(query.status), mode: "insensitive" },
            }),
            ...(query.equipment_id || query.unit_number || query.equipment_type
                ? {
                    equipment: {
                        ...(query.equipment_id && {
                            equipment_id: Number(query.equipment_id),
                        }),
                        ...(query.unit_number && {
                            unit_number: {
                                contains: String(query.unit_number),
                                mode: "insensitive",
                            },
                        }),
                        ...(query.equipment_type && {
                            equipment_type_lookup_ref: {
                                equipment_type: {
                                    contains: String(query.equipment_type),
                                    mode: "insensitive",
                                },
                            },
                        }),
                    },
                }
                : {}),
            ...(query.facility_code || query.facility_name
                ? {
                    facility_lookup: {
                        ...(query.facility_code && {
                            facility_code: {
                                contains: String(query.facility_code),
                                mode: "insensitive",
                            },
                        }),
                        ...(query.facility_name && {
                            facility_name: {
                                contains: String(query.facility_name),
                                mode: "insensitive",
                            },
                        }),
                    },
                }
                : {}),
        };
        // Todays date for queries
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        // Counts and data in parallel
        const [totalUnits, unitsComingDue, unitsOverdue, unitsRecentlyCompleted, pmSchedules,] = await Promise.all([
            database_config_1.default.preventive_maintenance_schedule.count({ where: filters }),
            database_config_1.default.preventive_maintenance_schedule.count({
                where: {
                    ...filters,
                    preventive_maintenance_events: {
                        some: { status: "SCHEDULED", next_due_date: { lte: today } },
                    },
                },
            }),
            database_config_1.default.preventive_maintenance_schedule.count({
                where: {
                    ...filters,
                    preventive_maintenance_events: {
                        some: { status: "SCHEDULED", next_due_date: { lt: today } },
                    },
                },
            }),
            (async () => {
                const since = new Date();
                since.setDate(today.getDate() - 30);
                return database_config_1.default.preventive_maintenance_schedule.count({
                    where: {
                        ...filters,
                        preventive_maintenance_events: {
                            some: { status: "COMPLETED", performed_date: { gte: since } },
                        },
                    },
                });
            })(),
            database_config_1.default.preventive_maintenance_schedule.findMany({
                where: filters,
                skip,
                take,
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
                orderBy: { pm_schedule_id: "asc" },
            }),
        ]);
        // Flatten and transform
        const flattenedTransformed = pmSchedules.map((schedule) => {
            const events = schedule.preventive_maintenance_events;
            const lastEvent = events.find((ev) => ev.status === "COMPLETED") || null;
            const nextEvent = [...events].reverse().find((ev) => ev.status === "SCHEDULED") || null;
            return (0, flatten_1.flattenObject)({
                pmScheduleId: schedule.pm_schedule_id,
                pmTaskDescription: schedule.pm_task_description,
                frequencyInterval: schedule.frequency_interval,
                frequencyType: schedule.frequency_type,
                pmType: schedule.pm_type,
                scheduleStatus: schedule.status,
                equipment: schedule.equipment,
                facility: schedule.facility_lookup,
                lastEvent,
                nextEvent,
            });
        });
        return {
            data: flattenedTransformed,
            totalUnits,
            page,
            perPage,
            counts: {
                totalUnits,
                unitsComingDue,
                unitsOverdue,
                unitsRecentlyCompleted,
            },
        };
    }
    async getPMScheduleDetail(pmScheduleId) {
        const schedule = await database_config_1.default.preventive_maintenance_schedule.findUnique({
            where: { pm_schedule_id: pmScheduleId },
            select: {
                pm_schedule_id: true,
                pm_type: true,
                pm_task_description: true,
                frequency_interval: true,
                frequency_type: true,
                status: true,
                comments: true,
                account: {
                    select: { account_id: true, account_name: true },
                },
                equipment: {
                    select: {
                        equipment_id: true,
                        unit_number: true,
                        equipment_type_lookup_ref: {
                            select: { equipment_type: true },
                        },
                        current_equipment_gps_location: {
                            select: {
                                latitude: true,
                                longitude: true,
                                location: true,
                                motion_status: true,
                            },
                        },
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
                        work_performed: true,
                        location: true,
                        vendor_technician: true,
                        time_taken: true,
                        status: true,
                        notes: true,
                        pm_parts_used: {
                            select: {
                                part_name: true,
                                part_quantity: true,
                                part_cost: true,
                            },
                            orderBy: { part_name: "asc" },
                        },
                    },
                    orderBy: { performed_date: "asc" },
                },
            },
        });
        if (!schedule) {
            throw new Error("NO_PM_SCHEDULE_FOUND");
        }
        const timeline = schedule.preventive_maintenance_events.map((ev) => (0, flatten_1.flattenObject)({
            pmEventId: ev.pm_event_id,
            performedDate: ev.performed_date
                ? ev.performed_date.toISOString()
                : null,
            dueDate: ev.next_due_date ? ev.next_due_date.toISOString() : null,
            status: ev.status,
            notes: ev.notes,
        }));
        const serviceHistory = schedule.preventive_maintenance_events
            .filter((ev) => ev.status !== "SCHEDULED")
            .sort((a, b) => {
            const timeA = a.performed_date ? a.performed_date.getTime() : 0;
            const timeB = b.performed_date ? b.performed_date.getTime() : 0;
            return timeB - timeA;
        })
            .map((ev) => (0, flatten_1.flattenObject)({
            pmEventId: ev.pm_event_id,
            performedDate: ev.performed_date
                ? ev.performed_date.toISOString()
                : null,
            dueDate: ev.next_due_date ? ev.next_due_date.toISOString() : null,
            workPerformed: ev.work_performed,
            location: ev.location,
            vendorTechnician: ev.vendor_technician,
            timeTaken: ev.time_taken,
            status: ev.status,
            notes: ev.notes,
            partsReplaced: ev.pm_parts_used,
        }));
        const responseObj = {
            pmScheduleId: schedule.pm_schedule_id,
            pmType: schedule.pm_type,
            taskDescription: schedule.pm_task_description,
            frequency: `${schedule.frequency_interval} ${schedule.frequency_type}`,
            scheduleStatus: schedule.status,
            comments: schedule.comments,
            account: schedule.account,
            equipment: schedule.equipment,
            facility: schedule.facility_lookup,
            timeline,
            serviceHistory,
        };
        // Only flatten the top-level, timeline/serviceHistory remain as arrays
        const flat = (0, flatten_1.flattenObject)(responseObj);
        flat.timeline = timeline;
        flat.serviceHistory = serviceHistory;
        return flat;
    }
}
exports.PmService = PmService;
