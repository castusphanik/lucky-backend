export interface PaginationQuery {
  page?: number | string
  perPage?: number | string
}

export interface AccountsFilterQuery extends PaginationQuery {
  account_name?: string
  account_number?: string
  legacy_account_number?: string
  account_type?: string
  account_manager_id?: number | string
  account_id?: number | string
  status?: string
  country_lookup_id?: number | string
  number_of_users?: number | string
  is_deleted?: boolean | string
}

export interface SecondaryContactsFilterQuery extends PaginationQuery {
  first_name?: string
  last_name?: string
  email?: string
  designation?: string
  status?: string
  phone_number?: string
}
