// Core API Response Types
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
  timestamp: string
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}

// Authentication Types
export interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  role: UserRole
  permissions: Permission[]
  avatar?: string
  isActive: boolean
  lastLogin?: string
  createdAt: string
  updatedAt: string
}

export interface UserRole {
  id: string
  name: string
  description: string
  permissions: Permission[]
}

export interface Permission {
  id: string
  name: string
  resource: string
  action: string
}

export interface AuthTokens {
  accessToken: string
  refreshToken: string
  expiresIn: number
}

// Inventory Types
export interface InventoryItem {
  id: string
  name: string
  description?: string
  category: InventoryCategory
  sku: string
  barcode?: string
  currentStock: number
  minStock: number
  maxStock: number
  reorderPoint: number
  unitPrice: number
  supplier: Supplier
  location: Location
  status: InventoryStatus
  expirationDate?: string
  batchNumber?: string
  images: string[]
  tags: string[]
  createdAt: string
  updatedAt: string
}

export interface InventoryCategory {
  id: string
  name: string
  description?: string
  parentId?: string
  children?: InventoryCategory[]
  color: string
  icon: string
}

export interface InventoryStatus {
  value: "in-stock" | "low-stock" | "out-of-stock" | "critical" | "discontinued"
  label: string
  color: string
}

// Fleet Types
export interface Vehicle {
  id: string
  unitNumber: string
  make: string
  model: string
  year: number
  vin: string
  licensePlate: string
  type: VehicleType
  status: VehicleStatus
  location: GeoLocation
  fuelLevel: number
  mileage: number
  lastMaintenance?: string
  nextMaintenance?: string
  assignedCrew?: CrewMember[]
  equipment: EquipmentItem[]
  dailyChecks: DailyCheck[]
  createdAt: string
  updatedAt: string
}

export interface VehicleType {
  id: string
  name: string
  description?: string
  capacity: number
  equipmentRequirements: string[]
}

export interface VehicleStatus {
  value: "available" | "deployed" | "maintenance" | "out-of-service"
  label: string
  color: string
  location?: string
  estimatedReturn?: string
}

export interface CrewMember {
  id: string
  firstName: string
  lastName: string
  role: string
  certifications: Certification[]
  contactInfo: ContactInfo
}

export interface Certification {
  id: string
  name: string
  issuedBy: string
  issuedDate: string
  expirationDate: string
  isActive: boolean
}

// Daily Check Types
export interface DailyCheck {
  id: string
  vehicleId: string
  performedBy: CrewMember
  checkDate: string
  status: "passed" | "failed" | "needs-attention"
  items: DailyCheckItem[]
  notes?: string
  signature?: string
  completedAt: string
}

export interface DailyCheckItem {
  id: string
  categoryId: string
  name: string
  description?: string
  status: "pass" | "fail" | "na"
  notes?: string
  isRequired: boolean
  order: number
}

export interface DailyCheckCategory {
  id: string
  name: string
  description?: string
  items: DailyCheckItem[]
  order: number
  isCustomizable: boolean
}

