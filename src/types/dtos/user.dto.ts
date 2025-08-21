export interface UserListQueryDTO {
  page: number
  perPage: number
  first_name?: string
  last_name?: string
  email?: string
  phone_number?: string
  designation?: string
  status?: string
  user_role_id?: number
  customer_id?: number
}

export interface UserListItemDTO {
  user_id: number
  customer_id: number | null
  first_name: string | null
  last_name: string | null
  email: string | null
  phone_number: string | null
  designation: string | null
  avatar: string | null
  status: string | null
  is_customer_user: boolean
  first_active: Date | null
  last_active: Date | null
  created_at: Date
  created_by: number | null
  updated_at: Date | null
  updated_by: number | null
  assigned_account_ids: number[]
  user_role_ref: {
    user_role_id: number
    name: string
    description: string | null
  } | null
}

// export interface CurrentUserDTO {
//   user_id: number
//   first_name: string | null
//   last_name: string | null
//   email: string | null
//   phone_number: string | null
//   auth_0_reference_id: string | null
//   avatar: string | null
//   designation: string | null
//   status: string
//   is_customer_user: boolean
//   created_at: Date
//   assigned_account_ids?: number[]
//   user_role_ref: {
//     name: string
//     user_role_id: number
//   } | null
// }

export interface CurrentUserDTO {
  user_id: number
  first_name: string | null
  last_name: string | null
  email: string | null
  phone_number: string | null
  auth_0_reference_id: string
  avatar: string | null
  designation: string | null
  status: string
  is_customer_user: boolean
  created_at: Date
  assigned_account_ids: number[]
  user_role_ref: {
    name: string
    user_role_id: number
  } | null
  customer_ref: {
    customer_id: number
    customer_name: string
    reference_number: string

    _count: {
      accounts: number
      user: number
    }
  } | null
  country_lookup_ref: {
    country_code: string
    country_name: string | null
  } | null
}

export interface CreateUserDTO {
  first_name: string
  last_name: string
  email: string
  phone_number?: string
  designation?: string
  avatar?: string
  status: "ACTIVE" | "INACTIVE"
  is_customer_user: boolean
  user_role_id: number
  customer_id: number
  password: string
  assigned_account_ids?: number[]
}

export interface UpdateUserDTO {
  first_name?: string
  last_name?: string
  email?: string
  phone_number?: string
  designation?: string
  avatar?: string
  status?: "ACTIVE" | "INACTIVE"
  is_customer_user?: boolean
  user_role_id?: number
  customer_id?: number
  password?: string
  assigned_account_ids?: number[]
}

export interface DeleteUserDTO {
  user_id: number
}

export interface UserMinimalDTO {
  user_id: number
  first_name: string | null
  last_name: string | null
  email: string | null
  status: string | null
  is_customer_user: boolean
  assigned_account_ids: number[]

  user_role_ref: {
    name: string
    user_role_id: number
  } | null
}

export interface ExtendedUserMinimalDTO extends UserMinimalDTO {
  customer: {
    customer_name: string | null
    reference_number: string | null
    total_accounts: number
  }
}
export interface UserFilterDTO {
  accountIds: string | "all"
  first_name?: string
  last_name?: string
  email?: string
  status?: string
  is_customer_user?: string | boolean
  user_role_id?: string | number
  page?: number | string
  perPage?: number | string
  customer_name?: string
  reference_number?: string
  customer_account?: string
  // Date range filters for first_active and last_active
  first_active_from?: string | Date
  first_active_to?: string | Date
  last_active_from?: string | Date
  last_active_to?: string | Date
}

// dtos/customer.dto.ts
export interface CustomerDTO {
  customer_id: number
  customer_name: string
  customer_class: string
  reference_number: string
}

// dtos/account.dto.t
export interface AccountDTO {
  account_id: number
  parent_account_id: number | null
  account_name: string
  account_number: string
  legacy_account_number: string
  account_type: string
  account_manager_id: number | null
  number_of_users: number
  status: string
  created_at: Date
  updated_at: Date
}

export interface UserCustomerAccountsResponseDTO {
  customer: CustomerDTO | null
  accounts: AccountDTO[]
}

export interface CustomerListDTO {
  customer_id: number
  customer_name: string
  customer_class: string
  status: string | null
  reference_number: string | null
  sold_by_salesperson_id: number | null
  is_deleted: boolean
  deleted_by: number | null
  deleted_at: Date | null
  created_at: Date
  created_by: number | null
  updated_at: Date | null
  updated_by: number | null
}

export interface CustomerFilters {
  customer_name?: string
  status?: string
  reference_number?: string
  sold_by_salesperson_id?: number
  created_by?: number
}

// user.dto.ts
export interface GetUsersByCustomerIdQueryDTO {
  customer_id: number
  first_name?: string
  last_name?: string
  email?: string
  phone_number?: string
  designation?: string
  status?: string
  user_role_id?: number
  is_customer_user?: boolean
}

export interface UserColumnPreferenceResponseDto {
  user_id: number
  table_name: string
  selected_columns: string[]
  created_at: Date
  updated_at: Date
}

export interface CreateUserColumnPreferenceDto {
  user_id: number
  table_name: string
  selected_columns: string[]
}

export interface UserColumnPreferenceResponseDto {
  id: string
  user_id: number
  table_name: string
  selected_columns: string[]
  created_at: Date
  updated_at: Date
}

export interface UsersFilterQuery {
  page?: string | number
  perPage?: string | number
  first_name?: string
  last_name?: string
  email?: string
  phone_number?: string
  designation?: string
  status?: string
  user_role_id?: string | number
  customer_id?: string | number
}

export interface CustomerUsersByAccountFilterQuery {
  page?: string | number
  perPage?: string | number
  accountIds: string
  first_name?: string
  last_name?: string
  email?: string
  status?: string
  is_customer_user?: string | boolean
  user_role_id?: string | number
}

export interface CustomersFilterQuery {
  page?: string | number
  perPage?: string | number
  customer_name?: string
  status?: string
  reference_number?: string
  sold_by_salesperson_id?: string | number
  created_by?: string | number
}
