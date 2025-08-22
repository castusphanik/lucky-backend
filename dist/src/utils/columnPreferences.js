"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDefaultColumns = exports.buildPrismaSelect = exports.getUserColumnPreferences = void 0;
const database_config_1 = __importDefault(require("../config/database.config")); // Adjust path as needed
// Get user's saved column preferences for a particular table
const getUserColumnPreferences = async (userId, tableName) => {
    const pref = await database_config_1.default.user_column_preferences.findUnique({
        where: {
            user_id_table_name: {
                user_id: userId,
                table_name: tableName,
            },
        },
        select: { selected_columns: true },
    });
    return pref ? pref.selected_columns : null;
};
exports.getUserColumnPreferences = getUserColumnPreferences;
// Build Prisma select object dynamically based on column names
const buildPrismaSelect = (columns) => {
    const select = {};
    for (const col of columns) {
        if (col.includes(".")) {
            // Handle relation (e.g., "user_role_ref.name")
            const [relation, field] = col.split(".");
            if (!select[relation])
                select[relation] = { select: {} };
            select[relation].select[field] = true;
        }
        else {
            select[col] = true;
        }
    }
    return select;
};
exports.buildPrismaSelect = buildPrismaSelect;
// Default columns for your tables
const getDefaultColumns = (tableName) => {
    if (tableName === "users") {
        return [
            "user_id",
            "first_name",
            // "last_name",
            // "email",
            // "status",
            // "user_role_ref.name",
        ];
    }
    // Add any other tables here
    return [];
};
exports.getDefaultColumns = getDefaultColumns;
