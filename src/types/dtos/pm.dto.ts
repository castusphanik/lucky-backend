export interface PMsByAccountsQuery {
  accountIds: string
  page?: string | number
  perPage?: string | number
  pm_type?: string
  pm_task_description?: string
  frequency_interval?: string | number
  frequency_type?: string
  status?: string
  equipment_id?: string | number
  unit_number?: string
  equipment_type?: string
  facility_code?: string
  facility_name?: string
}

// Nested type definitions for PM Schedule Detail
export interface PMPartUsed {
  part_name: string
  part_quantity?: number
  part_cost?: number
}

export interface PMEvent {
  pm_event_id: number
  performed_date?: string | null
  next_due_date?: string | null
  work_performed?: string | null
  location?: string | null
  vendor_technician?: string | null
  time_taken?: string | null
  status: string
  notes?: string | null
  pm_parts_used: PMPartUsed[]
}

export interface EquipmentGPSLocation {
  latitude?: number | null
  longitude?: number | null
  location?: string | null
  motion_status?: string | null
}

export interface EquipmentTypeLookupRef {
  equipment_type?: string | null
}

export interface Equipment {
  equipment_id: number
  unit_number?: string | null
  equipment_type_lookup_ref: EquipmentTypeLookupRef
  current_equipment_gps_location?: EquipmentGPSLocation | null
}

export interface Account {
  account_id: number
  account_name: string
}

export interface FacilityLookup {
  facility_code?: string | null
  facility_name?: string | null
}

// Main return type for the service
export interface PMScheduleDetail {
  pmScheduleId: number
  pmType?: string | null
  taskDescription?: string | null
  frequency: string
  scheduleStatus?: string | null
  comments?: string | null
  account: Account
  equipment: Equipment
  facility: FacilityLookup
  timeline: Array<{
    pmEventId: number
    performedDate?: string | null
    dueDate?: string | null
    status?: string | null
    notes?: string | null
  }>
  serviceHistory: Array<{
    pmEventId: number
    performedDate?: string | null
    dueDate?: string | null
    workPerformed?: string | null
    location?: string | null
    vendorTechnician?: string | null
    timeTaken?: string | null
    status?: string | null
    notes?: string | null
    partsReplaced?: PMPartUsed[]
  }>
}
