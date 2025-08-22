"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPagination = getPagination;
exports.getPaginationMeta = getPaginationMeta;
function getPagination(params = {}) {
    const page = Math.max(Number(params.page) || 1, 1);
    const perPage = Math.max(Number(params.perPage) || 20, 1);
    const skip = (page - 1) * perPage;
    const take = perPage;
    return { page, perPage, skip, take };
}
function getPaginationMeta(total, page, perPage) {
    return {
        total,
        page,
        perPage,
        totalPages: Math.ceil(total / perPage),
    };
}
