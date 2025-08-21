import { Request, Response } from "express";
import prisma from "../../config/database.config";

import {
  sendSuccessResponse,
  sendErrorResponse,
  PaginatedResponse,
} from "../../utils/responseUtils";
// import EventMaster from "../models/event.master.model";

// import { sendSuccessResponse, sendErrorResponse } from "../utils/responseUtils";
import { getPagination, getPaginationMeta } from "../../utils/pagination";

// POST - Create Event Master
export const createEventMaster = async (
  req: Request,
  res: Response
): Promise<Response> => {
  try {
    const { event_name, event_type, metric_value, operation_type } = req.body;

    // Basic validation
    if (!event_name || typeof event_name !== "string") {
      return sendErrorResponse(res, "Invalid or missing event_name", 400);
    }
    if (!event_type || typeof event_type !== "string") {
      return sendErrorResponse(res, "Invalid or missing event_type", 400);
    }
    if (metric_value !== undefined && typeof metric_value !== "number") {
      return sendErrorResponse(res, "metric_value must be a number", 400);
    }
    // if (!operation_type || typeof operation_type !== "string") {
    //   return sendErrorResponse(res, "Invalid or missing operation_type", 400);
    // }

    // Create new event_master record
    const newEvent = await prisma.event_master.create({
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

    return sendSuccessResponse(res, newEvent, "Event created successfully");
  } catch (error: any) {
    console.error("createEventMaster error:", error);
    if (error.code === "P2002") {
      return sendErrorResponse(res, "Duplicate event found", 400);
    }
    return sendErrorResponse(res, "Internal server error");
  }
};

export const getAllEventMasters = async (req: Request, res: Response) => {
  try {
    const events = await prisma.event_master.findMany({
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
    return sendSuccessResponse(res, events, "Event fetched successfully");
  } catch (error: any) {
    console.error("❌ Error fetching event masters:", error); // log full object

    return res.status(500).json({
      success: false,
      message: "Failed to fetch event masters",
      error: error.message || error, // show message if present
    });
  }
};
