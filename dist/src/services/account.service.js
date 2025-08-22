"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AccountService = void 0;
const database_config_1 = __importDefault(require("../config/database.config"));
const exceljs_1 = __importDefault(require("exceljs"));
const pagination_1 = require("../utils/pagination");
const excelUtils_1 = require("../utils/excelUtils");
class AccountService {
    // Helpers
    toBool(val, fallback = false) {
        if (typeof val === "boolean")
            return val;
        if (typeof val === "string")
            return val.toLowerCase() === "true";
        return fallback;
    }
    // 1) Fetch accounts of a customer (paginated)
    async fetchAccountsOfCustomer(customerId, query) {
        const { page, perPage, skip, take } = (0, pagination_1.getPagination)(query);
        const filters = {
            customer_id: customerId,
            is_deleted: false,
            ...(query.account_name && {
                account_name: {
                    contains: String(query.account_name),
                    mode: "insensitive",
                },
            }),
            ...(query.account_number && {
                account_number: {
                    contains: String(query.account_number),
                    mode: "insensitive",
                },
            }),
            ...(query.legacy_account_number && {
                legacy_account_number: {
                    contains: String(query.legacy_account_number),
                    mode: "insensitive",
                },
            }),
            ...(query.account_type && { account_type: String(query.account_type) }),
            ...(query.account_manager_id && {
                account_manager_id: Number(query.account_manager_id),
            }),
            ...(query.status && {
                status: { contains: String(query.status), mode: "insensitive" },
            }),
            ...(query.country_lookup_id && {
                country_lookup_id: Number(query.country_lookup_id),
            }),
        };
        const total = await database_config_1.default.account.count({ where: filters });
        const accounts = await database_config_1.default.account.findMany({
            skip,
            take,
            where: filters,
            orderBy: { account_id: "asc" },
            select: {
                account_id: true,
                parent_account_id: true,
                customer_id: true,
                account_name: true,
                account_number: true,
                legacy_account_number: true,
                account_type: true,
                account_manager_id: true,
                number_of_users: true,
                status: true,
                country_lookup_id: true,
                created_at: true,
                created_by: true,
                updated_at: true,
                updated_by: true,
                country_lookup_ref: { select: { country_name: true } },
                customer: { select: { customer_name: true } },
            },
        });
        return { data: accounts, total, page, perPage };
    }
    // 2) Get accounts by userId (paginated)
    // async getAccountsByUserId(userId: number, query: AccountsFilterQuery) {
    //   const { page, perPage, skip, take } = getPagination(query)
    //   const rawUser = await prisma.user.findFirst({
    //     where: { user_id: userId },
    //   })
    //   console.log(rawUser, "rawUser--")
    //   function mapToUserAssignedDTO(dbResult: any): UserAssignedDTO {
    //     return {
    //       user_id: dbResult.user_id,
    //       assigned_account_ids: dbResult.assigned_account_ids as number[],
    //       customer_id: dbResult.customer_id, // or wherever customer_id lives
    //     }
    //   }
    //   console.log(mapToUserAssignedDTO, "mapToUserAssignedDTO--")
    //   const user: UserAssignedDTO | null = rawUser
    //     ? mapToUserAssignedDTO(rawUser)
    //     : null
    //   if (!user) return { data: [], total: 0, page, perPage }
    //   const assigned = user.assigned_account_ids ?? []
    //   if (assigned.length === 0) return { data: [], total: 0, page, perPage }
    //   const filters: any = {
    //     account_id: { in: assigned },
    //     ...(user.customer_id && { customer_id: user.customer_id }),
    //     ...(typeof query.is_deleted !== "undefined"
    //       ? { is_deleted: this.toBool(query.is_deleted) }
    //       : { is_deleted: false }),
    //     ...(query.account_name && {
    //       account_name: {
    //         contains: String(query.account_name),
    //         mode: "insensitive",
    //       },
    //     }),
    //     ...(query.account_number && {
    //       account_number: {
    //         contains: String(query.account_number),
    //         mode: "insensitive",
    //       },
    //     }),
    //     ...(query.legacy_account_number && {
    //       legacy_account_number: {
    //         contains: String(query.legacy_account_number),
    //         mode: "insensitive",
    //       },
    //     }),
    //     ...(query.account_type && { account_type: String(query.account_type) }),
    //     ...(query.status && {
    //       status: { equals: String(query.status), mode: "insensitive" },
    //     }),
    //     ...(query.country_lookup_id && {
    //       country_lookup_id: Number(query.country_lookup_id),
    //     }),
    //     ...(query.account_manager_id && {
    //       account_manager_id: Number(query.account_manager_id),
    //     }),
    //     ...(query.number_of_users && {
    //       number_of_users: Number(query.number_of_users),
    //     }),
    //   }
    //   const total = await prisma.account.count({ where: filters })
    //   const accounts: AccountListItemDTO[] = await prisma.account.findMany({
    //     where: filters,
    //     skip,
    //     take,
    //     orderBy: { account_id: "asc" },
    //     select: {
    //       account_id: true,
    //       parent_account_id: true,
    //       customer_id: true,
    //       account_name: true,
    //       account_number: true,
    //       legacy_account_number: true,
    //       account_type: true,
    //       account_manager_id: true,
    //       number_of_users: true,
    //       status: true,
    //       is_deleted: true,
    //       deleted_by: true,
    //       deleted_at: true,
    //       created_at: true,
    //       created_by: true,
    //       updated_at: true,
    //       updated_by: true,
    //       customer: { select: { customer_name: true } },
    //       country_lookup_ref: { select: { country_name: true } },
    //       country_lookup_id: true,
    //     },
    //   })
    //   return { data: accounts, total, page, perPage }
    // }
    async getAccountsByUserId(userId, query) {
        const { page, perPage, skip, take } = (0, pagination_1.getPagination)(query);
        // Get user and their assigned account IDs
        const user = await database_config_1.default.user.findFirst({
            where: { user_id: userId },
            select: {
                user_id: true,
                customer_id: true,
                assigned_account_ids: true,
            },
        });
        console.log(user, "user with assigned accounts--");
        if (!user)
            return { data: [], total: 0, page, perPage };
        const assignedAccountIds = user.assigned_account_ids ?? [];
        if (assignedAccountIds.length === 0)
            return { data: [], total: 0, page, perPage };
        // Start with base filter - get accounts matching assigned IDs
        const filters = {
            account_id: { in: assignedAccountIds }, // This gets all accounts from assigned_account_ids
            // Default to non-deleted accounts unless specified
            ...(typeof query.is_deleted !== "undefined"
                ? { is_deleted: this.toBool(query.is_deleted) }
                : { is_deleted: false }),
        };
        // Now apply additional filters on top of those accounts
        if (query.account_id) {
            // Still need security check - requested account must be in assigned list
            const requestedAccountId = Number(query.account_id);
            if (assignedAccountIds.includes(requestedAccountId)) {
                filters.account_id = requestedAccountId; // Filter to specific account
            }
            else {
                // Account not assigned to user, return empty
                return { data: [], total: 0, page, perPage };
            }
        }
        if (query.account_name) {
            filters.account_name = {
                contains: String(query.account_name),
                mode: "insensitive",
            };
        }
        if (query.account_number) {
            filters.account_number = {
                contains: String(query.account_number),
                mode: "insensitive",
            };
        }
        if (query.legacy_account_number) {
            filters.legacy_account_number = {
                contains: String(query.legacy_account_number),
                mode: "insensitive",
            };
        }
        if (query.account_type) {
            filters.account_type = String(query.account_type);
        }
        if (query.status) {
            filters.status = { equals: String(query.status), mode: "insensitive" };
        }
        if (query.country_lookup_id) {
            filters.country_lookup_id = Number(query.country_lookup_id);
        }
        if (query.account_manager_id) {
            filters.account_manager_id = Number(query.account_manager_id);
        }
        if (query.number_of_users) {
            filters.number_of_users = Number(query.number_of_users);
        }
        console.log("Final filters:", JSON.stringify(filters, null, 2));
        console.log("Assigned account IDs:", assignedAccountIds);
        // Get total count with filters applied
        const total = await database_config_1.default.account.count({ where: filters });
        // Get paginated results with all filters applied
        const accounts = await database_config_1.default.account.findMany({
            where: filters,
            skip,
            take,
            orderBy: { account_id: "asc" },
            select: {
                account_id: true,
                parent_account_id: true,
                customer_id: true,
                account_name: true,
                account_number: true,
                legacy_account_number: true,
                account_type: true,
                account_manager_id: true,
                number_of_users: true,
                status: true,
                is_deleted: true,
                deleted_by: true,
                deleted_at: true,
                created_at: true,
                created_by: true,
                updated_at: true,
                updated_by: true,
                customer: { select: { customer_name: true } },
                country_lookup_ref: { select: { country_name: true } },
                country_lookup_id: true,
            },
        });
        return { data: accounts, total, page, perPage };
    }
    // 3) Secondary contacts for an account (paginated)
    async getSecondaryContacts(accountId, query) {
        const { page, perPage, skip, take } = (0, pagination_1.getPagination)(query);
        const whereClause = {
            assigned_account_ids: { has: accountId },
            ...(query.first_name && {
                first_name: { contains: String(query.first_name), mode: "insensitive" },
            }),
            ...(query.last_name && {
                last_name: { contains: String(query.last_name), mode: "insensitive" },
            }),
            ...(query.email && {
                email: { contains: String(query.email), mode: "insensitive" },
            }),
            ...(query.designation && {
                designation: {
                    contains: String(query.designation),
                    mode: "insensitive",
                },
            }),
            ...(query.status && {
                status: { contains: String(query.status), mode: "insensitive" },
            }),
            ...(query.phone_number && {
                phone_number: {
                    contains: String(query.phone_number),
                    mode: "insensitive",
                },
            }),
        };
        const total = await database_config_1.default.user.count({ where: whereClause });
        const users = await database_config_1.default.user.findMany({
            where: whereClause,
            skip,
            take,
            orderBy: [{ user_id: "asc" }],
            select: {
                user_id: true,
                first_name: true,
                last_name: true,
                email: true,
                designation: true,
                status: true,
                phone_number: true,
                avatar: true,
                is_customer_user: true,
            },
        });
        return { data: users, total, page, perPage };
    }
    // 4) Account primary contact + related accounts
    async getAccountPrimaryContactAndRelated(accountId, customerId) {
        const selectedAccount = await database_config_1.default.account.findFirst({
            where: {
                account_id: accountId,
                ...(customerId && { customer_id: customerId }),
                is_deleted: false,
            },
            select: {
                account_id: true,
                parent_account_id: true,
                customer_id: true,
                account_name: true,
                account_number: true,
                legacy_account_number: true,
                account_type: true,
                primary_contact_user_id: true,
                status: true,
            },
        });
        if (!selectedAccount) {
            throw new Error("ACCOUNT_NOT_FOUND");
        }
        let primaryContactUser = null;
        if (selectedAccount.primary_contact_user_id) {
            primaryContactUser = await database_config_1.default.user.findUnique({
                where: { user_id: selectedAccount.primary_contact_user_id },
                select: {
                    user_id: true,
                    first_name: true,
                    last_name: true,
                    email: true,
                    phone_number: true,
                    designation: true,
                    avatar: true,
                    status: true,
                    is_customer_user: true,
                    user_role_ref: { select: { name: true, description: true } },
                },
            });
        }
        let relatedAccounts = [];
        if (selectedAccount.parent_account_id === null) {
            relatedAccounts = await database_config_1.default.account.findMany({
                where: {
                    parent_account_id: selectedAccount.account_id,
                    is_deleted: false,
                },
                select: {
                    account_id: true,
                    account_name: true,
                    account_number: true,
                    legacy_account_number: true,
                    account_type: true,
                    status: true,
                    number_of_users: true,
                },
                orderBy: { account_id: "asc" },
            });
        }
        else {
            const [parentAccount, siblingAccounts] = await Promise.all([
                database_config_1.default.account.findUnique({
                    where: { account_id: selectedAccount.parent_account_id },
                    select: {
                        account_id: true,
                        account_name: true,
                        account_number: true,
                        legacy_account_number: true,
                        account_type: true,
                        status: true,
                        number_of_users: true,
                    },
                }),
                database_config_1.default.account.findMany({
                    where: {
                        parent_account_id: selectedAccount.parent_account_id,
                        account_id: { not: selectedAccount.account_id },
                        is_deleted: false,
                    },
                    select: {
                        account_id: true,
                        account_name: true,
                        account_number: true,
                        legacy_account_number: true,
                        account_type: true,
                        status: true,
                        number_of_users: true,
                    },
                    orderBy: { account_id: "asc" },
                }),
            ]);
            relatedAccounts = [
                ...(parentAccount
                    ? [{ ...parentAccount, relationship: "parent" }]
                    : []),
                ...siblingAccounts.map((a) => ({
                    ...a,
                    relationship: "sibling",
                })),
            ];
        }
        return {
            selectedAccount: {
                account_id: selectedAccount.account_id,
                account_name: selectedAccount.account_name,
                account_number: selectedAccount.account_number,
                account_type: selectedAccount.account_type,
                status: selectedAccount.status,
            },
            primaryContactUser,
            relatedAccounts,
            summary: {
                has_primary_contact: !!primaryContactUser,
                total_related_accounts: relatedAccounts.length,
                account_hierarchy_type: selectedAccount.parent_account_id
                    ? "child"
                    : "parent",
            },
        };
    }
    async getUserAccountsMinimal(userId) {
        const rawUser = await database_config_1.default.user.findFirst({
            where: { user_id: userId },
        });
        function mapToUserAssignedDTO(dbResult) {
            return {
                user_id: dbResult.user_id,
                assigned_account_ids: dbResult.assigned_account_ids, // adjust depending on schema
                customer_id: dbResult.id, // or wherever customer_id lives
            };
        }
        const user = rawUser
            ? mapToUserAssignedDTO(rawUser)
            : null;
        if (!user ||
            !user.assigned_account_ids ||
            user.assigned_account_ids.length === 0)
            return [];
        const accounts = await database_config_1.default.account.findMany({
            where: {
                account_id: { in: user.assigned_account_ids },
                ...(user.customer_id && { customer_id: user.customer_id }),
                is_deleted: false,
            },
            select: { account_id: true, account_name: true, account_number: true },
            orderBy: { account_id: "asc" },
        });
        return accounts;
    }
    // 6) Assigned accounts dropdown for a customer
    async fetchAssignedAccountsDropdown(customerId) {
        const customer = await database_config_1.default.customer.findUnique({
            where: { customer_id: customerId },
            select: { customer_id: true },
        });
        if (!customer)
            throw new Error("CUSTOMER_NOT_FOUND");
        const accounts = await database_config_1.default.account.findMany({
            where: { customer_id: customerId, is_deleted: false },
            orderBy: { account_name: "asc" },
            select: {
                account_id: true,
                account_name: true,
                parent_account_id: true,
                account_number: true,
            },
        });
        return accounts.map((acc) => ({
            account_id: acc.account_id,
            account_name: acc.account_name,
            account_number: acc.account_number,
            is_child: acc.parent_account_id !== null,
            parent_account_id: acc.parent_account_id ?? null,
        }));
    }
    // 7) Download accounts by userId (paginated export) → Buffer + filename
    async downloadAccountsByUserId(userId, query) {
        const { page, perPage, skip, take } = (0, pagination_1.getPagination)(query);
        const rawUser = await database_config_1.default.user.findFirst({
            where: { user_id: userId },
        });
        function mapToUserAssignedDTO(dbResult) {
            return {
                user_id: dbResult.user_id,
                assigned_account_ids: dbResult.assigned_account_ids, // adjust depending on schema
                customer_id: dbResult.id, // or wherever customer_id lives
            };
        }
        const user = rawUser
            ? mapToUserAssignedDTO(rawUser)
            : null;
        if (!user)
            throw new Error("USER_NOT_FOUND");
        if (!user.assigned_account_ids || user.assigned_account_ids.length === 0) {
            const workbook = new exceljs_1.default.Workbook();
            const worksheet = workbook.addWorksheet("User Accounts");
            worksheet.columns = [
                { header: "No Data Available", key: "message", width: 30 },
            ];
            worksheet.addRow({ message: "No accounts assigned to this user" });
            const timestamp = new Date()
                .toISOString()
                .replace(/[:.]/g, "-")
                .slice(0, -5);
            const filename = `user_${userId}_accounts_empty_${timestamp}.xlsx`;
            const buffer = await workbook.xlsx.writeBuffer();
            return { buffer, filename };
        }
        const filters = {
            account_id: { in: user.assigned_account_ids },
            ...(user.customer_id && { customer_id: user.customer_id }),
            ...(typeof query.is_deleted !== "undefined"
                ? { is_deleted: this.toBool(query.is_deleted) }
                : { is_deleted: false }),
            ...(query.account_name && {
                account_name: {
                    contains: String(query.account_name),
                    mode: "insensitive",
                },
            }),
            ...(query.account_number && {
                account_number: {
                    contains: String(query.account_number),
                    mode: "insensitive",
                },
            }),
            ...(query.legacy_account_number && {
                legacy_account_number: {
                    contains: String(query.legacy_account_number),
                    mode: "insensitive",
                },
            }),
            ...(query.account_type && { account_type: String(query.account_type) }),
            ...(query.status && {
                status: { equals: String(query.status), mode: "insensitive" },
            }),
            ...(query.country_lookup_id && {
                country_lookup_id: Number(query.country_lookup_id),
            }),
            ...(query.account_manager_id && {
                account_manager_id: Number(query.account_manager_id),
            }),
            ...(query.number_of_users && {
                number_of_users: Number(query.number_of_users),
            }),
        };
        const totalAccounts = await database_config_1.default.account.count({ where: filters });
        const accounts = await database_config_1.default.account.findMany({
            where: filters,
            skip,
            take,
            orderBy: { account_id: "asc" },
            select: {
                account_id: true,
                parent_account_id: true,
                customer_id: true,
                account_name: true,
                account_number: true,
                legacy_account_number: true,
                account_type: true,
                account_manager_id: true,
                number_of_users: true,
                status: true,
                is_deleted: true,
                deleted_by: true,
                deleted_at: true,
                created_at: true,
                created_by: true,
                updated_at: true,
                updated_by: true,
                customer: { select: { customer_name: true } },
                country_lookup_ref: { select: { country_name: true } },
            },
        });
        const columns = [
            { header: "S.No", key: "sno", width: 8 },
            { header: "Account ID", key: "account_id", width: 12 },
            { header: "Account Name", key: "account_name", width: 25 },
            { header: "Account Number", key: "account_number", width: 18 },
            { header: "Account Type", key: "account_type", width: 15 },
            { header: "Status", key: "status", width: 12 },
            { header: "Customer Name", key: "customer_name", width: 25 },
            { header: "Country", key: "country", width: 15 },
            {
                header: "Is Deleted",
                key: "is_deleted",
                width: 12,
                formatter: excelUtils_1.formatters.boolean,
            },
            {
                header: "Created At",
                key: "created_at",
                width: 20,
                formatter: excelUtils_1.formatters.date,
            },
            {
                header: "Updated At",
                key: "updated_at",
                width: 20,
                formatter: excelUtils_1.formatters.date,
            },
        ];
        const formattedData = accounts.map((a, index) => ({
            sno: excelUtils_1.formatters.serialNumber(index, skip),
            account_id: a.account_id,
            account_name: a.account_name || "N/A",
            account_number: a.account_number || "N/A",
            account_type: a.account_type,
            status: a.status || "N/A",
            customer_name: a.customer?.customer_name || "N/A",
            country: a.country_lookup_ref?.country_name || "N/A",
            is_deleted: a.is_deleted,
            created_at: a.created_at,
            updated_at: a.updated_at,
        }));
        const timestamp = new Date()
            .toISOString()
            .replace(/[:.]/g, "-")
            .slice(0, -5);
        const totalPages = Math.ceil(totalAccounts / perPage);
        const filename = `user_${userId}_accounts_page_${page}_of_${totalPages}_${timestamp}.xlsx`;
        const exporter = new excelUtils_1.ExcelExporter();
        await exporter.generateWorkbook({
            sheetName: "User Accounts",
            title: `User ${userId} - Account Export`,
            subtitle: (0, excelUtils_1.createPaginationSubtitle)(page, perPage, skip, totalAccounts),
            columns: columns,
            data: formattedData,
            filename,
        });
        const buffer = await exporter.writeToBuffer();
        return { buffer, filename };
    }
    // 8) Download secondary contacts for an account (paginated)
    async downloadSecondaryContacts(accountId, query) {
        const { page, perPage, skip } = (0, pagination_1.getPagination)(query);
        const account = await database_config_1.default.account.findUnique({
            where: { account_id: accountId },
            select: { account_id: true, account_name: true },
        });
        if (!account)
            throw new Error("ACCOUNT_NOT_FOUND");
        const whereClause = {
            assigned_account_ids: { has: accountId },
            ...(query.first_name && {
                first_name: { contains: String(query.first_name), mode: "insensitive" },
            }),
            ...(query.last_name && {
                last_name: { contains: String(query.last_name), mode: "insensitive" },
            }),
            ...(query.email && {
                email: { contains: String(query.email), mode: "insensitive" },
            }),
            ...(query.designation && {
                designation: {
                    contains: String(query.designation),
                    mode: "insensitive",
                },
            }),
            ...(query.status && {
                status: { contains: String(query.status), mode: "insensitive" },
            }),
            ...(query.phone_number && {
                phone_number: {
                    contains: String(query.phone_number),
                    mode: "insensitive",
                },
            }),
        };
        const totalUsers = await database_config_1.default.user.count({ where: whereClause });
        const users = await database_config_1.default.user.findMany({
            where: whereClause,
            orderBy: [{ user_id: "asc" }],
            select: {
                user_id: true,
                first_name: true,
                last_name: true,
                email: true,
                designation: true,
                status: true,
                phone_number: true,
                avatar: true,
                is_customer_user: true,
                user_role_ref: { select: { name: true, description: true } },
                customer_ref: { select: { customer_name: true } },
                created_at: true,
                updated_at: true,
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
            {
                header: "Is Customer User",
                key: "is_customer_user",
                width: 15,
                formatter: excelUtils_1.formatters.boolean,
            },
        ];
        const formattedData = users.map((u, index) => ({
            sno: excelUtils_1.formatters.serialNumber(index, skip),
            user_id: u.user_id,
            first_name: u.first_name,
            last_name: u.last_name,
            email: u.email,
            phone_number: u.phone_number,
            designation: u.designation,
            status: u.status,
            is_customer_user: u.is_customer_user,
        }));
        const timestamp = new Date()
            .toISOString()
            .replace(/[:.]/g, "-")
            .slice(0, -5);
        const totalPages = Math.ceil(totalUsers / (perPage || totalUsers || 1));
        const filename = `account_${accountId}_contacts_page_${query.page ?? 1}_of_${totalPages}_${timestamp}.xlsx`;
        const exporter = new excelUtils_1.ExcelExporter();
        await exporter.generateWorkbook({
            sheetName: "Secondary Contacts",
            title: `Account ${accountId} - Secondary Contacts`,
            subtitle: (0, excelUtils_1.createPaginationSubtitle)(Number(query.page ?? 1), Number(query.perPage ?? formattedData.length), skip, totalUsers),
            columns: columns,
            data: formattedData,
            filename,
        });
        const buffer = await exporter.writeToBuffer();
        return { buffer, filename };
    }
}
exports.AccountService = AccountService;
