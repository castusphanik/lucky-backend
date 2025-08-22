"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.downloadListView = exports.getEquipmentCounts = exports.getListView = exports.getEquipmentDetails = exports.getMapView = void 0;
const database_config_1 = __importDefault(require("../../config/database.config"));
const excelUtils_1 = require("../../utils/excelUtils");
const coloumPrefrences_1 = require("../../utils/coloumPrefrences");
const getMapView = async (req, res) => {
    let accountIds = [];
    try {
        const queryAccountId = req.query.account_id;
        // Pagination params
        const page = parseInt(req.query.page) || 1;
        const perPage = parseInt(req.query.perPage) || 10;
        const skip = (page - 1) * perPage;
        // Parse input: support both single and multiple account_id values
        if (Array.isArray(queryAccountId)) {
            accountIds = queryAccountId.map(Number).filter((id) => !isNaN(id));
        }
        else if (typeof queryAccountId === "string") {
            try {
                const parsed = JSON.parse(queryAccountId);
                if (Array.isArray(parsed)) {
                    accountIds = parsed.map(Number).filter((id) => !isNaN(id));
                }
                else {
                    const singleId = Number(parsed);
                    if (!isNaN(singleId))
                        accountIds = [singleId];
                }
            }
            catch {
                const singleId = Number(queryAccountId);
                if (!isNaN(singleId))
                    accountIds = [singleId];
            }
        }
        if (accountIds.length === 0) {
            return res
                .status(400)
                .json({ success: false, message: "Invalid account_id(s)" });
        }
        // Get total count before pagination
        const totalRecords = await database_config_1.default.equipment.count({
            where: {
                equipment_assignment: {
                    some: {
                        equipment_type_allocation_ref: {
                            OR: accountIds.map((id) => ({ account_id: id })),
                            //   is_deleted: false,
                        },
                    },
                },
            },
        });
        // Fetch paginated data
        const equipments = await database_config_1.default.equipment.findMany({
            where: {
                equipment_assignment: {
                    some: {
                        equipment_type_allocation_ref: {
                            account_id: accountIds.length === 1 ? accountIds[0] : { in: accountIds },
                            //   is_deleted: false,
                        },
                    },
                },
            },
            include: {
                current_equipment_gps_location: true,
            },
            skip,
            take: perPage,
        });
        if (!equipments || equipments.length === 0) {
            return res.status(404).json({
                success: false,
                message: "No equipment found for these account(s)",
            });
        }
        const filteredEquipments = equipments.map((equip) => ({
            ...equip,
            current_equipment_gps_location: equip.current_equipment_gps_location.filter((gps) => gps.equipment_id === equip.equipment_id),
        }));
        const safeData = JSON.parse(JSON.stringify(filteredEquipments, replacer));
        return res.status(200).json({
            success: true,
            totalRecords,
            currentPage: page,
            perPage,
            totalPages: Math.ceil(totalRecords / perPage),
            data: safeData,
        });
    }
    catch (error) {
        console.error("Error fetching equipment:", error);
        return res.status(500).json({ success: false, message: "Server Error" });
    }
};
exports.getMapView = getMapView;
const getEquipmentDetails = async (req, res) => {
    try {
        const accountId = Number(req.query.account_id);
        const equipmentId = Number(req.query.equipment_id);
        if (isNaN(accountId) || isNaN(equipmentId)) {
            return res
                .status(400)
                .json({ message: "Invalid account ID or equipment ID" });
        }
        const assignment = await database_config_1.default.equipment_assignment.findFirst({
            where: {
                equipment_type_allocation_ref: {
                    account_id: accountId,
                },
                equipment_id: equipmentId,
            },
            include: {
                equipment_ref: {
                    include: {
                        simple_field_lookup: true,
                        door_type_lookup: true,
                        wall_type_lookup: true,
                        floor_type_lookup: true,
                        roof_type_lookup: true,
                        rim_type_lookup: true,
                        oem_make_model_ref: true,
                        equipment_permit: true,
                    },
                },
                equipment_type_allocation_ref: {
                    include: {
                        account: true,
                        schedule_agreement_line_item_ref: {
                            include: {
                                schedule_agreement_ref: {
                                    include: {
                                        master_agreement_ref: true,
                                        schedule_agreement_has_attachment: {
                                            include: { attachment: true },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        });
        if (!assignment?.equipment_ref)
            return res.status(404).json({
                message: "No equipment found for the given account ID and equipment ID",
            });
        const { equipment_ref: eq, equipment_type_allocation_ref: alloc } = assignment;
        const { schedule_agreement_line_item_ref: lineItem, account } = alloc;
        const agreement = lineItem?.schedule_agreement_ref;
        const attachment = agreement?.schedule_agreement_has_attachment[0]?.attachment;
        const iotDevice = await database_config_1.default.equipment_has_iot_device.findFirst({
            where: {
                equipment_id: eq.equipment_id,
                // is_deleted: false,
            },
            include: {
                iot_device_ref: {
                    include: {
                        iot_device_vendor_ref: true,
                    },
                },
            },
        });
        const gps = await database_config_1.default.current_equipment_gps_location.findFirst({
            where: { equipment_id: eq.equipment_id },
            orderBy: { last_gps_update: "desc" },
            include: {
                current_equipment_motion_status_lookup: true,
                current_equipment_alarm_status_lookup: true,
            },
        });
        return res.status(200).json({
            success: 200,
            message: "Equipment details fetched successfully",
            equipmentSpecificationDetails: {
                unitNumber: eq.unit_number,
                customerUnitNumber: eq.customer_unit_number,
                status: eq.simple_field_lookup?.field_name || eq.status,
                vin: eq.vin,
                permit: eq.equipment_permit?.permit_date || null,
                make: eq.oem_make_model_ref?.make || null,
                model: eq.oem_make_model_ref?.model || null,
                year: eq.oem_make_model_ref?.year || null,
                length: eq.oem_make_model_ref?.length || null,
                doorType: eq.door_type_lookup?.field_name || eq.door_type,
                wallType: eq.wall_type_lookup?.field_name || eq.wall_type,
                breakType: eq.brake_type,
                color: eq.color,
                liftGate: eq.liftgate,
                domicile: eq.domicile,
                tenBranch: eq.ten_branch,
                lastPmDate: eq.last_pm_date,
                nextPmDue: eq.next_pm_due,
                dotCviStatus: eq.dot_cvi_status,
                dotCviExpire: eq.dot_cvi_expire,
                lastReeferPmDate: eq.last_reefer_pm_date,
                nextReeferPmDue: eq.next_reefer_pm_due,
                lastMRDate: eq.last_m_and_r_date,
                reeferMakeType: eq.reefer_make_type,
                reeferSerial: eq.reefer_serial,
                liftGateSerial: eq.lifgate_serial,
                trailerHeight: eq.trailer_height,
                trailerWidth: eq.trailer_width,
                trailerLength: eq.trailer_length,
                dateInService: eq.date_in_service,
                tireSize: eq.tire_size,
                floorType: eq.floor_type_lookup?.field_name || eq.floor_type,
                roofType: eq.roof_type_lookup?.field_name || eq.roof_type,
                rimType: eq.rim_type_lookup?.field_name || eq.rim_type,
                vendorName: iotDevice?.iot_device_ref?.iot_device_vendor_ref?.vendor_name || null,
            },
            equipmentContactDteails: {
                accountNumber: account?.account_number || null,
                accountName: account?.account_name || null,
                account: account
                    ? `${account.account_number || ""} - ${account.account_name || ""}`
                    : null,
                rate: lineItem?.rate ?? null,
                fixedRate: lineItem?.fixed_rate ?? null,
                variableRate: lineItem?.variable_rate ?? null,
                estimatedMiles: lineItem?.estimated_miles ?? null,
                estimatedHours: lineItem?.estimated_hours ?? null,
                contractStartDate: agreement?.master_agreement_ref?.contract_start_Date ?? null,
                contractEndDate: agreement?.termination_date ?? null,
                contractTermType: agreement?.master_agreement_ref?.contract_term_type ?? null,
                licensePlateNumber: eq.equipment_permit?.license_plate_number || null,
                licensePlateState: eq.equipment_permit?.license_plate_state || null,
            },
            attachmentDetails: {
                url: attachment?.url ?? null,
                mimeType: attachment?.mime_type ?? null,
                agreementType: agreement?.schedule_type ?? null,
            },
            gps: gps
                ? {
                    latitude: gps.latitude,
                    longitude: gps.longitude,
                    location: gps.location,
                    motionStatus: gps.current_equipment_motion_status_lookup?.field_name ||
                        gps.motion_status ||
                        null,
                    alarmCodeStatus: gps.current_equipment_alarm_status_lookup?.field_name ||
                        gps.alarm_code_status ||
                        null,
                    lastGpsUpdate: gps.last_gps_update,
                }
                : null,
        });
    }
    catch (err) {
        console.error("Error in getEquipmentDetails:", err);
        return res.status(500).json({ message: "Server Error" });
    }
};
exports.getEquipmentDetails = getEquipmentDetails;
const getListView = async (req, res) => {
    try {
        let account_ids = [];
        // Parse comma-separated account_id string like "1,2"
        if (typeof req.query.account_id === "string") {
            account_ids = req.query.account_id
                .split(",")
                .map((id) => Number(id.trim()))
                .filter((id) => !isNaN(id));
        }
        if (!Array.isArray(account_ids) || account_ids.length === 0) {
            return res.status(400).json({
                success: false,
                message: "account_ids must be a comma-separated list of numbers",
            });
        }
        // Pagination params
        const page = parseInt(req.query.page) || 1;
        const perPage = parseInt(req.query.perPage) || 10;
        // Extract filters including new equipment_load_status
        const { equipment_id, vin, license_plate_number, motion_status, last_gps_update, equipment_type, location, model, customer_unit_number, year, last_gps_coordinates, unit_number, break_type, color, lift_gate, ten_branch, dot_cvi_status, trailer_height, trailer_width, trailer_length, tire_size, roof_type, floor_type, rim_type, status, make, latitude, longitude, account, contractStartDate, contractEndDate, agreement_type, equipment_load_status, // ✅ NEW FILTER
         } = req.query;
        // Build equipmentRefFilter
        const equipmentRefFilter = {};
        if (vin)
            equipmentRefFilter.vin = { contains: String(vin), mode: "insensitive" };
        if (unit_number)
            equipmentRefFilter.unit_number = {
                contains: String(unit_number),
                mode: "insensitive",
            };
        if (customer_unit_number)
            equipmentRefFilter.customer_unit_number = {
                contains: String(customer_unit_number),
                mode: "insensitive",
            };
        if (break_type)
            equipmentRefFilter.brake_type = {
                contains: String(break_type),
                mode: "insensitive",
            };
        if (color)
            equipmentRefFilter.color = {
                contains: String(color),
                mode: "insensitive",
            };
        if (lift_gate)
            equipmentRefFilter.liftgate = {
                contains: String(lift_gate),
                mode: "insensitive",
            };
        if (ten_branch)
            equipmentRefFilter.ten_branch = {
                contains: String(ten_branch),
                mode: "insensitive",
            };
        if (dot_cvi_status)
            equipmentRefFilter.dot_cvi_status = {
                contains: String(dot_cvi_status),
                mode: "insensitive",
            };
        if (trailer_height)
            equipmentRefFilter.trailer_height = {
                contains: String(trailer_height),
                mode: "insensitive",
            };
        if (trailer_width)
            equipmentRefFilter.trailer_width = {
                contains: String(trailer_width),
                mode: "insensitive",
            };
        if (trailer_length)
            equipmentRefFilter.trailer_length = {
                contains: String(trailer_length),
                mode: "insensitive",
            };
        if (tire_size)
            equipmentRefFilter.tire_size = {
                contains: String(tire_size),
                mode: "insensitive",
            };
        if (status) {
            equipmentRefFilter.simple_field_lookup = {
                field_name: { contains: String(status), mode: "insensitive" },
            };
        }
        if (make) {
            equipmentRefFilter.oem_make_model_ref = {
                ...equipmentRefFilter.oem_make_model_ref,
                make: { contains: String(make), mode: "insensitive" },
            };
        }
        if (model) {
            equipmentRefFilter.oem_make_model_ref = {
                ...equipmentRefFilter.oem_make_model_ref,
                model: { contains: String(model), mode: "insensitive" },
            };
        }
        if (year) {
            equipmentRefFilter.oem_make_model_ref = {
                ...equipmentRefFilter.oem_make_model_ref,
                year: String(year),
            };
        }
        if (equipment_type) {
            equipmentRefFilter.equipment_type_lookup_ref = {
                equipment_type: {
                    contains: String(equipment_type),
                    mode: "insensitive",
                },
            };
        }
        if (roof_type) {
            equipmentRefFilter.roof_type_lookup = {
                field_name: { contains: String(roof_type), mode: "insensitive" },
            };
        }
        if (floor_type) {
            equipmentRefFilter.floor_type_lookup = {
                field_name: { contains: String(floor_type), mode: "insensitive" },
            };
        }
        if (rim_type) {
            equipmentRefFilter.rim_type_lookup = {
                field_name: { contains: String(rim_type), mode: "insensitive" },
            };
        }
        if (license_plate_number) {
            equipmentRefFilter.equipment_permit = {
                license_plate_number: {
                    contains: String(license_plate_number),
                    mode: "insensitive",
                },
            };
        }
        if (motion_status || last_gps_update || location || latitude || longitude) {
            equipmentRefFilter.current_equipment_gps_location = {
                some: {
                    ...(motion_status && {
                        motion_status: {
                            contains: String(motion_status),
                            mode: "insensitive",
                        },
                    }),
                    ...(last_gps_update && {
                        last_gps_update: { gte: new Date(String(last_gps_update)) },
                    }),
                    ...(location && {
                        location: { contains: String(location), mode: "insensitive" },
                    }),
                    ...(latitude && { latitude: Number(latitude) }),
                    ...(longitude && { longitude: Number(longitude) }),
                },
            };
        }
        // ✅ Equipment Load Status Filter
        if (equipment_load_status) {
            equipmentRefFilter.equipment_load_detail = {
                some: {
                    OR: [
                        {
                            equipment_load_status: {
                                contains: String(equipment_load_status),
                                mode: "insensitive",
                            },
                        },
                        {
                            load_status_lookup: {
                                field_name: {
                                    contains: String(equipment_load_status),
                                    mode: "insensitive",
                                },
                            },
                        },
                    ],
                },
            };
        }
        // Main where condition
        const whereCondition = {
            equipment_type_allocation_ref: {
                account_id: { in: account_ids },
                ...(account && {
                    account: {
                        OR: [
                            {
                                account_number: {
                                    contains: String(account),
                                    mode: "insensitive",
                                },
                            },
                            {
                                account_name: {
                                    contains: String(account),
                                    mode: "insensitive",
                                },
                            },
                        ],
                    },
                }),
                ...(contractStartDate && {
                    schedule_agreement_line_item_ref: {
                        schedule_agreement_ref: {
                            master_agreement_ref: {
                                contract_start_Date: {
                                    gte: new Date(String(contractStartDate)),
                                },
                            },
                        },
                    },
                }),
                ...(contractEndDate && {
                    schedule_agreement_line_item_ref: {
                        schedule_agreement_ref: {
                            termination_date: { lte: new Date(String(contractEndDate)) },
                        },
                    },
                }),
                ...(agreement_type && {
                    schedule_agreement_line_item_ref: {
                        schedule_agreement_ref: {
                            schedule_type: {
                                contains: String(agreement_type),
                                mode: "insensitive",
                            },
                        },
                    },
                }),
            },
            equipment_ref: equipmentRefFilter,
        };
        // Fetch data
        const rawData = await database_config_1.default.equipment_assignment.findMany({
            where: whereCondition,
            include: {
                equipment_ref: {
                    include: {
                        simple_field_lookup: true,
                        door_type_lookup: true,
                        wall_type_lookup: true,
                        floor_type_lookup: true,
                        roof_type_lookup: true,
                        rim_type_lookup: true,
                        oem_make_model_ref: true,
                        equipment_permit: true,
                        equipment_type_lookup_ref: true,
                        current_equipment_gps_location: {
                            take: 1,
                            orderBy: { last_gps_update: "desc" },
                            include: {
                                current_equipment_motion_status_lookup: true,
                                current_equipment_alarm_status_lookup: true,
                            },
                        },
                        equipment_iot_device_ref: {
                            include: {
                                iot_device_ref: {
                                    include: {
                                        iot_device_vendor_ref: true,
                                    },
                                },
                            },
                        },
                        // ✅ Include Load Details
                        equipment_load_detail: {
                            take: 1,
                            orderBy: { equipment_load_date: "desc" },
                            include: {
                                load_status_lookup: true,
                            },
                        },
                    },
                },
                equipment_type_allocation_ref: {
                    include: {
                        account: true,
                        schedule_agreement_line_item_ref: {
                            include: {
                                schedule_agreement_ref: {
                                    include: {
                                        master_agreement_ref: true,
                                        schedule_agreement_has_attachment: {
                                            include: { attachment: true },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            },
            orderBy: {
                equipment_ref: {
                    equipment_id: "asc",
                },
            },
            take: 10000000,
        });
        // Filter by equipment_id manually
        let filteredData = rawData;
        if (equipment_id && String(equipment_id).trim() !== "") {
            const eqIdStr = String(equipment_id).trim();
            filteredData = rawData.filter((item) => item.equipment_ref.equipment_id.toString().includes(eqIdStr));
        }
        // Pagination
        const totalRecords = filteredData.length;
        const totalPages = Math.ceil(totalRecords / perPage);
        const start = (page - 1) * perPage;
        const end = start + perPage;
        const paginatedData = filteredData.slice(start, end);
        // Format data
        const formatted = paginatedData.map((item) => {
            const eq = item.equipment_ref;
            const gps = eq.current_equipment_gps_location?.[0];
            const iotDevice = eq.equipment_iot_device_ref?.[0];
            const alloc = item.equipment_type_allocation_ref;
            const lineItem = alloc?.schedule_agreement_line_item_ref;
            const agreement = lineItem?.schedule_agreement_ref;
            const attachment = agreement?.schedule_agreement_has_attachment?.[0]?.attachment;
            const loadDetail = eq.equipment_load_detail?.[0]; // ✅ latest load detail
            const arrival_time_val = gps?.last_gps_update
                ? new Date(gps.last_gps_update).toLocaleTimeString("en-US", {
                    hour12: true,
                    hour: "2-digit",
                    minute: "2-digit",
                })
                : null;
            return {
                equipment_id: eq.equipment_id,
                activation_date: item.activation_date,
                deactivation_date: item.deactivation_date,
                driver_name: item.driver_name,
                unitNumber: eq.unit_number,
                customerUnitNumber: eq.customer_unit_number,
                status: eq.simple_field_lookup?.field_name || eq.status,
                vin: eq.vin,
                permit: eq.equipment_permit?.permit_date || null,
                make: eq.oem_make_model_ref?.make || null,
                model: eq.oem_make_model_ref?.model || null,
                year: eq.oem_make_model_ref?.year || null,
                length: eq.oem_make_model_ref?.length || null,
                doorType: eq.door_type_lookup?.field_name || eq.door_type,
                wallType: eq.wall_type_lookup?.field_name || eq.wall_type,
                breakType: eq.brake_type,
                color: eq.color,
                liftGate: eq.liftgate,
                domicile: eq.domicile,
                tenBranch: eq.ten_branch,
                lastPmDate: eq.last_pm_date,
                nextPmDue: eq.next_pm_due,
                dotCviStatus: eq.dot_cvi_status,
                dotCviExpire: eq.dot_cvi_expire,
                lastReeferPmDate: eq.last_reefer_pm_date,
                nextReeferPmDue: eq.next_reefer_pm_due,
                lastMRDate: eq.last_m_and_r_date,
                reeferMakeType: eq.reefer_make_type,
                reeferSerial: eq.reefer_serial,
                liftGateSerial: eq.lifgate_serial,
                trailerHeight: eq.trailer_height,
                trailerWidth: eq.trailer_width,
                trailerLength: eq.trailer_length,
                dateInService: eq.date_in_service,
                tireSize: eq.tire_size,
                floorType: eq.floor_type_lookup?.field_name || eq.floor_type,
                roofType: eq.roof_type_lookup?.field_name || eq.roof_type,
                rimType: eq.rim_type_lookup?.field_name || eq.rim_type,
                vendorName: iotDevice?.iot_device_ref?.iot_device_vendor_ref?.vendor_name || null,
                AccountId: alloc.account?.account_id || null,
                accountNumber: alloc.account?.account_number || null,
                accountName: alloc.account?.account_name || null,
                account: alloc.account
                    ? `${alloc.account.account_number || ""} - ${alloc.account.account_name || ""}`
                    : null,
                rate: lineItem?.rate ?? null,
                fixedRate: lineItem?.fixed_rate ?? null,
                variableRate: lineItem?.variable_rate ?? null,
                estimatedMiles: lineItem?.estimated_miles ?? null,
                estimatedHours: lineItem?.estimated_hours ?? null,
                contractStartDate: agreement?.master_agreement_ref?.contract_start_Date ?? null,
                contractEndDate: agreement?.termination_date ?? null,
                contractTermType: agreement?.master_agreement_ref?.contract_term_type ?? null,
                licensePlateNumber: eq.equipment_permit?.license_plate_number || null,
                licensePlateState: eq.equipment_permit?.license_plate_state || null,
                url: attachment?.url ?? null,
                mimeType: attachment?.mime_type ?? null,
                agreementType: agreement?.schedule_type ?? null,
                current_equipment_gps_location_id: gps?.current_equipment_gps_location_id || null,
                latitude: gps?.latitude || null,
                longitude: gps?.longitude || null,
                last_gps_coordinates: gps ? `${gps.latitude},${gps.longitude}` : null,
                location: gps?.location || null,
                motionStatus: gps?.current_equipment_motion_status_lookup?.field_name ||
                    gps?.motion_status ||
                    null,
                alarmCodeStatus: gps?.current_equipment_alarm_status_lookup?.field_name ||
                    gps?.alarm_code_status ||
                    null,
                arrival_time: arrival_time_val,
                lastGpsUpdate: gps?.last_gps_update || null,
                created_by: gps?.created_by || null,
                //  New load detail fields
                equipmentLoadStatus: loadDetail?.load_status_lookup?.field_name ||
                    loadDetail?.equipment_load_status ||
                    null,
                equipmentLoadDate: loadDetail?.equipment_load_date || null,
                equipmentUnloadDate: loadDetail?.equipment_unload_date || null,
                equipmentLoadDetail: loadDetail?.equipment_load_detail || null,
            };
        });
        return res.status(200).json({
            success: 200,
            message: "Fetched list and map view details successfully",
            data: JSON.parse(JSON.stringify({
                success: true,
                tablename: coloumPrefrences_1.column_preferences.fleet.fleet,
                totalRecords,
                currentPage: page,
                perPage,
                totalPages: Math.ceil(totalRecords / perPage),
                data: formatted,
            }, replacer)),
        });
    }
    catch (error) {
        console.error("Error in getListView:", error);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });
    }
};
exports.getListView = getListView;
const getEquipmentCounts = async (req, res) => {
    let accountIds = [];
    try {
        const queryAccountId = req.query.account_id;
        const filterBy = req.query.filterBy;
        // Pagination params
        const page = parseInt(req.query.page) || 1;
        const perPage = parseInt(req.query.perPage) || 10;
        // Parse account_ids
        if (typeof queryAccountId === "string") {
            accountIds = queryAccountId
                .split(",")
                .map((id) => Number(id.trim()))
                .filter((id) => !isNaN(id));
        }
        else if (Array.isArray(queryAccountId)) {
            accountIds = queryAccountId
                .map((id) => Number(id))
                .filter((id) => !isNaN(id));
        }
        if (accountIds.length === 0) {
            return res
                .status(400)
                .json({ success: false, message: "Invalid account_id(s)" });
        }
        // --- COUNT STATS ---
        const equipments = await database_config_1.default.equipment.findMany({
            where: {
                equipment_assignment: {
                    some: {
                        equipment_type_allocation_ref: {
                            account_id: accountIds.length === 1
                                ? { equals: accountIds[0] }
                                : { in: accountIds },
                        },
                    },
                },
            },
            select: {
                equipment_id: true,
                current_equipment_gps_location: {
                    select: { motion_status: true, equipment_id: true },
                },
            },
        });
        const totalCount = equipments.length;
        const equipmentIds = equipments.map((e) => e.equipment_id);
        const mappingRows = await database_config_1.default.equipment_has_iot_device.findMany({
            where: { equipment_id: { in: equipmentIds }, status: "ACTIVE" },
            select: { equipment_id: true },
        });
        const uniqueGpsEquipped = new Set(mappingRows.map((r) => r.equipment_id));
        const gpsEquippedCount = uniqueGpsEquipped.size;
        const accessWithoutGpsCount = totalCount - gpsEquippedCount;
        const idleEquipIds = new Set();
        equipments.forEach((e) => {
            if (e.current_equipment_gps_location?.some((g) => g.motion_status === "STOPPED")) {
                idleEquipIds.add(e.equipment_id);
            }
        });
        const idleUnitsCount = idleEquipIds.size;
        // --- Geofence Count ---
        let geofenceCount = 0;
        if (accountIds.length === 1) {
            geofenceCount = await database_config_1.default.geofence_alerts.count({
                where: { account_id: { equals: accountIds[0] }, is_deleted: false },
            });
        }
        else {
            for (const id of accountIds) {
                geofenceCount += await database_config_1.default.geofence_alerts.count({
                    where: { account_id: { equals: id }, is_deleted: false },
                });
            }
        }
        // --- Expired DOT Inspections Count ---
        const expiredInspectionRows = await database_config_1.default.dot_inspection.findMany({
            where: {
                equipment_id: { in: equipmentIds },
                next_inspection_due: { lt: new Date() }, // past due
            },
            select: { equipment_id: true },
        });
        const expiredInspectionIds = new Set(expiredInspectionRows.map((r) => r.equipment_id));
        const overdueDotInspectionCount = expiredInspectionIds.size;
        // --- FULL DATA ---
        const rawData = await database_config_1.default.equipment_assignment.findMany({
            where: {
                equipment_type_allocation_ref: { account_id: { in: accountIds } },
            },
            include: {
                equipment_ref: {
                    include: {
                        simple_field_lookup: true,
                        door_type_lookup: true,
                        wall_type_lookup: true,
                        floor_type_lookup: true,
                        roof_type_lookup: true,
                        rim_type_lookup: true,
                        oem_make_model_ref: true,
                        equipment_permit: true,
                        equipment_type_lookup_ref: true,
                        current_equipment_gps_location: {
                            take: 1,
                            orderBy: { last_gps_update: "desc" },
                            include: {
                                current_equipment_motion_status_lookup: true,
                                current_equipment_alarm_status_lookup: true,
                            },
                        },
                        equipment_iot_device_ref: {
                            include: {
                                iot_device_ref: {
                                    include: {
                                        iot_device_vendor_ref: true,
                                    },
                                },
                            },
                        },
                        dot_inspection: {
                            // include inspection info
                            orderBy: { next_inspection_due: "desc" },
                            take: 1,
                        },
                    },
                },
                equipment_type_allocation_ref: {
                    include: {
                        account: true,
                        schedule_agreement_line_item_ref: {
                            include: {
                                schedule_agreement_ref: {
                                    include: {
                                        master_agreement_ref: true,
                                        schedule_agreement_has_attachment: {
                                            include: { attachment: true },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            },
            orderBy: {
                equipment_ref: {
                    equipment_id: "asc",
                },
            },
            take: 200000000,
        });
        // --- FILTERING BASED ON filterBy ---
        let filteredData = rawData;
        if (filterBy === "gpsEquippedCount") {
            filteredData = rawData.filter((item) => uniqueGpsEquipped.has(item.equipment_ref.equipment_id));
        }
        else if (filterBy === "accessWithoutGpsCount") {
            filteredData = rawData.filter((item) => !uniqueGpsEquipped.has(item.equipment_ref.equipment_id));
        }
        else if (filterBy === "idleUnitsCount") {
            filteredData = rawData.filter((item) => idleEquipIds.has(item.equipment_ref.equipment_id));
        }
        else if (filterBy === "geofenceCount") {
            if (geofenceCount > 0) {
                filteredData = rawData;
            }
            else {
                filteredData = [];
            }
        }
        else if (filterBy === "overdueDotInspectionCount") {
            filteredData = rawData.filter((item) => expiredInspectionIds.has(item.equipment_ref.equipment_id));
        }
        else if (filterBy === "totalCount") {
            filteredData = rawData;
        }
        // Pagination
        const totalRecords = filteredData.length;
        const totalPages = Math.ceil(totalRecords / perPage);
        const start = (page - 1) * perPage;
        const end = start + perPage;
        const paginatedData = filteredData.slice(start, end);
        // --- FORMAT FULL DATA ---
        const records = paginatedData.map((item) => {
            const eq = item.equipment_ref;
            const gps = eq.current_equipment_gps_location?.[0];
            const iotDevice = eq.equipment_iot_device_ref;
            const alloc = item.equipment_type_allocation_ref;
            const lineItem = alloc?.schedule_agreement_line_item_ref;
            const agreement = lineItem?.schedule_agreement_ref;
            const attachment = agreement?.schedule_agreement_has_attachment?.[0]?.attachment;
            const inspection = eq.dot_inspection?.[0];
            const arrival_time_val = gps?.last_gps_update
                ? new Date(gps.last_gps_update).toLocaleTimeString("en-US", {
                    hour12: true,
                    hour: "2-digit",
                    minute: "2-digit",
                })
                : null;
            return {
                equipment_id: eq.equipment_id,
                activation_date: item.activation_date,
                deactivation_date: item.deactivation_date,
                driver_name: item.driver_name,
                unitNumber: eq.unit_number,
                customerUnitNumber: eq.customer_unit_number,
                status: eq.simple_field_lookup?.field_name || eq.status,
                vin: eq.vin,
                permit: eq.equipment_permit?.permit_date || null,
                make: eq.oem_make_model_ref?.make || null,
                model: eq.oem_make_model_ref?.model || null,
                year: eq.oem_make_model_ref?.year || null,
                length: eq.oem_make_model_ref?.length || null,
                doorType: eq.door_type_lookup?.field_name || eq.door_type,
                wallType: eq.wall_type_lookup?.field_name || eq.wall_type,
                breakType: eq.brake_type,
                color: eq.color,
                liftGate: eq.liftgate,
                domicile: eq.domicile,
                tenBranch: eq.ten_branch,
                lastPmDate: eq.last_pm_date,
                nextPmDue: eq.next_pm_due,
                dotCviStatus: eq.dot_cvi_status,
                dotCviExpire: eq.dot_cvi_expire,
                lastReeferPmDate: eq.last_reefer_pm_date,
                nextReeferPmDue: eq.next_reefer_pm_due,
                lastMRDate: eq.last_m_and_r_date,
                reeferMakeType: eq.reefer_make_type,
                reeferSerial: eq.reefer_serial,
                liftGateSerial: eq.lifgate_serial,
                trailerHeight: eq.trailer_height,
                trailerWidth: eq.trailer_width,
                trailerLength: eq.trailer_length,
                dateInService: eq.date_in_service,
                tireSize: eq.tire_size,
                floorType: eq.floor_type_lookup?.field_name || eq.floor_type,
                roofType: eq.roof_type_lookup?.field_name || eq.roof_type,
                rimType: eq.rim_type_lookup?.field_name || eq.rim_type,
                vendorName: iotDevice?.iot_device_ref?.iot_device_vendor_ref?.vendor_name || null,
                AccountId: alloc.account?.account_id || null,
                accountNumber: alloc.account?.account_number || null,
                accountName: alloc.account?.account_name || null,
                account: alloc.account
                    ? `${alloc.account.account_number || ""} - ${alloc.account.account_name || ""}`
                    : null,
                rate: lineItem?.rate ?? null,
                fixedRate: lineItem?.fixed_rate ?? null,
                variableRate: lineItem?.variable_rate ?? null,
                estimatedMiles: lineItem?.estimated_miles ?? null,
                estimatedHours: lineItem?.estimated_hours ?? null,
                contractStartDate: agreement?.master_agreement_ref?.contract_start_Date ?? null,
                contractEndDate: agreement?.termination_date ?? null,
                contractTermType: agreement?.master_agreement_ref?.contract_term_type ?? null,
                licensePlateNumber: eq.equipment_permit?.license_plate_number || null,
                licensePlateState: eq.equipment_permit?.license_plate_state || null,
                url: attachment?.url ?? null,
                mimeType: attachment?.mime_type ?? null,
                agreementType: agreement?.schedule_type ?? null,
                current_equipment_gps_location_id: gps?.current_equipment_gps_location_id || null,
                latitude: gps?.latitude || null,
                longitude: gps?.longitude || null,
                last_gps_coordinates: gps ? `${gps.latitude},${gps.longitude}` : null,
                location: gps?.location || null,
                motionStatus: gps?.motion_status || null,
                alarmCodeStatus: gps?.alarm_code_status || null,
                arrival_time: arrival_time_val,
                lastGpsUpdate: gps?.last_gps_update || null,
                created_by: gps?.created_by || null,
                nextInspectionDue: inspection?.next_inspection_due || null,
                inspectionResult: inspection?.inspection_result || null,
            };
        });
        return res.status(200).json({
            success: 200,
            message: "Equipment counts and records fetched successfully",
            data: JSON.parse(JSON.stringify({
                success: true,
                stats: {
                    totalCount,
                    gpsEquippedCount,
                    accessWithoutGpsCount,
                    idleUnitsCount,
                    geofenceCount,
                    overdueDotInspectionCount,
                },
                totalRecords,
                currentPage: page,
                perPage,
                totalPages: Math.ceil(totalRecords / perPage),
                data: records,
            }, replacer)),
        });
    }
    catch (error) {
        console.error("Error fetching equipment stats:", error);
        return res.status(500).json({ success: false, message: "Server Error" });
    }
};
exports.getEquipmentCounts = getEquipmentCounts;
const downloadListView = async (req, res) => {
    try {
        let account_ids = [];
        // Parse comma-separated account_id string like "1,2"
        if (typeof req.query.account_id === "string") {
            account_ids = req.query.account_id
                .split(",")
                .map((id) => Number(id.trim()))
                .filter((id) => !isNaN(id));
        }
        if (!Array.isArray(account_ids) || account_ids.length === 0) {
            return res.status(400).json({
                success: false,
                message: "account_ids must be a comma-separated list of numbers",
            });
        }
        // Pagination params
        const page = parseInt(req.query.page) || 1;
        const perPage = parseInt(req.query.perPage) || 10;
        const skip = (page - 1) * perPage;
        // Extract filters
        const { equipment_id, vin, license_plate_number, motion_status, last_gps_update, equipment_type, location, model, customer_unit_number, year, last_gps_coordinates, unit_number, break_type, color, lift_gate, ten_branch, dot_cvi_status, trailer_height, trailer_width, trailer_length, tire_size, roof_type, floor_type, rim_type, status, make, latitude, longitude, account, contractStartDate, contractEndDate, agreement_type, equipment_load_status, } = req.query;
        // ---------------------- Filters Build ----------------------
        const equipmentRefFilter = {};
        if (vin)
            equipmentRefFilter.vin = { contains: String(vin), mode: "insensitive" };
        if (unit_number)
            equipmentRefFilter.unit_number = {
                contains: String(unit_number),
                mode: "insensitive",
            };
        if (customer_unit_number)
            equipmentRefFilter.customer_unit_number = {
                contains: String(customer_unit_number),
                mode: "insensitive",
            };
        if (break_type)
            equipmentRefFilter.brake_type = {
                contains: String(break_type),
                mode: "insensitive",
            };
        if (color)
            equipmentRefFilter.color = {
                contains: String(color),
                mode: "insensitive",
            };
        if (lift_gate)
            equipmentRefFilter.liftgate = {
                contains: String(lift_gate),
                mode: "insensitive",
            };
        if (ten_branch)
            equipmentRefFilter.ten_branch = {
                contains: String(ten_branch),
                mode: "insensitive",
            };
        if (dot_cvi_status)
            equipmentRefFilter.dot_cvi_status = {
                contains: String(dot_cvi_status),
                mode: "insensitive",
            };
        if (trailer_height)
            equipmentRefFilter.trailer_height = {
                contains: String(trailer_height),
                mode: "insensitive",
            };
        if (trailer_width)
            equipmentRefFilter.trailer_width = {
                contains: String(trailer_width),
                mode: "insensitive",
            };
        if (trailer_length)
            equipmentRefFilter.trailer_length = {
                contains: String(trailer_length),
                mode: "insensitive",
            };
        if (tire_size)
            equipmentRefFilter.tire_size = {
                contains: String(tire_size),
                mode: "insensitive",
            };
        if (status) {
            equipmentRefFilter.simple_field_lookup = {
                field_name: { contains: String(status), mode: "insensitive" },
            };
        }
        if (make) {
            equipmentRefFilter.oem_make_model_ref = {
                ...equipmentRefFilter.oem_make_model_ref,
                make: { contains: String(make), mode: "insensitive" },
            };
        }
        if (model) {
            equipmentRefFilter.oem_make_model_ref = {
                ...equipmentRefFilter.oem_make_model_ref,
                model: { contains: String(model), mode: "insensitive" },
            };
        }
        if (year) {
            equipmentRefFilter.oem_make_model_ref = {
                ...equipmentRefFilter.oem_make_model_ref,
                year: String(year),
            };
        }
        if (equipment_type) {
            equipmentRefFilter.equipment_type_lookup_ref = {
                equipment_type: {
                    contains: String(equipment_type),
                    mode: "insensitive",
                },
            };
        }
        if (roof_type) {
            equipmentRefFilter.roof_type_lookup = {
                field_name: { contains: String(roof_type), mode: "insensitive" },
            };
        }
        if (floor_type) {
            equipmentRefFilter.floor_type_lookup = {
                field_name: { contains: String(floor_type), mode: "insensitive" },
            };
        }
        if (rim_type) {
            equipmentRefFilter.rim_type_lookup = {
                field_name: { contains: String(rim_type), mode: "insensitive" },
            };
        }
        if (license_plate_number) {
            equipmentRefFilter.equipment_permit = {
                license_plate_number: {
                    contains: String(license_plate_number),
                    mode: "insensitive",
                },
            };
        }
        if (motion_status || last_gps_update || location || latitude || longitude) {
            equipmentRefFilter.current_equipment_gps_location = {
                some: {
                    ...(motion_status && {
                        motion_status: {
                            contains: String(motion_status),
                            mode: "insensitive",
                        },
                    }),
                    ...(last_gps_update && {
                        last_gps_update: { gte: new Date(String(last_gps_update)) },
                    }),
                    ...(location && {
                        location: { contains: String(location), mode: "insensitive" },
                    }),
                    ...(latitude && { latitude: Number(latitude) }),
                    ...(longitude && { longitude: Number(longitude) }),
                },
            };
        }
        if (equipment_load_status) {
            equipmentRefFilter.equipment_load_detail = {
                some: {
                    OR: [
                        {
                            equipment_load_status: {
                                contains: String(equipment_load_status),
                                mode: "insensitive",
                            },
                        },
                        {
                            load_status_lookup: {
                                field_name: {
                                    contains: String(equipment_load_status),
                                    mode: "insensitive",
                                },
                            },
                        },
                    ],
                },
            };
        }
        // ---------------------- Main Query ----------------------
        const whereCondition = {
            equipment_type_allocation_ref: {
                account_id: { in: account_ids },
                ...(account && {
                    account: {
                        OR: [
                            {
                                account_number: {
                                    contains: String(account),
                                    mode: "insensitive",
                                },
                            },
                            {
                                account_name: {
                                    contains: String(account),
                                    mode: "insensitive",
                                },
                            },
                        ],
                    },
                }),
                ...(contractStartDate && {
                    schedule_agreement_line_item_ref: {
                        schedule_agreement_ref: {
                            master_agreement_ref: {
                                contract_start_Date: {
                                    gte: new Date(String(contractStartDate)),
                                },
                            },
                        },
                    },
                }),
                ...(contractEndDate && {
                    schedule_agreement_line_item_ref: {
                        schedule_agreement_ref: {
                            termination_date: { lte: new Date(String(contractEndDate)) },
                        },
                    },
                }),
                ...(agreement_type && {
                    schedule_agreement_line_item_ref: {
                        schedule_agreement_ref: {
                            schedule_type: {
                                contains: String(agreement_type),
                                mode: "insensitive",
                            },
                        },
                    },
                }),
            },
            equipment_ref: equipmentRefFilter,
        };
        const rawData = await database_config_1.default.equipment_assignment.findMany({
            where: whereCondition,
            include: {
                equipment_ref: {
                    include: {
                        simple_field_lookup: true,
                        door_type_lookup: true,
                        wall_type_lookup: true,
                        floor_type_lookup: true,
                        roof_type_lookup: true,
                        rim_type_lookup: true,
                        oem_make_model_ref: true,
                        equipment_permit: true,
                        equipment_type_lookup_ref: true,
                        current_equipment_gps_location: {
                            take: 1,
                            orderBy: { last_gps_update: "desc" },
                            include: {
                                current_equipment_motion_status_lookup: true,
                                current_equipment_alarm_status_lookup: true,
                            },
                        },
                        equipment_iot_device_ref: {
                            include: {
                                iot_device_ref: {
                                    include: {
                                        iot_device_vendor_ref: true,
                                    },
                                },
                            },
                        },
                        equipment_load_detail: {
                            take: 1,
                            orderBy: { equipment_load_date: "desc" },
                            include: {
                                load_status_lookup: true,
                            },
                        },
                    },
                },
                equipment_type_allocation_ref: {
                    include: {
                        account: true,
                        schedule_agreement_line_item_ref: {
                            include: {
                                schedule_agreement_ref: {
                                    include: {
                                        master_agreement_ref: true,
                                        schedule_agreement_has_attachment: {
                                            include: { attachment: true },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            },
            orderBy: {
                equipment_ref: {
                    equipment_id: "asc",
                },
            },
            take: 10000000,
        });
        // ---------------------- Manual Filters ----------------------
        let filteredData = rawData;
        if (equipment_id && String(equipment_id).trim() !== "") {
            const eqIdStr = String(equipment_id).trim();
            filteredData = rawData.filter((item) => item.equipment_ref.equipment_id.toString().includes(eqIdStr));
        }
        // Pagination
        const totalRecords = filteredData.length;
        const totalPages = Math.ceil(totalRecords / perPage);
        const start = (page - 1) * perPage;
        const end = start + perPage;
        const paginatedData = filteredData.slice(start, end);
        // ---------------------- Format & Normalize ----------------------
        const formatted = paginatedData.map((item) => {
            const eq = item.equipment_ref;
            const gps = eq.current_equipment_gps_location?.[0];
            const iotDevice = eq.equipment_iot_device_ref;
            const alloc = item.equipment_type_allocation_ref;
            const lineItem = alloc?.schedule_agreement_line_item_ref;
            const agreement = lineItem?.schedule_agreement_ref;
            const attachment = agreement?.schedule_agreement_has_attachment?.[0]?.attachment;
            const loadDetail = eq.equipment_load_detail?.[0];
            const arrival_time_val = gps?.last_gps_update
                ? new Date(gps.last_gps_update).toLocaleTimeString("en-US", {
                    hour12: true,
                    hour: "2-digit",
                    minute: "2-digit",
                })
                : null;
            return normalizeData({
                equipment_id: eq.equipment_id,
                activation_date: item.activation_date,
                deactivation_date: item.deactivation_date,
                driver_name: item.driver_name,
                unitNumber: eq.unit_number,
                customerUnitNumber: eq.customer_unit_number,
                status: eq.simple_field_lookup?.field_name || eq.status,
                vin: eq.vin,
                permit: eq.equipment_permit?.permit_date || null,
                make: eq.oem_make_model_ref?.make || null,
                model: eq.oem_make_model_ref?.model || null,
                year: eq.oem_make_model_ref?.year || null,
                length: eq.oem_make_model_ref?.length || null,
                doorType: eq.door_type_lookup?.field_name || eq.door_type,
                wallType: eq.wall_type_lookup?.field_name || eq.wall_type,
                breakType: eq.brake_type,
                color: eq.color,
                liftGate: eq.liftgate,
                domicile: eq.domicile,
                tenBranch: eq.ten_branch,
                lastPmDate: eq.last_pm_date,
                nextPmDue: eq.next_pm_due,
                dotCviStatus: eq.dot_cvi_status,
                dotCviExpire: eq.dot_cvi_expire,
                lastReeferPmDate: eq.last_reefer_pm_date,
                nextReeferPmDue: eq.next_reefer_pm_due,
                lastMRDate: eq.last_m_and_r_date,
                reeferMakeType: eq.reefer_make_type,
                reeferSerial: eq.reefer_serial,
                liftGateSerial: eq.lifgate_serial,
                trailerHeight: eq.trailer_height,
                trailerWidth: eq.trailer_width,
                trailerLength: eq.trailer_length,
                dateInService: eq.date_in_service,
                tireSize: eq.tire_size,
                floorType: eq.floor_type_lookup?.field_name || eq.floor_type,
                roofType: eq.roof_type_lookup?.field_name || eq.roof_type,
                rimType: eq.rim_type_lookup?.field_name || eq.rim_type,
                vendorName: iotDevice?.iot_device_ref?.iot_device_vendor_ref?.vendor_name || null,
                AccountId: alloc.account?.account_id || null,
                accountNumber: alloc.account?.account_number || null,
                accountName: alloc.account?.account_name || null,
                account: alloc.account
                    ? `${alloc.account.account_number || ""} - ${alloc.account.account_name || ""}`
                    : null,
                rate: lineItem?.rate ?? null,
                fixedRate: lineItem?.fixed_rate ?? null,
                variableRate: lineItem?.variable_rate ?? null,
                estimatedMiles: lineItem?.estimated_miles ?? null,
                estimatedHours: lineItem?.estimated_hours ?? null,
                contractStartDate: agreement?.master_agreement_ref?.contract_start_Date ?? null,
                contractEndDate: agreement?.termination_date ?? null,
                contractTermType: agreement?.master_agreement_ref?.contract_term_type ?? null,
                licensePlateNumber: eq.equipment_permit?.license_plate_number || null,
                licensePlateState: eq.equipment_permit?.license_plate_state || null,
                url: attachment?.url ?? null,
                mimeType: attachment?.mime_type ?? null,
                agreementType: agreement?.schedule_type ?? null,
                current_equipment_gps_location_id: gps?.current_equipment_gps_location_id || null,
                latitude: gps?.latitude || null,
                longitude: gps?.longitude || null,
                last_gps_coordinates: gps ? `${gps.latitude},${gps.longitude}` : null,
                location: gps?.location || null,
                motionStatus: gps?.motion_status || null,
                alarmCodeStatus: gps?.alarm_code_status || null,
                arrival_time: arrival_time_val,
                lastGpsUpdate: gps?.last_gps_update || null,
                created_by: gps?.created_by || null,
                equipmentLoadStatus: loadDetail?.load_status_lookup?.field_name ||
                    loadDetail?.equipment_load_status ||
                    null,
                equipmentLoadDate: loadDetail?.equipment_load_date || null,
                equipmentUnloadDate: loadDetail?.equipment_unload_date || null,
                equipmentLoadDetail: loadDetail?.equipment_load_detail || null,
            });
        });
        // ---------------------- Excel Columns ----------------------
        const columns = Object.keys(formatted[0] || {}).map((key) => ({
            header: key.replace(/([A-Z])/g, " $1"),
            key,
            width: 20,
        }));
        // Filename
        const timestamp = new Date()
            .toISOString()
            .replace(/[:.]/g, "-")
            .slice(0, -5);
        const filename = `equipment_list_page_${page}_of_${totalPages}_${timestamp}.xlsx`;
        // Export
        const exporter = new excelUtils_1.ExcelExporter();
        await exporter.generateWorkbook({
            sheetName: "Equipment List",
            title: `Equipment Export`,
            subtitle: (0, excelUtils_1.createPaginationSubtitle)(page, perPage, skip, totalRecords),
            columns,
            data: formatted,
            filename,
        });
        await exporter.writeToResponse(res, filename);
    }
    catch (error) {
        console.error("Error in downloadListView:", error);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });
    }
};
exports.downloadListView = downloadListView;
function normalizeData(obj) {
    if (obj === null || obj === undefined)
        return obj;
    if (typeof obj === "bigint") {
        return obj.toString(); // or Number(obj) if you’re sure it fits
    }
    if (Array.isArray(obj)) {
        return obj.map(normalizeData);
    }
    if (typeof obj === "object") {
        return Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, normalizeData(v)]));
    }
    return obj;
}
// BigInt-safe replacer function
function replacer(key, value) {
    return typeof value === "bigint" ? value.toString() : value;
}
