import { Request, Response } from "express"
import prisma from "../../config/database.config" // adjust path as needed
// import { sendSuccessResponse, sendErrorResponse } from "../utils/responseUtils";
import { getPagination, getPaginationMeta } from "../../utils/pagination"
import {
  sendErrorResponse,
  sendPaginatedResponse,
  sendSuccessResponse,
} from "../../utils/responseUtils"

// CREATE
export const createTagLookup = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const { tag_name, status, updated_by } = req.body

    if (!tag_name || typeof tag_name !== "string") {
      return sendErrorResponse(res, "Invalid or missing tag_name", 400)
    }

    const newTag = await prisma.tag_lookup.create({
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
    })

    return sendSuccessResponse(res, newTag)
  } catch (error: any) {
    console.error("createTagLookup error:", error)
    if (error.code === "P2002") {
      // Prisma unique constraint error
      return sendErrorResponse(res, "Tag name already exists", 400)
    }
    return sendErrorResponse(res, "Internal server error")
  }
}

// GET ALL (with filters + pagination)
export const fetchTagLookups = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const { page, perPage, skip, take } = getPagination(req.query)
    const { tag_name, status, updated_by } = req.query

    const filters: any = {
      ...(tag_name && {
        tag_name: { contains: String(tag_name), mode: "insensitive" },
      }),
      ...(status && {
        status: { contains: String(status), mode: "insensitive" },
      }),
      ...(updated_by && {
        updated_by: { contains: String(updated_by), mode: "insensitive" },
      }),
    }

    const total = await prisma.tag_lookup.count({ where: filters })

    const data = await prisma.tag_lookup.findMany({
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
    })

    return sendPaginatedResponse(res, data, total, page, perPage)
  } catch (err) {
    console.error("fetchTagLookups error:", err)
    return sendErrorResponse(res, "Internal server error")
  }
}

// GET BY ID
export const getTagLookupById = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const id = Number(req.params.id)
    if (isNaN(id)) {
      return sendErrorResponse(res, "Invalid ID", 400)
    }

    const tag = await prisma.tag_lookup.findUnique({
      where: { tag_lookup_id: id },
      select: {
        tag_lookup_id: true,
        tag_name: true,
        status: true,
        created_at: true,
        // updated_at: true,
        // updated_by: true,
      },
    })

    if (!tag) {
      return sendErrorResponse(res, "Tag not found", 404)
    }

    return sendSuccessResponse(res, tag)
  } catch (err) {
    console.error("getTagLookupById error:", err)
    return sendErrorResponse(res, "Internal server error")
  }
}

// UPDATE
export const updateTagLookup = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const id = Number(req.params.id)
    if (isNaN(id)) {
      return sendErrorResponse(res, "Invalid ID", 400)
    }

    const { tag_name, status, updated_by } = req.body

    const updatedTag = await prisma.tag_lookup.update({
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
    })

    return sendSuccessResponse(res, updatedTag)
  } catch (error: any) {
    console.error("updateTagLookup error:", error)
    if (error.code === "P2002") {
      return sendErrorResponse(res, "Tag name already exists", 400)
    }
    return sendErrorResponse(res, "Internal server error")
  }
}

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
