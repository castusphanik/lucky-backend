"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getGeofenceCountsCtrl = exports.checkLocationAndInsertGeofenceEvent = exports.updateEquipmentLocationAndEventCreation = exports.checkPointInGeofenceCtrl = exports.checkEquipmentInGeofenceCtrl = exports.toggleGeofenceStatus = exports.getGeofenceByCustIdCtrl = exports.getGeofenceByIdCtrl = exports.fetchGeofencesByCustAndAccIdsCtrl = exports.updateGeofenceCtrl = exports.createGeofenceCtrl = void 0;
const database_config_1 = __importDefault(require("../../config/database.config"));
const responseUtils_1 = require("../../utils/responseUtils");
const pagination_1 = require("../../utils/pagination");
// CREATE GEOFENCE
const createGeofenceCtrl = async (req, res) => {
    try {
        const { geofence_name, shape_type, polygon, center_lat, center_lng, radius_meters, owner, tag_lookup_id, customer_id, // customer_id as org id
        account_ids, // array of account IDs
        description, geofence_location, status, created_by, event_master_id, } = req.body;
        //const eventMasterId = req.body.event_master_id;
        // Validation
        if (!geofence_name ||
            !shape_type ||
            !tag_lookup_id ||
            !customer_id ||
            !Array.isArray(account_ids) ||
            account_ids.length === 0) {
            return (0, responseUtils_1.sendErrorResponse)(res, "Missing required fields: geofence_name, shape_type, tag_lookup_id, customer_id, account_ids");
        }
        if (shape_type === "Polygon" && !polygon) {
            return (0, responseUtils_1.sendErrorResponse)(res, "Polygon shape requires 'polygon' field with coordinates");
        }
        if (shape_type === "Circle" &&
            (center_lat == null || center_lng == null || radius_meters == null)) {
            return (0, responseUtils_1.sendErrorResponse)(res, "Circle shape requires center_lat, center_lng and radius_meters");
        }
        // Insert into DB
        const [insertedRow] = await database_config_1.default.$queryRawUnsafe(`
  INSERT INTO geofence_account (
    account_ids,
    customer_id,
    geofence_name,
    shape_type,
    polygon,
    center_lat,
    center_lng,
    radius_meters,
    owner,
    tag_lookup_id,
    description,
    geofence_location,
    status,
    created_by,
    is_deleted,
    created_at,
    updated_at,
    updated_by,event_master_id
  ) VALUES (
    $1::jsonb, $2, $3, $4,
    CASE 
      WHEN $4 = 'Polygon' THEN ST_GeomFromText($5, 4326)
      ELSE NULL
    END,
    $6, $7, $8,
    $9, $10, $11, $12, $13, $14,
    false, NOW(), NOW(), $15,$16
  )
  RETURNING geofence_account_id
  `, JSON.stringify(account_ids), customer_id, geofence_name, shape_type, polygon || null, center_lat ? parseFloat(center_lat) : null, center_lng ? parseFloat(center_lng) : null, radius_meters ? parseFloat(radius_meters) : null, owner, tag_lookup_id, description || null, geofence_location || null, status || "ACTIVE", created_by || owner, owner, event_master_id);
        const geofenceAccountId = insertedRow.geofence_account_id;
        /////
        const equipmentTypeAllocations = await database_config_1.default.equipment_type_allocation.findMany({
            where: {
                account_id: {
                    in: account_ids,
                },
            },
            select: {
                equipment_assignment: {
                    select: {
                        equipment_id: true,
                    },
                },
            },
        });
        const equipmentIdSet = new Set();
        equipmentTypeAllocations.forEach((allocation) => {
            allocation.equipment_assignment.forEach((assignment) => {
                equipmentIdSet.add(assignment.equipment_id);
            });
        });
        const equipmentIdArray = Array.from(equipmentIdSet);
        // console.log("Equipment IDs:", equipmentIdArray, geofenceAccountId);
        for (const equipment_id of equipmentIdArray) {
            // Fetch current geofence_account_id array from equipment
            const equipmentRecord = await database_config_1.default.equipment.findUnique({
                where: { equipment_id },
                select: { geofence_account_id: true }, // Assuming this is stored as JSON array
            });
            let updatedGeofenceIds = [];
            if (equipmentRecord && equipmentRecord.geofence_account_id) {
                updatedGeofenceIds = equipmentRecord.geofence_account_id;
                if (!updatedGeofenceIds.includes(geofenceAccountId)) {
                    updatedGeofenceIds.push(geofenceAccountId);
                }
            }
            else {
                updatedGeofenceIds.push(geofenceAccountId);
            }
            // Update equipment with new geofence_account_id array and event_master_id
            await database_config_1.default.equipment.update({
                where: { equipment_id },
                data: {
                    geofence_account_id: updatedGeofenceIds,
                    event_master_id: event_master_id,
                },
            });
        }
        /////
        return (0, responseUtils_1.sendSuccessResponse)(res, geofenceAccountId, "Geofence created successfully");
    }
    catch (error) {
        console.error("Failed to create geofence", error);
        return (0, responseUtils_1.sendErrorResponse)(res, "Failed to create geofence");
    }
};
exports.createGeofenceCtrl = createGeofenceCtrl;
// UPDATE GEOFENCE
const updateGeofenceCtrl = async (req, res) => {
    try {
        const { id } = req.params;
        const { geofence_name, shape_type, polygon, center_lat, center_lng, radius_meters, owner, tag_lookup_id, customer_id, // customer_id as org id
        account_ids, // array of account IDs
        description, geofence_location, status, // "ACTIVE" | "IN-ACTIVE"
        created_by, event_master_id, } = req.body;
        if (!id || isNaN(Number(id))) {
            return (0, responseUtils_1.sendErrorResponse)(res, "Valid geofence ID is required");
        }
        // Optional validations based on shape type
        if (shape_type === "Polygon" && !polygon) {
            return (0, responseUtils_1.sendErrorResponse)(res, "Polygon shape requires 'polygon' field with coordinates");
        }
        if (shape_type === "Circle" &&
            (center_lat == null || center_lng == null || radius_meters == null)) {
            return (0, responseUtils_1.sendErrorResponse)(res, "Circle shape requires center_lat, center_lng and radius_meters");
        }
        // Build dynamic SQL for optional updates
        const updateFields = [];
        const values = [];
        let idx = 1;
        if (account_ids !== undefined) {
            updateFields.push(`account_ids = $${idx++}::jsonb`);
            values.push(JSON.stringify(account_ids));
        }
        if (customer_id !== undefined) {
            updateFields.push(`customer_id = $${idx++}`);
            values.push(customer_id);
        }
        if (geofence_name !== undefined) {
            updateFields.push(`geofence_name = $${idx++}`);
            values.push(geofence_name);
        }
        if (shape_type !== undefined) {
            updateFields.push(`shape_type = $${idx++}`);
            values.push(shape_type);
        }
        if (shape_type === "Polygon" && polygon) {
            updateFields.push(`polygon = ST_GeomFromText($${idx++}, 4326)`);
            values.push(polygon);
        }
        if (center_lat !== undefined && center_lat !== null) {
            updateFields.push(`center_lat = $${idx++}`);
            values.push(Number(center_lat));
        }
        if (center_lng !== undefined && center_lng !== null) {
            updateFields.push(`center_lng = $${idx++}`);
            values.push(Number(center_lng));
        }
        if (radius_meters !== undefined && radius_meters !== null) {
            updateFields.push(`radius_meters = $${idx++}`);
            values.push(Number(radius_meters));
        }
        if (owner !== undefined) {
            updateFields.push(`owner = $${idx++}`);
            values.push(owner);
        }
        if (tag_lookup_id !== undefined) {
            updateFields.push(`tag_lookup_id = $${idx++}`);
            values.push(tag_lookup_id);
        }
        if (description !== undefined) {
            updateFields.push(`description = $${idx++}`);
            values.push(description);
        }
        if (geofence_location !== undefined) {
            updateFields.push(`geofence_location = $${idx++}`);
            values.push(geofence_location);
        }
        if (status !== undefined) {
            updateFields.push(`status = $${idx++}`);
            values.push(status);
        }
        if (created_by !== undefined) {
            updateFields.push(`created_by = $${idx++}`);
            values.push(created_by);
        }
        if (event_master_id !== undefined) {
            updateFields.push(`event_master_id = $${idx++}`);
            values.push(event_master_id);
        }
        // Always update updated_at & updated_by
        updateFields.push(`updated_at = NOW()`);
        if (owner !== undefined) {
            updateFields.push(`updated_by = $${idx++}`);
            values.push(owner);
        }
        // Final query
        const query = `
      UPDATE geofence_account
      SET ${updateFields.join(", ")}
      WHERE geofence_account_id = $${idx}
    `;
        values.push(Number(id));
        const result = await database_config_1.default.$executeRawUnsafe(query, ...values);
        if (result === 0) {
            return (0, responseUtils_1.sendErrorResponse)(res, "Geofence not found", 404);
        }
        return (0, responseUtils_1.sendSuccessResponse)(res, null, "Geofence updated successfully");
    }
    catch (error) {
        console.error("Failed to update geofence", error);
        return (0, responseUtils_1.sendErrorResponse)(res, "Failed to update geofence");
    }
};
exports.updateGeofenceCtrl = updateGeofenceCtrl;
// FETCH GEOFENCES BY CUSTOMER AND ACCOUNTS
const fetchGeofencesByCustAndAccIdsCtrl = async (req, res) => {
    try {
        const { account_ids, customer_id } = req.params;
        // Validate both are provided and not empty
        if (!account_ids || !customer_id) {
            return res.status(400).json({
                status: "error",
                message: "Both account_ids and customer_id are required",
            });
        }
        const accountIdsArray = account_ids
            .split(",")
            .map((id) => parseInt(id.trim(), 10));
        if (accountIdsArray.length === 0 ||
            isNaN(parseInt(customer_id, 10))) {
            return res.status(400).json({
                status: "error",
                message: "Invalid account_ids or customer_id format",
            });
        }
        // Query geofences
        const geofences = await database_config_1.default.$queryRawUnsafe(`
  SELECT
    geofence_account_id,
    geofence_name,
    account_ids,
    shape_type,
    ST_AsGeoJSON(polygon) AS polygon,
    center_lat,
    center_lng,
    radius_meters,
    owner
  FROM geofence_account
  WHERE customer_id = $1
    AND EXISTS (
      SELECT 1
      FROM jsonb_array_elements_text(account_ids::jsonb) as elem
      WHERE elem::int = ANY($2::int[])
    )
  `, parseInt(customer_id, 10), accountIdsArray);
        if (!geofences || geofences.length === 0) {
            return (0, responseUtils_1.sendErrorResponse)(res, "No data found");
        }
        // Format polygons
        const result = geofences.map((g) => {
            let polygon = null;
            try {
                if (g.polygon) {
                    const geoJson = JSON.parse(g.polygon);
                    polygon = geoJson.coordinates[0].map(([lng, lat]) => ({ lat, lng }));
                }
            }
            catch (e) {
                console.error("Polygon parsing failed", e);
            }
            return {
                id: g.geofence_account_id,
                geofence_name: g.geofence_name,
                account_ids: g.account_ids,
                shape_type: g.shape_type,
                center_lat: g.center_lat,
                center_lng: g.center_lng,
                radius_meters: g.radius_meters,
                polygon,
            };
        });
        return (0, responseUtils_1.sendSuccessResponse)(res, result, "Geofences fetched successfully");
    }
    catch (error) {
        console.error("Failed to fetch geofences", error);
        return (0, responseUtils_1.sendErrorResponse)(res, "Failed to fetch geofences");
    }
};
exports.fetchGeofencesByCustAndAccIdsCtrl = fetchGeofencesByCustAndAccIdsCtrl;
// GET SINGLE GEOFENCE BY ID
const getGeofenceByIdCtrl = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id || isNaN(Number(id))) {
            return (0, responseUtils_1.sendErrorResponse)(res, "Valid geofence ID is required");
        }
        const geofence = await database_config_1.default.$queryRawUnsafe(`
      SELECT 
        g.geofence_account_id,
        g.geofence_name,
        g.shape_type,
        ST_AsGeoJSON(g.polygon) AS polygon,
        g.center_lat,
        g.center_lng,
        g.radius_meters,
        g.owner,
        g.description,
        g.geofence_location,
        g.status,
        g.created_by,
        g.created_at,
        g.updated_at,
        g.updated_by,
        t.tag_lookup_id,
        t.tag_name,
        e.event_master_id,
        e.event_name,
        e.event_type,
        e.metric_value,
        e.operation_type,
        json_build_object(
          'first_name', cu.first_name,
          'last_name', cu.last_name,
          'email', cu.email
        ) AS created_by_user,
        (
          SELECT COALESCE(
            (
              SELECT json_agg(json_build_object(
                'account_id', a.account_id,
                'account_name', a.account_name,
                'account_number', a.account_number
              ))
              FROM account a
              WHERE a.account_id = ANY(
                SELECT json_array_elements_text(
                  CASE 
                    WHEN g.account_ids IS NULL THEN '[]'::json
                    ELSE g.account_ids::json
                  END
                )::integer
              )
            ),
            '[]'::json
          )
        ) AS accounts
      FROM geofence_account g
      LEFT JOIN tag_lookup t 
        ON g.tag_lookup_id = t.tag_lookup_id
      LEFT JOIN event_master e 
         ON g.event_master_id = e.event_master_id
      LEFT JOIN "user" cu 
        ON g.created_by = cu.user_id
      WHERE g.geofence_account_id = $1 
        AND g.is_deleted = false
      `, Number(id));
        if (!geofence || geofence.length === 0) {
            return (0, responseUtils_1.sendErrorResponse)(res, "Geofence not found", 404);
        }
        const g = geofence[0];
        // Parse polygon if available
        let polygon = null;
        try {
            if (g.polygon) {
                const geoJson = JSON.parse(g.polygon);
                polygon = geoJson.coordinates[0].map(([lng, lat]) => ({
                    lat,
                    lng,
                }));
            }
        }
        catch (e) {
            console.error("Polygon parse error:", e);
        }
        const response = {
            id: g.geofence_account_id,
            geofence_name: g.geofence_name,
            geofence_shape: g.shape_type,
            center_lat: g.center_lat,
            center_lng: g.center_lng,
            radius_meters: g.radius_meters,
            polygon,
            owner: g.owner,
            description: g.description,
            geofence_location: g.geofence_location,
            status: g.status,
            tag_lookup_id: g.tag_lookup_id || null,
            tag_name: g.tag_name || null,
            event_master_id: g.event_master_id || null,
            event_name: g.event_name || null,
            event_type: g.event_type || null,
            event_metric_value: g.metric_value || null,
            event_operation_type: g.operation_type || null,
            created_by: g.created_by,
            created_by_user: g.created_by_user,
            updated_by: g.updated_by,
            updated_by_user: g.updated_by_user,
            created_at: g.created_at,
            updated_at: g.updated_at,
            accounts: g.accounts || [],
        };
        return (0, responseUtils_1.sendSuccessResponse)(res, response, "Geofence detail fetched successfully");
    }
    catch (error) {
        console.error("Error fetching geofence by ID:", error);
        return (0, responseUtils_1.sendErrorResponse)(res, "Failed to fetch geofence");
    }
};
exports.getGeofenceByIdCtrl = getGeofenceByIdCtrl;
// GET ALL BY CUSTOMER
// export const getGeofenceByCustIdCtrl = async (req: Request, res: Response) => {
//   try {
//     const { custId } = req.params;
//     if (!custId || isNaN(Number(custId))) {
//       return sendErrorResponse(res, "Valid customer ID is required");
//     }
//     const geofences = await prisma.$queryRawUnsafe<any[]>(
//       `
//       SELECT
//         g.geofence_account_id,
//         g.geofence_name,
//         g.shape_type,
//         ST_AsGeoJSON(g.polygon::geometry) AS polygon,
//         g.center_lat,
//         g.center_lng,
//         g.radius_meters,
//         g.owner,
//         g.description,
//         g.geofence_location,
//         g.status,
//         g.created_by,
//         g.created_at,
//         g.updated_by,
//         g.updated_at,
//         t.tag_name,
//         json_build_object(
//           'first_name', cu.first_name,
//           'last_name', cu.last_name,
//           'email', cu.email
//         ) AS created_by_user,
//         COALESCE(
//           json_agg(
//             DISTINCT jsonb_build_object(
//               'account_id', a.account_id,
//               'account_name', a.account_name,
//               'account_number', a.account_number
//             )
//           ) FILTER (WHERE a.account_id IS NOT NULL),
//           '[]'
//         ) AS accounts
//       FROM geofence_account g
//       LEFT JOIN tag_lookup t
//         ON g.tag_lookup_id = t.tag_lookup_id
//       LEFT JOIN account a
//         ON a.account_id = ANY(
//           SELECT jsonb_array_elements_text(g.account_ids)::int
//         )
//       LEFT JOIN "user" cu
//         ON g.created_by = cu.user_id
//       WHERE g.customer_id = $1
//         AND g.is_deleted = false
//       GROUP BY
//         g.geofence_account_id,
//         g.geofence_name,
//         g.shape_type,
//         g.polygon,
//         g.center_lat,
//         g.center_lng,
//         g.radius_meters,
//         g.owner,
//         g.description,
//         g.geofence_location,
//         g.status,
//         g.created_by,
//         g.created_at,
//         g.updated_by,
//         g.updated_at,
//         t.tag_name,
//         cu.first_name, cu.last_name, cu.email
//       ORDER BY g.created_at DESC
//       `,
//       Number(custId)
//     );
//     if (!geofences || geofences.length === 0) {
//       return sendErrorResponse(
//         res,
//         "No geofences found for this customer",
//         404
//       );
//     }
//     const result = geofences.map((g: any) => {
//       let polygon = null;
//       try {
//         if (g.polygon) {
//           polygon = JSON.parse(g.polygon); // keep as GeoJSON
//         }
//       } catch (e) {
//         console.error("Polygon parse error:", e);
//       }
//       return {
//         id: g.geofence_account_id,
//         geofence_name: g.geofence_name,
//         geofence_shape: g.shape_type,
//         center_lat: g.center_lat,
//         center_lng: g.center_lng,
//         radius_meters: g.radius_meters,
//         polygon,
//         owner: g.owner,
//         description: g.description,
//         geofence_location: g.geofence_location,
//         status: g.status,
//         created_by: g.created_by,
//         created_by_user: g.created_by_user,
//         updated_by: g.updated_by,
//         updated_by_user: g.updated_by_user,
//         tag_name: g.tag_name || null,
//         accounts: g.accounts || [],
//         created_at: g.created_at,
//         updated_at: g.updated_at,
//       };
//     });
//     return sendSuccessResponse(
//       res,
//       result,
//       "Geofences fetched successfully by customer ID"
//     );
//   } catch (error) {
//     console.error("Error fetching geofences by customer_id:", error);
//     return sendErrorResponse(res, "Failed to fetch geofences");
//   }
// };
const getGeofenceByCustIdCtrl = async (req, res) => {
    try {
        const { custId } = req.params;
        const { page, perPage, skip, take } = (0, pagination_1.getPagination)(req.query);
        if (!custId || isNaN(Number(custId))) {
            return (0, responseUtils_1.sendErrorResponse)(res, "Valid customer ID is required");
        }
        // ------------------------
        // 1. Count total first
        // ------------------------
        const totalResult = await database_config_1.default.$queryRawUnsafe(`
      SELECT COUNT(*)::int AS total
      FROM geofence_account g
      WHERE g.customer_id = $1
        AND g.is_deleted = false
      `, Number(custId));
        const total = totalResult[0]?.total || 0;
        // ------------------------
        // 2. Fetch paginated records
        // ------------------------
        // const geofences = await prisma.$queryRawUnsafe<any[]>(
        //   `
        //   SELECT
        //     g.geofence_account_id,
        //     g.geofence_name,
        //     g.shape_type,
        //     ST_AsGeoJSON(g.polygon::geometry) AS polygon,
        //     g.center_lat,
        //     g.center_lng,
        //     g.radius_meters,
        //     g.owner,
        //     g.description,
        //     g.geofence_location,
        //     g.status,
        //     g.created_by,
        //     g.created_at,
        //     g.updated_by,
        //     g.updated_at,
        //     t.tag_name,
        //     json_build_object(
        //       'first_name', cu.first_name,
        //       'last_name', cu.last_name,
        //       'email', cu.email
        //     ) AS created_by_user,
        //     COALESCE(
        //       json_agg(
        //         DISTINCT jsonb_build_object(
        //           'account_id', a.account_id,
        //           'account_name', a.account_name,
        //           'account_number', a.account_number
        //         )
        //       ) FILTER (WHERE a.account_id IS NOT NULL),
        //       '[]'
        //     ) AS accounts
        //   FROM geofence_account g
        //   LEFT JOIN tag_lookup t
        //     ON g.tag_lookup_id = t.tag_lookup_id
        //   LEFT JOIN account a
        //     ON a.account_id = ANY(
        //       SELECT jsonb_array_elements_text(g.account_ids)::int
        //     )
        //   LEFT JOIN "user" cu
        //     ON g.created_by = cu.user_id
        //   WHERE g.customer_id = $1
        //     AND g.is_deleted = false
        //   GROUP BY
        //     g.geofence_account_id,
        //     g.geofence_name,
        //     g.shape_type,
        //     g.polygon,
        //     g.center_lat,
        //     g.center_lng,
        //     g.radius_meters,
        //     g.owner,
        //     g.description,
        //     g.geofence_location,
        //     g.status,
        //     g.created_by,
        //     g.created_at,
        //     g.updated_by,
        //     g.updated_at,
        //     t.tag_name,
        //     cu.first_name, cu.last_name, cu.email
        //   ORDER BY g.created_at DESC
        //   LIMIT $2 OFFSET $3
        //   `,
        //   Number(custId),
        //   take,
        //   skip
        // );
        const geofences = await database_config_1.default.$queryRawUnsafe(`
  SELECT 
    g.geofence_account_id,
    g.geofence_name,
    g.shape_type,
    ST_AsGeoJSON(g.polygon::geometry) AS polygon,
    g.center_lat,
    g.center_lng,
    g.radius_meters,
    g.owner,
    g.description,
    g.geofence_location,
    g.status,
    g.created_by,
    g.created_at,
    g.updated_by,
    g.updated_at,
    t.tag_name,
    e.event_master_id,
    e.event_name,
    e.event_type,
    e.metric_value,
    e.operation_type,
    json_build_object(
      'first_name', cu.first_name,
      'last_name', cu.last_name,
      'email', cu.email
    ) AS created_by_user,
    COALESCE(
      json_agg(
        DISTINCT jsonb_build_object(
          'account_id', a.account_id,
          'account_name', a.account_name,
          'account_number', a.account_number
        )
      ) FILTER (WHERE a.account_id IS NOT NULL),
      '[]'
    ) AS accounts
  FROM geofence_account g
  LEFT JOIN tag_lookup t 
    ON g.tag_lookup_id = t.tag_lookup_id
  LEFT JOIN event_master e
    ON g.event_master_id = e.event_master_id
  LEFT JOIN account a
    ON a.account_id = ANY(
      SELECT jsonb_array_elements_text(g.account_ids)::int
    )
  LEFT JOIN "user" cu 
    ON g.created_by = cu.user_id
  WHERE g.customer_id = $1 
    AND g.is_deleted = false
  GROUP BY 
    g.geofence_account_id,
    g.geofence_name,
    g.shape_type,
    g.polygon,
    g.center_lat,
    g.center_lng,
    g.radius_meters,
    g.owner,
    g.description,
    g.geofence_location,
    g.status,
    g.created_by,
    g.created_at,
    g.updated_by,
    g.updated_at,
    t.tag_name,
    cu.first_name, cu.last_name, cu.email,
    e.event_master_id, e.event_name, e.event_type, e.metric_value, e.operation_type
  ORDER BY g.created_at DESC
  LIMIT $2 OFFSET $3
`, Number(custId), take, skip);
        if (!geofences || geofences.length === 0) {
            return (0, responseUtils_1.sendErrorResponse)(res, "No geofences found for this customer", 404);
        }
        // ------------------------
        // 3. Transform results
        // ------------------------
        const result = geofences.map((g) => {
            let polygon = null;
            try {
                if (g.polygon) {
                    polygon = JSON.parse(g.polygon); // keep as GeoJSON
                }
            }
            catch (e) {
                console.error("Polygon parse error:", e);
            }
            return {
                id: g.geofence_account_id,
                geofence_name: g.geofence_name,
                geofence_shape: g.shape_type,
                center_lat: g.center_lat,
                center_lng: g.center_lng,
                radius_meters: g.radius_meters,
                polygon,
                owner: g.owner,
                description: g.description,
                geofence_location: g.geofence_location,
                status: g.status,
                created_by: g.created_by,
                created_by_user: g.created_by_user,
                updated_by: g.updated_by,
                updated_by_user: g.updated_by_user,
                tag_name: g.tag_name || null,
                event_master_id: g.event_master_id || null,
                event_name: g.event_name || null,
                event_type: g.event_type || null,
                event_metric_value: g.metric_value || null,
                event_operation_type: g.operation_type || null,
                accounts: g.accounts || [],
                created_at: g.created_at,
                updated_at: g.updated_at,
            };
        });
        // ------------------------
        // 4. Send Paginated Response
        // ------------------------
        return (0, responseUtils_1.sendPaginatedResponse)(res, result, total, page, perPage, 200);
    }
    catch (error) {
        console.error("Error fetching geofences by customer_id:", error);
        return (0, responseUtils_1.sendErrorResponse)(res, "Failed to fetch geofences");
    }
};
exports.getGeofenceByCustIdCtrl = getGeofenceByCustIdCtrl;
// TOGGLE GEOFENCE STATUS
const toggleGeofenceStatus = async (req, res) => {
    try {
        const { geofence_account_id } = req.params;
        // Fetch only status (avoids geometry issue)
        const geofence = await database_config_1.default.geofence_account.findUnique({
            where: { geofence_account_id: Number(geofence_account_id) },
            select: { status: true },
        });
        if (!geofence) {
            return res.status(404).json({ message: "Geofence not found" });
        }
        const newStatus = geofence.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
        await database_config_1.default.$executeRaw `
      UPDATE geofence_account
      SET status = ${newStatus}
      WHERE geofence_account_id = ${Number(geofence_account_id)}
    `;
        return (0, responseUtils_1.sendSuccessResponse)(res, newStatus, "Status updated successfully");
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error toggling status" });
    }
};
exports.toggleGeofenceStatus = toggleGeofenceStatus;
// CHECK EQUIPMENT IN GEOFENCE
const checkEquipmentInGeofenceCtrl = async (req, res) => {
    try {
        const { accountId } = req.params;
        if (!accountId || isNaN(Number(accountId))) {
            return (0, responseUtils_1.sendErrorResponse)(res, "Valid account ID is required");
        }
        // 1. Fetch all geofence polygons associated with this account from geofence_account table
        const geofences = await database_config_1.default.$queryRawUnsafe(`
     SELECT
    geofence_account_id,
    ST_AsGeoJSON(polygon) as polygon_geojson
  FROM geofence_account g,
    LATERAL jsonb_array_elements_text(g.account_ids) AS aid
  WHERE 
    aid::int = $1
    AND g.is_deleted = false
    AND g.status = 'ACTIVE'
    `, Number(accountId));
        if (!geofences || geofences.length === 0) {
            return (0, responseUtils_1.sendSuccessResponse)(res, [], "No active geofences found for this account");
        }
        // 2. Fetch distinct equipment IDs linked to this account via equipment_assignment and equipment_type_allocation
        const equipmentList = await database_config_1.default.$queryRawUnsafe(`
      SELECT DISTINCT e.equipment_id
      FROM equipment e
      INNER JOIN equipment_assignment ea ON e.equipment_id = ea.equipment_id
      INNER JOIN equipment_type_allocation eta ON eta.equipment_type_allocation_id = ea.equipment_type_allocation_id
      WHERE eta.account_id = $1
        AND e.is_deleted = false
    `, Number(accountId));
        if (!equipmentList || equipmentList.length === 0) {
            return (0, responseUtils_1.sendSuccessResponse)(res, [], "No equipment found for this account");
        }
        const equipmentIds = equipmentList.map((e) => e.equipment_id);
        console.log(equipmentIds);
        // 3. Fetch latest GPS locations for these equipments
        const gpsLocations = await database_config_1.default.current_equipment_gps_location.findMany({
            where: {
                equipment_id: {
                    in: equipmentIds,
                },
            },
            orderBy: {
                last_gps_update: "desc",
            },
        });
        console.log(gpsLocations);
        // 4. Check if each GPS point is inside any geofence using ST_Contains, log entry event for matches
        const entryEvents = [];
        for (const gps of gpsLocations) {
            if (!gps.latitude || !gps.longitude)
                continue;
            for (const geofence of geofences) {
                // Query to check if GPS point is inside polygon
                const isInsideResult = await database_config_1.default.$queryRawUnsafe(`
          SELECT ST_Contains(
            ST_SetSRID(ST_GeomFromGeoJSON($1), 4326),
            ST_SetSRID(ST_Point($2, $3), 4326)
          ) AS st_contains
        `, geofence.polygon_geojson, Number(gps.longitude), Number(gps.latitude));
                if (isInsideResult?.[0]?.st_contains) {
                    // Record entry event (you may want to check if already logged for this event)
                    await database_config_1.default.$executeRawUnsafe(`
            INSERT INTO equipment_geofence_event (equipment_id, account_id, event_type, latitude, longitude, event_time)
            VALUES ($1, $2, 'entry', $3, $4, NOW())
          `, gps.equipment_id, Number(accountId), Number(gps.latitude), Number(gps.longitude));
                    entryEvents.push({
                        equipment_id: gps.equipment_id,
                        account_id: Number(accountId),
                        latitude: gps.latitude,
                        longitude: gps.longitude,
                        event_type: "entry",
                        event_time: new Date(),
                    });
                    break; // No need to check other geofences if one matched
                }
            }
        }
        return (0, responseUtils_1.sendSuccessResponse)(res, entryEvents, "Checked equipment locations against geofences");
    }
    catch (error) {
        console.error("Error in checkEquipmentInGeofenceCtrl:", error);
        return (0, responseUtils_1.sendErrorResponse)(res, "Failed to check equipment geofence status");
    }
};
exports.checkEquipmentInGeofenceCtrl = checkEquipmentInGeofenceCtrl;
const checkPointInGeofenceCtrl = async (req, res) => {
    try {
        const { latitude, longitude } = req.body;
        if (typeof latitude !== "number" ||
            typeof longitude !== "number" ||
            latitude < -90 ||
            latitude > 90 ||
            longitude < -180 ||
            longitude > 180) {
            return (0, responseUtils_1.sendErrorResponse)(res, "Valid latitude and longitude are required");
        }
        const geofenceId = 19; // Hardcoded as per your request
        const result = await database_config_1.default.$queryRawUnsafe(`
      SELECT ST_Contains(
        polygon,
        ST_SetSRID(ST_MakePoint($1, $2), 4326)
      ) AS is_inside
      FROM geofence_account
      WHERE geofence_account_id = $3
        AND is_deleted = false
        AND status = 'ACTIVE'
    `, longitude, latitude, geofenceId);
        const isInside = result?.[0]?.is_inside ?? false;
        return (0, responseUtils_1.sendSuccessResponse)(res, {
            geofence_account_id: geofenceId,
            latitude,
            longitude,
            inside_geofence: isInside,
        }, isInside
            ? "Point is inside the geofence"
            : "Point is outside the geofence");
    }
    catch (error) {
        console.error("Error checking point in geofence:", error);
        return (0, responseUtils_1.sendErrorResponse)(res, "Failed to check point in geofence");
    }
};
exports.checkPointInGeofenceCtrl = checkPointInGeofenceCtrl;
const updateEquipmentLocationAndEventCreation = async (req, res) => {
    try {
        const { lat, lng, equipment_id, location, motion_status, updated_by, created_by, } = req.body;
        if (lat == null || lng == null || !equipment_id) {
            return res
                .status(400)
                .json({ error: "Missing required fields: lat, lng, equipment_id" });
        }
        // Upsert current equipment location (update if exists, else create)
        await database_config_1.default.current_equipment_gps_location.upsert({
            where: { equipment_id },
            update: {
                latitude: lat,
                longitude: lng,
                location: location || null,
                motion_status: motion_status || null,
                last_gps_update: new Date(),
                updated_at: new Date(),
                updated_by: updated_by || null,
            },
            create: {
                equipment_id,
                latitude: lat,
                longitude: lng,
                location: location || null,
                motion_status: motion_status || null,
                last_gps_update: new Date(),
                created_at: new Date(),
                created_by: created_by || null,
            },
        });
        // Insert new GPS location history record
        await database_config_1.default.equipment_gps_location.create({
            data: {
                equipment_has_iot_device_id: equipment_id,
                current_equipment_gps_location_id: equipment_id, // Assuming this links to equipment_id — adjust if different
                latitude: lat,
                longitude: lng,
                location: location || null,
                motion_status: motion_status || null,
                last_gps_update: new Date(),
                created_at: new Date(),
                created_by: created_by || null,
            },
        });
        ///inserting event
        const equipment = await database_config_1.default.equipment.findUnique({
            where: { equipment_id },
            select: {
                geofence_account_id: true,
            },
        });
        if (!equipment) {
            return res.status(400).json({ error: "Invalid equipment_id provided" });
        }
        // const geofenceAccountIds: number[] = equipment.geofence_account_id ?? [];
        const geofenceAccountIds = equipment.geofence_account_id ?? [];
        if (!geofenceAccountIds.length) {
            return res.json({
                message: "No geofences for this equipment",
                events: [],
            });
        }
        // const geofences = await prisma.$queryRaw<{
        //   geofence_account_id: number;
        //   polygon_wkt: string;
        //   account_ids: any;
        // }>`
        //         SELECT geofence_account_id, ST_AsText(polygon) AS polygon_wkt, account_ids
        //         FROM geofence_account
        //         WHERE geofence_account_id = ANY(${geofenceAccountIds})
        //         AND status = 'ACTIVE'
        //         AND is_deleted = false
        //       `;
        const geofences = await database_config_1.default.$queryRaw `
  SELECT 
    geofence_account_id, 
    shape_type,
    ST_AsText(polygon) AS polygon_wkt, 
    center_lat, 
    center_lng, 
    radius_meters,
    account_ids
  FROM geofence_account
  WHERE geofence_account_id = ANY(${geofenceAccountIds})
    AND status = 'ACTIVE'
    AND is_deleted = false
`;
        const eventResults = [];
        for (const geofence of geofences) {
            let isInside = false;
            if (geofence.shape_type === "Polygon" && geofence.polygon_wkt) {
                // Check point in polygon
                const result = await database_config_1.default.$queryRaw `
      SELECT ST_Contains(
        ST_GeomFromText(${geofence.polygon_wkt}, 4326),
        ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)
      ) AS inside
    `;
                isInside = result[0]?.inside === true;
            }
            else if (geofence.shape_type === "Circle" &&
                geofence.center_lat !== null &&
                geofence.center_lng !== null &&
                geofence.radius_meters !== null) {
                // Check point in circle: use ST_DWithin on geography type for meters distance
                const result = await database_config_1.default.$queryRaw `
      SELECT ST_DWithin(
        geography(ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)),
        geography(ST_SetSRID(ST_MakePoint(${geofence.center_lng}, ${geofence.center_lat}), 4326)),
        ${geofence.radius_meters}
      ) AS inside
    `;
                isInside = result[0]?.inside === true;
            }
            else {
                // Unsupported or missing shape_type or data
                continue;
            }
            const event_type = isInside ? "entry" : "exit";
            await database_config_1.default.equipment_geofence_event.create({
                data: {
                    equipment_id,
                    account_id: 12, // supply dynamically if needed
                    geofence_account_id: geofence.geofence_account_id,
                    event_type,
                    latitude: lat,
                    longitude: lng,
                    event_time: new Date(),
                },
            });
            eventResults.push({
                geofence_account_id: geofence.geofence_account_id,
                event_type,
            });
        }
        return res.json({
            message: "Geofence events processed",
            events: eventResults,
        });
    }
    catch (error) {
        console.error("Error updating equipment location:", error);
        return (0, responseUtils_1.sendErrorResponse)(res, "Failed");
    }
};
exports.updateEquipmentLocationAndEventCreation = updateEquipmentLocationAndEventCreation;
const checkLocationAndInsertGeofenceEvent = async (req, res) => {
    try {
        const { equipment_id, lat, lng } = req.body;
        if (equipment_id == null || lat == null || lng == null) {
            return res
                .status(400)
                .json({ error: "Missing required fields: equipment_id, lat, lng" });
        }
        const equipment = await database_config_1.default.equipment.findUnique({
            where: { equipment_id },
            select: {
                geofence_account_id: true,
            },
        });
        if (!equipment) {
            return res.status(400).json({ error: "Invalid equipment_id provided" });
        }
        const geofenceAccountIds = equipment.geofence_account_id ?? [];
        if (!geofenceAccountIds.length) {
            return res.json({
                message: "No geofences for this equipment",
                events: [],
            });
        }
        const geofences = await database_config_1.default.$queryRaw `
  SELECT 
    geofence_account_id, 
    shape_type,
    ST_AsText(polygon) AS polygon_wkt, 
    center_lat, 
    center_lng, 
    radius_meters,
    account_ids
  FROM geofence_account
  WHERE geofence_account_id = ANY(${geofenceAccountIds})
    AND status = 'ACTIVE'
    AND is_deleted = false
`;
        const eventResults = [];
        for (const geofence of geofences) {
            if (!geofence.polygon_wkt)
                continue;
            // Run raw query to check inside polygon using WKT polygon string
            const result = await database_config_1.default.$queryRaw `
    SELECT ST_Contains(
      ST_GeomFromText(${geofence.polygon_wkt}, 4326),
      ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)
    ) AS inside
  `;
            const isInside = result[0]?.inside === true;
            const event_type = isInside ? "entry" : "exit";
            await database_config_1.default.equipment_geofence_event.create({
                data: {
                    equipment_id,
                    account_id: 12, // You should dynamically assign this based on your logic
                    geofence_account_id: geofence.geofence_account_id,
                    event_type,
                    latitude: lat,
                    longitude: lng,
                    event_time: new Date(),
                },
            });
            eventResults.push({
                geofence_account_id: geofence.geofence_account_id,
                event_type,
            });
        }
        return res.json({
            message: "Geofence events processed",
            events: eventResults,
        });
    }
    catch (error) {
        console.error("Error checking geofence event:", error);
        return res.status(500).json({ error: "Failed to process geofence event" });
    }
};
exports.checkLocationAndInsertGeofenceEvent = checkLocationAndInsertGeofenceEvent;
///find the counts of a customer id
const getGeofenceCountsCtrl = async (req, res) => {
    try {
        const { custId } = req.params;
        const customer_id = Number(custId);
        if (!custId || isNaN(customer_id)) {
            return (0, responseUtils_1.sendErrorResponse)(res, "Invalid or missing customer_id");
        }
        // ===============find the geofence counts===============//
        // Count total geofences for this customer_id (not deleted)
        const AllGeoFences = await database_config_1.default.geofence_account.count({
            where: {
                customer_id,
                is_deleted: false,
            },
        });
        // Count active geofences for this customer_id (status 'ACTIVE' and not deleted)
        const geoFenceActive = await database_config_1.default.geofence_account.count({
            where: {
                customer_id,
                status: "ACTIVE",
                is_deleted: false,
            },
        });
        // Count inactive geofences for this customer_id (status not 'ACTIVE' and not deleted)
        const geoFenceInActive = await database_config_1.default.geofence_account.count({
            where: {
                customer_id,
                status: {
                    not: "ACTIVE",
                },
                is_deleted: false,
            },
        });
        // ===============find the geofence counts===============//
        // Step 1: Get all account_ids from geofence_accounts by customer_id
        const accounts = await database_config_1.default.geofence_account.findMany({
            where: { customer_id },
            select: { account_ids: true },
        });
        // Flatten unique account_ids
        const accountIdSet = new Set();
        for (const account of accounts) {
            if (account.account_ids) {
                let parsed;
                try {
                    parsed = JSON.parse(account.account_ids);
                }
                catch {
                    // malformed JSON, ignore this entry
                    continue;
                }
                // If parsed is an array, iterate normally
                if (Array.isArray(parsed)) {
                    parsed.forEach((id) => {
                        if (typeof id === "number") {
                            accountIdSet.add(id);
                        }
                    });
                }
                // If parsed is a single number, add directly
                else if (typeof parsed === "number") {
                    accountIdSet.add(parsed);
                }
                // If parsed is a string number, convert and add
                else if (typeof parsed === "string" && !isNaN(Number(parsed))) {
                    accountIdSet.add(Number(parsed));
                }
                // Otherwise ignore non-iterable or unexpected types
            }
        }
        const accountIdsArray = Array.from(accountIdSet);
        if (accountIdsArray.length === 0) {
            return (0, responseUtils_1.sendSuccessResponse)(res, { active: 0, inactive: 0, total: 0 }, "No geofences found");
        }
        // Step 2: Get equipment_type_allocations by account_ids with equipment assignments
        const equipmentTypeAllocations = await database_config_1.default.equipment_type_allocation.findMany({
            where: { account_id: { in: accountIdsArray } },
            select: {
                equipment_assignment: { select: { equipment_id: true } },
            },
        });
        // Extract unique equipment_ids
        const equipmentIdSet = new Set();
        equipmentTypeAllocations.forEach((allocation) => {
            allocation.equipment_assignment.forEach((assignment) => {
                equipmentIdSet.add(assignment.equipment_id);
            });
        });
        const equipmentIdsArray = Array.from(equipmentIdSet);
        console.log(equipmentIdsArray);
        if (equipmentIdsArray.length === 0) {
            return (0, responseUtils_1.sendSuccessResponse)(res, { active: 0, inactive: 0, total: 0 }, "No equipment found");
        }
        // Step 3: Count geofence_accounts by status for customer_id and equipment_ids
        return (0, responseUtils_1.sendSuccessResponse)(res, { geoFenceActive, geoFenceInActive, AllGeoFences }, "Geofence counts retrieved successfully");
        return (0, responseUtils_1.sendSuccessResponse)(res, "Geofence counts retrieved successfully");
    }
    catch (error) {
        console.error("Failed to get geofence counts", error);
        return (0, responseUtils_1.sendErrorResponse)(res, "Failed to get geofence counts");
    }
};
exports.getGeofenceCountsCtrl = getGeofenceCountsCtrl;
