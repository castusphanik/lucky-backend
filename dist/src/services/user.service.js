"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserService = void 0;
const database_config_1 = __importDefault(require("../config/database.config"));
const pagination_1 = require("../utils/pagination");
const excelUtils_1 = require("../utils/excelUtils");
class UserService {
    constructor() {
        this.fetchCustomersService = async (filters, skip, take) => {
            const where = {
                is_deleted: false,
                ...(filters.customer_name && {
                    customer_name: { contains: filters.customer_name, mode: "insensitive" },
                }),
                ...(filters.reference_number && {
                    reference_number: {
                        contains: filters.reference_number,
                        mode: "insensitive",
                    },
                }),
                ...(filters.status && {
                    status: { contains: filters.status, mode: "insensitive" },
                }),
                ...(filters.sold_by_salesperson_id && {
                    sold_by_salesperson_id: filters.sold_by_salesperson_id,
                }),
                ...(filters.created_by && { created_by: filters.created_by }),
            };
            const total = await database_config_1.default.customer.count({ where });
            const customers = await database_config_1.default.customer.findMany({
                skip,
                take,
                where,
                orderBy: { customer_id: "asc" },
                select: {
                    customer_id: true,
                    customer_name: true,
                    customer_class: true,
                    status: true,
                    reference_number: true,
                    sold_by_salesperson_id: true,
                    is_deleted: true,
                    deleted_by: true,
                    deleted_at: true,
                    created_at: true,
                    created_by: true,
                    updated_at: true,
                    updated_by: true,
                },
            });
            //  Map Prisma → DTO
            const customerDTOs = customers.map((c) => ({
                customer_id: c.customer_id,
                customer_name: c.customer_name,
                customer_class: c.customer_class,
                status: c.status ?? null,
                reference_number: c.reference_number ?? null,
                sold_by_salesperson_id: c.sold_by_salesperson_id ?? null,
                is_deleted: c.is_deleted,
                deleted_by: c.deleted_by ?? null,
                deleted_at: c.deleted_at ?? null,
                created_at: c.created_at,
                created_by: c.created_by ?? null,
                updated_at: c.updated_at ?? null,
                updated_by: c.updated_by ?? null,
            }));
            return { customers: customerDTOs, total };
        };
        this.getAllUsersByCustomerIdService = async (filters, skip, take) => {
            const where = {
                customer_id: filters.customer_id,
                ...(filters.first_name && {
                    first_name: { contains: filters.first_name, mode: "insensitive" },
                }),
                ...(filters.last_name && {
                    last_name: { contains: filters.last_name, mode: "insensitive" },
                }),
                ...(filters.email && {
                    email: { contains: filters.email, mode: "insensitive" },
                }),
                ...(filters.phone_number && {
                    phone_number: { contains: filters.phone_number, mode: "insensitive" },
                }),
                ...(filters.designation && {
                    designation: { contains: filters.designation, mode: "insensitive" },
                }),
                ...(filters.status && { status: { equals: filters.status } }),
                ...(filters.user_role_id && { user_role_id: filters.user_role_id }),
                ...(typeof filters.is_customer_user !== "undefined" && {
                    is_customer_user: filters.is_customer_user,
                }),
            };
            const totalUsers = await database_config_1.default.user.count({ where });
            const users = await database_config_1.default.user.findMany({
                where,
                skip,
                take,
                orderBy: { user_id: "asc" },
                select: {
                    user_id: true,
                    customer_id: true,
                    first_name: true,
                    last_name: true,
                    email: true,
                    phone_number: true,
                    designation: true,
                    avatar: true,
                    status: true,
                    is_customer_user: true,
                    first_active: true,
                    last_active: true,
                    created_at: true,
                    created_by: true,
                    updated_at: true,
                    updated_by: true,
                    user_role_ref: {
                        select: {
                            user_role_id: true,
                            name: true,
                        },
                    },
                },
            });
            return { users, totalUsers };
        };
    }
    async getAllTenantUsers(query, skip, take) {
        const { first_name, last_name, email, phone_number, designation, status, user_role_id, customer_id, } = query;
        const filters = {
            is_customer_user: false,
            ...(first_name && {
                first_name: { contains: first_name, mode: "insensitive" },
            }),
            ...(last_name && {
                last_name: { contains: last_name, mode: "insensitive" },
            }),
            ...(email && { email: { contains: email, mode: "insensitive" } }),
            ...(phone_number && {
                phone_number: { contains: phone_number, mode: "insensitive" },
            }),
            ...(designation && {
                designation: { contains: designation, mode: "insensitive" },
            }),
            ...(status && { status }),
            ...(user_role_id && { user_role_id }),
            ...(customer_id && { customer_id }),
        };
        const total = await database_config_1.default.user.count({ where: filters });
        const users = await database_config_1.default.user.findMany({
            where: filters,
            skip,
            take,
            orderBy: { user_id: "asc" },
            select: {
                user_id: true,
                customer_id: true,
                first_name: true,
                last_name: true,
                email: true,
                phone_number: true,
                designation: true,
                avatar: true,
                status: true,
                is_customer_user: true,
                first_active: true,
                last_active: true,
                created_at: true,
                created_by: true,
                updated_at: true,
                updated_by: true,
                assigned_account_ids: true,
                user_role_ref: {
                    select: {
                        user_role_id: true,
                        name: true,
                        description: true,
                    },
                },
            },
        });
        return { users, total };
    }
    async getCurrentUser(userId) {
        const user = await database_config_1.default.user.findUnique({
            where: { user_id: userId },
            select: {
                user_id: true,
                first_name: true,
                last_name: true,
                email: true,
                phone_number: true,
                auth_0_reference_id: true,
                avatar: true,
                designation: true,
                status: true,
                is_customer_user: true,
                created_at: true,
                assigned_account_ids: true,
                user_role_ref: {
                    select: {
                        name: true,
                        user_role_id: true,
                    },
                },
                customer_ref: {
                    select: {
                        customer_name: true,
                        reference_number: true,
                        _count: {
                            select: {
                                accounts: true,
                                user: true, // Employee count
                            },
                        },
                    },
                },
                country_lookup_ref: {
                    select: {
                        country_code: true,
                        country_name: true,
                    },
                },
            },
        });
        return user;
    }
    async fetchCustomerUsersByAccountAssignment(userId, query) {
        const { page, perPage, skip, take } = (0, pagination_1.getPagination)(query);
        // Resolve account IDs
        let accountIdArray = [];
        if (query.accountIds === "all") {
            const user = await database_config_1.default.user.findUnique({
                where: { user_id: userId },
                select: { assigned_account_ids: true },
            });
            if (!user || !user.assigned_account_ids.length) {
                return { data: [], total: 0, page, perPage };
            }
            accountIdArray = user.assigned_account_ids;
        }
        else {
            accountIdArray = String(query.accountIds)
                .split(",")
                .map((id) => Number(id.trim()))
                .filter((id) => !isNaN(id) && id > 0);
        }
        // Build filters including new customer-related filters
        // Build base filters
        const baseFilters = {
            assigned_account_ids: { hasSome: accountIdArray },
            ...(query.first_name && {
                first_name: { contains: String(query.first_name), mode: "insensitive" },
            }),
            ...(query.last_name && {
                last_name: { contains: String(query.last_name), mode: "insensitive" },
            }),
            ...(query.email && {
                email: { contains: String(query.email), mode: "insensitive" },
            }),
            ...(query.status && {
                status: { equals: String(query.status), mode: "insensitive" },
            }),
            ...(query.user_role_id && { user_role_id: Number(query.user_role_id) }),
            ...(typeof query.is_customer_user !== "undefined" && {
                is_customer_user: String(query.is_customer_user).toLowerCase() === "true",
            }),
        };
        // Build date filters
        const dateFilters = {};
        if (query.first_active_from || query.first_active_to) {
            dateFilters.first_active = {
                ...(query.first_active_from && {
                    gte: new Date(query.first_active_from),
                }),
                ...(query.first_active_to && { lte: new Date(query.first_active_to) }),
            };
        }
        if (query.last_active_from || query.last_active_to) {
            dateFilters.last_active = {
                ...(query.last_active_from && {
                    gte: new Date(query.last_active_from),
                }),
                ...(query.last_active_to && { lte: new Date(query.last_active_to) }),
            };
        }
        // Build customer filters
        const customerFilters = {};
        if (query.customer_name ||
            query.reference_number ||
            query.customer_account) {
            customerFilters.customer_ref = {
                ...(query.customer_name && {
                    customer_name: {
                        contains: String(query.customer_name),
                        mode: "insensitive",
                    },
                }),
                ...(query.reference_number && {
                    reference_number: {
                        contains: String(query.reference_number),
                        mode: "insensitive",
                    },
                }),
                ...(query.customer_account && {
                    OR: [
                        {
                            customer_name: {
                                contains: String(query.customer_account),
                                mode: "insensitive",
                            },
                        },
                        {
                            reference_number: {
                                contains: String(query.customer_account),
                                mode: "insensitive",
                            },
                        },
                    ],
                }),
            };
        }
        // Combine all filters
        const filters = {
            ...baseFilters,
            ...dateFilters,
            ...customerFilters,
        };
        // Fetch total + paginated users
        const total = await database_config_1.default.user.count({ where: filters });
        const users = await database_config_1.default.user.findMany({
            skip,
            take,
            where: filters,
            orderBy: { user_id: "asc" },
            select: {
                user_id: true,
                first_name: true,
                last_name: true,
                email: true,
                status: true,
                is_customer_user: true,
                assigned_account_ids: true,
                first_active: true,
                last_active: true,
                user_role_ref: {
                    select: { name: true, user_role_id: true },
                },
                customer_ref: {
                    select: {
                        customer_name: true,
                        reference_number: true,
                        _count: {
                            select: { accounts: true },
                        },
                    },
                },
            },
        });
        // Transform the data
        const data = users.map((user) => ({
            user_id: user.user_id,
            first_name: user.first_name,
            last_name: user.last_name,
            email: user.email,
            status: user.status,
            is_customer_user: user.is_customer_user,
            assigned_account_ids: user.assigned_account_ids,
            first_active: user.first_active,
            last_active: user.last_active,
            user_role_ref: user.user_role_ref,
            customer: {
                customer_name: user.customer_ref?.customer_name || null,
                reference_number: user.customer_ref?.reference_number || null,
                total_accounts: user.customer_ref?._count?.accounts || 0,
            },
        }));
        return { data, total, page, perPage };
    }
    async fetchCustomerDetailsAndAccountsByUserId(userId) {
        const user = await database_config_1.default.user.findUnique({
            where: { user_id: userId },
            select: {
                user_id: true,
                first_name: true,
                last_name: true,
                email: true,
                customer_id: true,
                assigned_account_ids: true,
            },
        });
        if (!user) {
            return { customer: null, accounts: [] };
        }
        let customer = null;
        if (user.customer_id) {
            customer = await database_config_1.default.customer.findUnique({
                where: { customer_id: user.customer_id },
                select: {
                    customer_id: true,
                    customer_name: true,
                    customer_class: true,
                    reference_number: true,
                },
            });
        }
        if (!customer || !user.assigned_account_ids?.length) {
            return { customer, accounts: [] };
        }
        const accounts = await database_config_1.default.account.findMany({
            where: {
                account_id: { in: user.assigned_account_ids },
                is_deleted: false,
            },
            orderBy: { account_id: "asc" },
            select: {
                account_id: true,
                parent_account_id: true,
                account_name: true,
                account_number: true,
                legacy_account_number: true,
                account_type: true,
                account_manager_id: true,
                number_of_users: true,
                status: true,
                created_at: true,
                updated_at: true,
            },
        });
        //  Map accounts to DTO shape, replacing nulls
        const mappedAccounts = accounts.map((a) => ({
            account_id: a.account_id,
            parent_account_id: a.parent_account_id,
            account_name: a.account_name ?? "",
            account_number: a.account_number ?? "",
            legacy_account_number: a.legacy_account_number ?? "",
            account_type: a.account_type,
            account_manager_id: a.account_manager_id,
            number_of_users: a.number_of_users ?? 0,
            status: a.status ?? "INACTIVE",
            created_at: a.created_at,
            updated_at: a.updated_at ?? new Date(),
        }));
        return { customer, accounts: mappedAccounts };
    }
    async createOrUpdatePreference(data) {
        const preference = await database_config_1.default.user_column_preferences.upsert({
            where: {
                user_id_table_name: {
                    user_id: data.user_id,
                    table_name: data.table_name,
                },
            },
            update: {
                selected_columns: data.selected_columns,
            },
            create: {
                user_id: data.user_id,
                table_name: data.table_name,
                selected_columns: data.selected_columns,
            },
            select: {
                user_id: true,
                table_name: true,
                selected_columns: true,
                created_at: true,
                updated_at: true,
            },
        });
        return preference;
    }
    async getPreferenceByUserAndTable(user_id, table_name) {
        const preference = await database_config_1.default.user_column_preferences.findFirst({
            where: {
                AND: [{ user_id: user_id }, { table_name: table_name }],
            },
            select: {
                user_id: true,
                table_name: true,
                selected_columns: true,
                created_at: true,
                updated_at: true,
            },
        });
        return preference;
    }
    // Add this interface for type safety
    async downloadAllTenantUsers(query) {
        const { page, perPage, skip, take } = (0, pagination_1.getPagination)(query);
        const whereClause = {
            is_customer_user: false,
            ...(query.first_name && {
                first_name: { contains: String(query.first_name), mode: "insensitive" },
            }),
            ...(query.last_name && {
                last_name: { contains: String(query.last_name), mode: "insensitive" },
            }),
            ...(query.email && {
                email: { contains: String(query.email), mode: "insensitive" },
            }),
            ...(query.phone_number && {
                phone_number: {
                    contains: String(query.phone_number),
                    mode: "insensitive",
                },
            }),
            ...(query.designation && {
                designation: {
                    contains: String(query.designation),
                    mode: "insensitive",
                },
            }),
            ...(query.status && {
                status: { equals: String(query.status), mode: "insensitive" },
            }),
            ...(query.user_role_id && { user_role_id: Number(query.user_role_id) }),
            ...(query.customer_id && { customer_id: Number(query.customer_id) }),
        };
        const totalUsers = await database_config_1.default.user.count({ where: whereClause });
        const users = await database_config_1.default.user.findMany({
            where: whereClause,
            skip,
            take,
            orderBy: { user_id: "asc" },
            select: {
                user_id: true,
                customer_id: true,
                first_name: true,
                last_name: true,
                email: true,
                phone_number: true,
                designation: true,
                avatar: true,
                status: true,
                is_customer_user: true,
                first_active: true,
                last_active: true,
                created_at: true,
                created_by: true,
                updated_at: true,
                updated_by: true,
                assigned_account_ids: true,
                user_role_ref: {
                    select: {
                        user_role_id: true,
                        name: true,
                        description: true,
                    },
                },
            },
        });
        const columns = [
            { header: "S.No", key: "sno", width: 8 },
            { header: "User ID", key: "user_id", width: 12 },
            { header: "First Name", key: "first_name", width: 20 },
            { header: "Last Name", key: "last_name", width: 20 },
            { header: "Email", key: "email", width: 30 },
            { header: "Phone Number", key: "phone_number", width: 18 },
            { header: "Designation", key: "designation", width: 20 },
            { header: "Status", key: "status", width: 12 },
            { header: "User Role", key: "user_role", width: 18 },
            {
                header: "Is Customer User",
                key: "is_customer_user",
                width: 15,
                formatter: excelUtils_1.formatters.boolean,
            },
        ];
        const formattedData = users.map((user, index) => ({
            sno: excelUtils_1.formatters.serialNumber(index, skip),
            user_id: user.user_id,
            first_name: user.first_name || "",
            last_name: user.last_name || "",
            email: user.email || "",
            phone_number: user.phone_number || "",
            designation: user.designation || "",
            status: user.status || "",
            user_role: user.user_role_ref?.name || "",
            is_customer_user: user.is_customer_user,
        }));
        const timestamp = new Date()
            .toISOString()
            .replace(/[:.]/g, "-")
            .slice(0, -5);
        const totalPages = Math.ceil(totalUsers / perPage);
        const filename = `tenant_users_page_${page}_of_${totalPages}_${timestamp}.xlsx`;
        const exporter = new excelUtils_1.ExcelExporter();
        await exporter.generateWorkbook({
            sheetName: "Tenant Users",
            title: `All Tenant Users Export`,
            subtitle: (0, excelUtils_1.createPaginationSubtitle)(page, perPage, skip, totalUsers),
            columns: columns,
            data: formattedData,
            filename,
        });
        const buffer = await exporter.writeToBuffer();
        return { buffer, filename };
    }
    // Add this interface for type safety
    async downloadCustomerUsersByAccountAssignment(userId, query) {
        const { skip, take, page, perPage } = (0, pagination_1.getPagination)(query);
        let accountIdArray = [];
        if (query.accountIds === "all") {
            // Get assigned accounts from the user
            const user = await database_config_1.default.user.findUnique({
                where: { user_id: userId },
                select: { assigned_account_ids: true },
            });
            if (!user)
                throw new Error("USER_NOT_FOUND");
            if (!user.assigned_account_ids.length)
                throw new Error("NO_ASSIGNED_ACCOUNTS");
            accountIdArray = user.assigned_account_ids;
        }
        else if (typeof query.accountIds === "string") {
            accountIdArray = query.accountIds
                .split(",")
                .map((id) => Number(id.trim()))
                .filter((id) => !isNaN(id) && id > 0);
            if (!accountIdArray.length)
                throw new Error("INVALID_ACCOUNT_IDS");
        }
        else {
            throw new Error("MISSING_ACCOUNT_IDS");
        }
        const whereClause = {
            assigned_account_ids: { hasSome: accountIdArray },
            ...(query.first_name && {
                first_name: { contains: String(query.first_name), mode: "insensitive" },
            }),
            ...(query.last_name && {
                last_name: { contains: String(query.last_name), mode: "insensitive" },
            }),
            ...(query.email && {
                email: { contains: String(query.email), mode: "insensitive" },
            }),
            ...(query.status && {
                status: { equals: String(query.status), mode: "insensitive" },
            }),
            ...(query.user_role_id && { user_role_id: Number(query.user_role_id) }),
            ...(typeof query.is_customer_user !== "undefined" && {
                is_customer_user: String(query.is_customer_user).toLowerCase() === "true",
            }),
        };
        const totalUsers = await database_config_1.default.user.count({ where: whereClause });
        const users = await database_config_1.default.user.findMany({
            where: whereClause,
            skip,
            take,
            orderBy: { user_id: "asc" },
            select: {
                user_id: true,
                first_name: true,
                last_name: true,
                email: true,
                status: true,
                is_customer_user: true,
                user_role_ref: { select: { name: true } },
                assigned_account_ids: true,
            },
        });
        const columns = [
            { header: "S.No", key: "sno", width: 8 },
            { header: "User ID", key: "user_id", width: 12 },
            { header: "First Name", key: "first_name", width: 20 },
            { header: "Last Name", key: "last_name", width: 20 },
            { header: "Email", key: "email", width: 30 },
            { header: "Status", key: "status", width: 12 },
            { header: "User Role", key: "user_role", width: 18 },
            {
                header: "Is Customer User",
                key: "is_customer_user",
                width: 15,
                formatter: excelUtils_1.formatters.boolean,
            },
            {
                header: "Assigned Account IDs",
                key: "assigned_account_ids",
                width: 20,
            },
        ];
        const formattedData = users.map((user, index) => ({
            sno: excelUtils_1.formatters.serialNumber(index, skip),
            user_id: user.user_id,
            first_name: user.first_name || "",
            last_name: user.last_name || "",
            email: user.email || "",
            status: user.status || "",
            user_role: user.user_role_ref?.name || "",
            is_customer_user: user.is_customer_user,
            assigned_account_ids: user.assigned_account_ids?.join(",") || "",
        }));
        const timestamp = new Date()
            .toISOString()
            .replace(/[:.]/g, "-")
            .slice(0, -5);
        const totalPages = Math.max(1, Math.ceil(totalUsers / (perPage ? Number(perPage) : 1)));
        const filename = `customer_users_by_account_assignment_${page}_of_${totalPages}_${timestamp}.xlsx`;
        const exporter = new excelUtils_1.ExcelExporter();
        await exporter.generateWorkbook({
            sheetName: "Users",
            title: `Customer Users by Account Assignment`,
            subtitle: (0, excelUtils_1.createPaginationSubtitle)(page, perPage, skip, totalUsers),
            columns: columns,
            data: formattedData,
            filename,
        });
        const buffer = await exporter.writeToBuffer();
        return { buffer, filename };
    }
    async downloadCustomers(query) {
        const { page, perPage, skip, take } = (0, pagination_1.getPagination)(query);
        const whereClause = {
            is_deleted: false,
            ...(query.customer_name && {
                customer_name: {
                    contains: String(query.customer_name),
                    mode: "insensitive",
                },
            }),
            ...(query.reference_number && {
                reference_number: {
                    contains: String(query.reference_number),
                    mode: "insensitive",
                },
            }),
            ...(query.status && {
                status: { contains: String(query.status), mode: "insensitive" },
            }),
            ...(query.sold_by_salesperson_id && {
                sold_by_salesperson_id: Number(query.sold_by_salesperson_id),
            }),
            ...(query.created_by && { created_by: Number(query.created_by) }),
        };
        const totalCustomers = await database_config_1.default.customer.count({ where: whereClause });
        const customers = await database_config_1.default.customer.findMany({
            skip,
            take,
            where: whereClause,
            orderBy: { customer_id: "asc" },
            select: {
                customer_id: true,
                customer_name: true,
                customer_class: true,
                status: true,
                reference_number: true,
                sold_by_salesperson_id: true,
                is_deleted: true,
                deleted_by: true,
                deleted_at: true,
                created_at: true,
                created_by: true,
                updated_at: true,
                updated_by: true,
            },
        });
        const columns = [
            { header: "S.No", key: "sno", width: 8 },
            { header: "Customer ID", key: "customer_id", width: 12 },
            { header: "Customer Name", key: "customer_name", width: 28 },
            { header: "Customer Class", key: "customer_class", width: 15 },
            { header: "Status", key: "status", width: 12 },
            { header: "Reference Number", key: "reference_number", width: 18 },
            { header: "Salesperson ID", key: "sold_by_salesperson_id", width: 14 },
            {
                header: "Created At",
                key: "created_at",
                width: 20,
                formatter: excelUtils_1.formatters.date,
            },
            { header: "Created By", key: "created_by", width: 12 },
            {
                header: "Updated At",
                key: "updated_at",
                width: 20,
                formatter: excelUtils_1.formatters.date,
            },
            { header: "Updated By", key: "updated_by", width: 12 },
        ];
        const formattedData = customers.map((cust, index) => ({
            sno: excelUtils_1.formatters.serialNumber(index, skip),
            customer_id: cust.customer_id,
            customer_name: cust.customer_name || "",
            customer_class: cust.customer_class || "",
            status: cust.status || "",
            reference_number: cust.reference_number || "",
            sold_by_salesperson_id: cust.sold_by_salesperson_id || "",
            created_at: cust.created_at || "",
            created_by: cust.created_by || "",
            updated_at: cust.updated_at || "",
            updated_by: cust.updated_by || "",
        }));
        const timestamp = new Date()
            .toISOString()
            .replace(/[:.]/g, "-")
            .slice(0, -5);
        const totalPages = Math.max(1, Math.ceil(totalCustomers / (perPage ? Number(perPage) : 1)));
        const filename = `customers_page_${page}_of_${totalPages}_${timestamp}.xlsx`;
        const exporter = new excelUtils_1.ExcelExporter();
        await exporter.generateWorkbook({
            sheetName: "Customers",
            title: `Customers Export`,
            subtitle: (0, excelUtils_1.createPaginationSubtitle)(page, perPage, skip, totalCustomers),
            columns: columns,
            data: formattedData,
            filename,
        });
        const buffer = await exporter.writeToBuffer();
        return { buffer, filename };
    }
    /// not using
    async getUserPreferences(user_id) {
        const preferences = await database_config_1.default.user_column_preferences.findMany({
            where: { user_id },
            select: {
                user_id: true,
                table_name: true,
                selected_columns: true,
                created_at: true,
                updated_at: true,
            },
        });
        return preferences;
    }
    // not using
    async deleteUserPreference(user_id, table_name) {
        try {
            await database_config_1.default.user_column_preferences.delete({
                where: {
                    user_id_table_name: { user_id, table_name },
                },
            });
            return true;
        }
        catch (error) {
            return false;
        }
    }
    // not using
    async getAllTablePreferences(table_name) {
        const preferences = await database_config_1.default.user_column_preferences.findMany({
            where: { table_name },
            select: {
                user_id: true,
                table_name: true,
                selected_columns: true,
                created_at: true,
                updated_at: true,
            },
        });
        return preferences;
    }
}
exports.UserService = UserService;
