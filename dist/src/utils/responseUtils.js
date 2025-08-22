"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendPaginatedResponse = sendPaginatedResponse;
exports.sendSuccessResponse = sendSuccessResponse;
exports.sendErrorResponse = sendErrorResponse;
/**
 * Standard success response for paginated results
 */
function sendPaginatedResponse(res, // Express Response type
data, total, page, perPage, statusCode = 200, additionalData = {} // To allow counts,
) {
    const totalPages = Math.ceil(total / perPage);
    const responseBody = {
        statusCode,
        data,
        meta: {
            total,
            page,
            perPage,
            totalPages,
            ...additionalData, // Include any additional data like counts
        },
    };
    return res.status(statusCode).json(responseBody);
}
/**
 * Standard success response for non-paginated results
 */
function sendSuccessResponse(res, // Express Response type
data, message = "Success", statusCode = 200) {
    const responseBody = {
        statusCode,
        data,
        message,
    };
    return res.status(statusCode).json(responseBody);
}
/**
 * Standard error response
 */
function sendErrorResponse(res, errorMsg, statusCode = 500) {
    const responseBody = {
        error: errorMsg,
        statusCode,
    };
    return res.status(statusCode).json(responseBody);
}
