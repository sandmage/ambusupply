export interface InventoryItem {
  id: string
  name: string
  description?: string
  quantity: number // Maps to current_quantity in database
  min_par_level: number // Maps to par_level in database
  unit_of_measure: string
  expiration_date?: string
  lot_number?: string
  location_name: string
  storage_unit_name?: string
  created_at: string
  ordering_url?: string
  location_id: string
  storage_unit_id?: string // Made storage_unit_id optional to match form logic and database schema
  notes?: string
}

export interface Location {
  id: string
  name: string
  description?: string
  storage_units: StorageUnit[]
}

export interface StorageUnit {
  id: string
  name: string
  type: string // Standardized to 'type' across all components
  location_id: string
  position_order: number
  description?: string
  children?: StorageUnit[]
}

export interface Transaction {
  id: string
  item_id: string
  item_name?: string
  location_name?: string
  user_name?: string
  transaction_type: "use" | "restock" | "transfer" | "adjustment" | "expired"
  quantity_change: number
  quantity_after?: number
  reason?: string
  notes?: string
  performed_by: string
  created_at: string
}

export interface User {
  id: string
  email: string
  role: "admin" | "staff"
  organization_id: string
  created_at: string
}

export interface Organization {
  id: string
  name: string
  created_at: string
}

export interface Vehicle {
  id: string
  name: string
  type: string
  license_plate?: string
  vin?: string
  year?: number
  make?: string
  model?: string
  mileage?: number
  fuel_type?: string
  status: "active" | "maintenance" | "retired"
  last_inspection?: string
  next_inspection?: string
  insurance_expiry?: string
  registration_expiry?: string
  notes?: string
  organization_id: string
  created_at: string
  updated_at?: string
}

export interface Medication {
  id: string
  name: string
  description?: string
  generic_name?: string
  dosage_form?: string
  strength?: string
  ndc_number?: string
  lot_number?: string
  expiration_date?: string
  quantity: number
  min_par_level: number
  unit_of_measure: string
  location_id: string
  location_name: string
  storage_unit_id?: string
  storage_unit_name?: string
  controlled_substance_schedule?: string
  temperature_requirements?: string
  notes?: string
  created_at: string
}

export interface UserProfile {
  id: string
  email: string
  full_name?: string
  role: "admin" | "staff"
  organization_id?: string
  created_at: string
  updated_at?: string
}

// Equipment-related type definitions
export interface EquipmentType {
  id: string
  name: string
  manufacturer?: string
  model?: string
  description?: string
  category?: string
  created_at: string
}

export interface Equipment {
  id: string
  equipment_type_id: string
  serial_number: string
  asset_tag?: string
  status: "in_service" | "out_of_service" | "maintenance" | "retired"
  purchase_date?: string
  purchase_cost?: number
  warranty_expiration?: string
  location_id?: string
  assigned_vehicle_id?: string
  notes?: string
  last_maintenance?: string
  next_maintenance?: string
  created_at: string
  updated_at?: string
  equipment_types?: EquipmentType
}

export interface EquipmentMaintenance {
  id: string
  equipment_id: string
  maintenance_type: "routine" | "repair" | "inspection" | "calibration" | "emergency"
  description: string
  scheduled_date?: string
  completed_date?: string
  cost?: number
  service_provider?: string
  parts_replaced?: string[]
  next_service_due?: string
  maintenance_notes?: string
  created_at: string
  updated_at?: string
}

export interface VehicleStorageUnit {
  id: string
  vehicle_id: string
  name: string
  unit_type: "cabinet" | "bag" | "kit" | "compartment" | "equipment"
  description?: string
  position_info?: any
  created_at: string
}

export interface VehicleStorageLocation {
  id: string
  storage_unit_id: string
  name: string
  location_type: "pocket" | "shelf" | "module" | "compartment" | "section"
  position_order?: number
  description?: string
  created_at: string
}

export interface VehicleInventoryItem {
  id: string
  vehicle_id: string
  inventory_item_id: string
  storage_unit_id?: string
  storage_location_id?: string
  current_quantity: number
  par_level_min: number
  par_level_max?: number
  expiration_date?: string
  lot_number?: string
  notes?: string
  created_at: string
  updated_at?: string
}