// Location Types
export interface Location {
  id: string
  name: string
  description?: string
  type: LocationType
  parentId?: string
  children?: Location[]
  address?: Address
  coordinates?: GeoLocation
  capacity?: number
  currentOccupancy?: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface LocationType {
  id: string
  name: string
  description?: string
  color: string
  icon: string
  allowsChildren: boolean
}

export interface GeoLocation {
  latitude: number
  longitude: number
  accuracy?: number
  timestamp?: string
}

export interface Address {
  street: string
  city: string
  state: string
  zipCode: string
  country: string
}

// Order Types
export interface Order {
  id: string
  orderNumber: string
  supplier: Supplier
  status: OrderStatus
  priority: OrderPriority
  items: OrderItem[]
  subtotal: number
  tax: number
  shipping: number
  total: number
  requestedBy: User
  approvedBy?: User
  deliveryAddress: Address
  expectedDelivery?: string
  actualDelivery?: string
  notes?: string
  attachments: string[]
  createdAt: string
  updatedAt: string
}

export interface OrderItem {
  id: string
  inventoryItem: InventoryItem
  quantity: number
  unitPrice: number
  totalPrice: number
  notes?: string
}

export interface OrderStatus {
  value: "draft" | "pending" | "approved" | "ordered" | "shipped" | "delivered" | "cancelled"
  label: string
  color: string
  allowedTransitions: string[]
}

export interface OrderPriority {
  value: "low" | "normal" | "high" | "urgent" | "emergency"
  label: string
  color: string
  escalationTime?: number
}

// Supplier Types
export interface Supplier {
  id: string
  name: string
  description?: string
  contactInfo: ContactInfo
  address: Address
  paymentTerms: string
  deliveryTime: number
  rating: number
  isActive: boolean
  categories: InventoryCategory[]
  contracts: Contract[]
  createdAt: string
  updatedAt: string
}

export interface ContactInfo {
  primaryContact: string
  email: string
  phone: string
  alternatePhone?: string
  website?: string
}

export interface Contract {
  id: string
  name: string
  startDate: string
  endDate: string
  terms: string
  isActive: boolean
}

// Equipment Types
export interface EquipmentItem {
  id: string
  name: string
  description?: string
  serialNumber: string
  model: string
  manufacturer: string
  category: EquipmentCategory
  status: EquipmentStatus
  location: Location
  assignedTo?: Vehicle
  lastInspection?: string
  nextInspection?: string
  maintenanceHistory: MaintenanceRecord[]
  createdAt: string
  updatedAt: string
}

export interface EquipmentCategory {
  id: string
  name: string
  description?: string
  inspectionInterval: number
  maintenanceRequirements: string[]
}

export interface EquipmentStatus {
  value: "operational" | "maintenance" | "repair" | "out-of-service" | "retired"
  label: string
  color: string
}

export interface MaintenanceRecord {
  id: string
  type: "inspection" | "repair" | "replacement" | "calibration"
  description: string
  performedBy: string
  performedAt: string
  cost?: number
  notes?: string
  nextDue?: string
}

// Report Types
export interface Report {
  id: string
  name: string
  type: ReportType
  parameters: ReportParameters
  generatedBy: User
  generatedAt: string
  format: "pdf" | "excel" | "csv" | "json"
  url?: string
  isScheduled: boolean
  schedule?: ReportSchedule
}

export interface ReportType {
  id: string
  name: string
  description?: string
  category: string
  template: string
  availableParameters: ReportParameter[]
}

export interface ReportParameters {
  dateRange: {
    start: string
    end: string
  }
  filters: Record<string, any>
  groupBy?: string[]
  sortBy?: string
  includeCharts: boolean
}

export interface ReportParameter {
  name: string
  type: "string" | "number" | "date" | "boolean" | "select"
  required: boolean
  options?: string[]
  defaultValue?: any
}

export interface ReportSchedule {
  frequency: "daily" | "weekly" | "monthly" | "quarterly"
  dayOfWeek?: number
  dayOfMonth?: number
  time: string
  recipients: string[]
  isActive: boolean
}

// Analytics Types
export interface AnalyticsData {
  metrics: Metric[]
  charts: ChartData[]
  kpis: KPI[]
  trends: TrendData[]
  period: {
    start: string
    end: string
  }
}

export interface Metric {
  name: string
  value: number
  unit?: string
  change?: number
  changeType?: "increase" | "decrease"
  target?: number
  status: "good" | "warning" | "critical"
}

export interface ChartData {
  type: "line" | "bar" | "pie" | "area" | "scatter"
  title: string
  data: any[]
  xAxis?: string
  yAxis?: string
  categories?: string[]
}

export interface KPI {
  name: string
  value: number
  target: number
  unit?: string
  trend: "up" | "down" | "stable"
  status: "good" | "warning" | "critical"
  description?: string
}

export interface TrendData {
  name: string
  data: Array<{
    date: string
    value: number
  }>
  trend: "increasing" | "decreasing" | "stable"
  correlation?: number
}

// Settings Types
export interface SystemSettings {
  general: GeneralSettings
  inventory: InventorySettings
  fleet: FleetSettings
  notifications: NotificationSettings
  security: SecuritySettings
  integrations: IntegrationSettings
}

export interface GeneralSettings {
  organizationName: string
  timezone: string
  dateFormat: string
  currency: string
  language: string
  theme: "light" | "dark" | "auto"
}

export interface InventorySettings {
  autoReorder: boolean
  reorderThreshold: number
  lowStockAlert: boolean
  expirationAlert: boolean
  expirationDays: number
  categories: InventoryCategory[]
  statuses: InventoryStatus[]
}

export interface FleetSettings {
  maintenanceInterval: number
  fuelThreshold: number
  dailyCheckRequired: boolean
  gpsTracking: boolean
  vehicleTypes: VehicleType[]
  statuses: VehicleStatus[]
}

export interface NotificationSettings {
  email: boolean
  sms: boolean
  push: boolean
  channels: NotificationChannel[]
  rules: NotificationRule[]
}

export interface NotificationChannel {
  id: string
  name: string
  type: "email" | "sms" | "push" | "webhook"
  config: Record<string, any>
  isActive: boolean
}

export interface NotificationRule {
  id: string
  name: string
  trigger: string
  conditions: Record<string, any>
  channels: string[]
  recipients: string[]
  isActive: boolean
}

export interface SecuritySettings {
  passwordPolicy: PasswordPolicy
  sessionTimeout: number
  twoFactorAuth: boolean
  ipWhitelist: string[]
  auditLog: boolean
}

export interface PasswordPolicy {
  minLength: number
  requireUppercase: boolean
  requireLowercase: boolean
  requireNumbers: boolean
  requireSymbols: boolean
  expirationDays: number
}

export interface IntegrationSettings {
  apis: ApiIntegration[]
  webhooks: WebhookConfig[]
  exports: ExportConfig[]
}

export interface ApiIntegration {
  id: string
  name: string
  type: string
  endpoint: string
  apiKey?: string
  isActive: boolean
  lastSync?: string
  config: Record<string, any>
}

export interface WebhookConfig {
  id: string
  name: string
  url: string
  events: string[]
  secret?: string
  isActive: boolean
}

export interface ExportConfig {
  id: string
  name: string
  format: "json" | "csv" | "xml"
  schedule?: string
  destination: string
  isActive: boolean
}
