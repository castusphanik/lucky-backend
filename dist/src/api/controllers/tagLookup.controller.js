"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateTagLookup = exports.getTagLookupById = exports.fetchTagLookups = exports.createTagLookup = void 0;
const database_config_1 = __importDefault(require("../../config/database.config")); // adjust path as needed
// import { sendSuccessResponse, sendErrorResponse } from "../utils/responseUtils";
const pagination_1 = require("../../utils/pagination");
const responseUtils_1 = require("../../utils/responseUtils");
// CREATE
const createTagLookup = async (req, res) => {
    try {
        const { tag_name, status, updated_by } = req.body;
        if (!tag_name || typeof tag_name !== "string") {
            return (0, responseUtils_1.sendErrorResponse)(res, "Invalid or missing tag_name", 400);
        }
        const newTag = await database_config_1.default.tag_lookup.create({
            data: {
                tag_name,
                status: status || "ACTIVE",
                // updated_by: updated_by || null,
            },
            select: {
                tag_lookup_id: true,
                tag_name: true,
                status: true,
                created_at: true,
            },
        });
        return (0, responseUtils_1.sendSuccessResponse)(res, newTag);
    }
    catch (error) {
        console.error("createTagLookup error:", error);
        if (error.code === "P2002") {
            // Prisma unique constraint error
            return (0, responseUtils_1.sendErrorResponse)(res, "Tag name already exists", 400);
        }
        return (0, responseUtils_1.sendErrorResponse)(res, "Internal server error");
    }
};
exports.createTagLookup = createTagLookup;
// GET ALL (with filters + pagination)
const fetchTagLookups = async (req, res) => {
    try {
        const { page, perPage, skip, take } = (0, pagination_1.getPagination)(req.query);
        const { tag_name, status, updated_by } = req.query;
        const filters = {
            ...(tag_name && {
                tag_name: { contains: String(tag_name), mode: "insensitive" },
            }),
            ...(status && {
                status: { contains: String(status), mode: "insensitive" },
            }),
            ...(updated_by && {
                updated_by: { contains: String(updated_by), mode: "insensitive" },
            }),
        };
        const total = await database_config_1.default.tag_lookup.count({ where: filters });
        const data = await database_config_1.default.tag_lookup.findMany({
            skip,
            take,
            where: filters,
            orderBy: { tag_lookup_id: "asc" },
            select: {
                tag_lookup_id: true,
                tag_name: true,
                status: true,
                created_at: true,
                // updated_at: true,
                // updated_by: true,
            },
        });
        return (0, responseUtils_1.sendPaginatedResponse)(res, data, total, page, perPage);
    }
    catch (err) {
        console.error("fetchTagLookups error:", err);
        return (0, responseUtils_1.sendErrorResponse)(res, "Internal server error");
    }
};
exports.fetchTagLookups = fetchTagLookups;
// GET BY ID
const getTagLookupById = async (req, res) => {
    try {
        const id = Number(req.params.id);
        if (isNaN(id)) {
            return (0, responseUtils_1.sendErrorResponse)(res, "Invalid ID", 400);
        }
        const tag = await database_config_1.default.tag_lookup.findUnique({
            where: { tag_lookup_id: id },
            select: {
                tag_lookup_id: true,
                tag_name: true,
                status: true,
                created_at: true,
                // updated_at: true,
                // updated_by: true,
            },
        });
        if (!tag) {
            return (0, responseUtils_1.sendErrorResponse)(res, "Tag not found", 404);
        }
        return (0, responseUtils_1.sendSuccessResponse)(res, tag);
    }
    catch (err) {
        console.error("getTagLookupById error:", err);
        return (0, responseUtils_1.sendErrorResponse)(res, "Internal server error");
    }
};
exports.getTagLookupById = getTagLookupById;
// UPDATE
const updateTagLookup = async (req, res) => {
    try {
        const id = Number(req.params.id);
        if (isNaN(id)) {
            return (0, responseUtils_1.sendErrorResponse)(res, "Invalid ID", 400);
        }
        const { tag_name, status, updated_by } = req.body;
        const updatedTag = await database_config_1.default.tag_lookup.update({
            where: { tag_lookup_id: id },
            data: {
                ...(tag_name && { tag_name }),
                ...(status && { status }),
                // updated_at: new Date(),
                // ...(updated_by && { updated_by }),
            },
            select: {
                tag_lookup_id: true,
                tag_name: true,
                status: true,
                created_at: true,
                // updated_at: true,
                // updated_by: true,
            },
        });
        return (0, responseUtils_1.sendSuccessResponse)(res, updatedTag);
    }
    catch (error) {
        console.error("updateTagLookup error:", error);
        if (error.code === "P2002") {
            return (0, responseUtils_1.sendErrorResponse)(res, "Tag name already exists", 400);
        }
        return (0, responseUtils_1.sendErrorResponse)(res, "Internal server error");
    }
};
exports.updateTagLookup = updateTagLookup;
// DELETE
// export const deleteTagLookup = async (
//   req: Request,
//   res: Response
// ): Promise<Response> => {
//   try {
//     const id = Number(req.params.id);
//     if (isNaN(id)) {
//       return sendErrorResponse(res, "Invalid ID", 400);
//     }
//     await prisma.tag_lookup.delete({
//       where: { tag_lookup_id: id },
//     });
//     return sendSuccessResponse(res, { message: "Tag deleted successfully" });
//   } catch (err) {
//     console.error("deleteTagLookup error:", err);
//     return sendErrorResponse(res, "Internal server error");
//   }
// };
