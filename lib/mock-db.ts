export interface MockUser {
  id: string
  email: string
  password: string
  firstName: string
  lastName: string
  role: "ADMIN" | "MANAGER" | "USER" | "VIEWER"
  isActive: boolean
  organizationId: string
  createdAt: string
  updatedAt: string
}

export interface MockVehicle {
  id: string
  unitNumber: string
  make: string
  model: string
  year: number
  vin: string
  licensePlate: string
  mileage: number
  status: "IN_SERVICE" | "OUT_OF_SERVICE" | "MAINTENANCE" | "REPAIR_SHOP" | "RETIRED"
  fuelLevel: number
  organizationId: string
  createdAt: string
  updatedAt: string
}

export interface MockInventoryItem {
  id: string
  name: string
  description?: string
  category: "EMERGENCY" | "CONSUMABLES" | "EQUIPMENT" | "MEDICATIONS" | "SUPPLIES" | "TOOLS" | "OTHER"
  sku?: string
  currentStock: number
  minStock: number
  maxStock?: number
  unitCost?: number
  unitPrice?: number
  expiryDate?: string
  lotNumber?: string
  supplier?: string
  organizationId: string
  locationId?: string
  createdAt: string
  updatedAt: string
}

export interface MockMedication {
  id: string
  name: string
  dosage: string
  form: string
  lotNumber: string
  expiryDate: string
  quantity: number
  isControlled: boolean
  controlledClass?: string
  location: "MAIN_SUPPLY" | "VEHICLE"
  vehicleId?: string
  createdAt: string
  updatedAt: string
}

export interface MockOrder {
  id: string
  orderNumber: string
  status: "DRAFT" | "PENDING" | "APPROVED" | "ORDERED" | "SHIPPED" | "RECEIVED" | "CANCELLED"
  priority: "LOW" | "NORMAL" | "HIGH" | "URGENT"
  totalAmount: number
  notes?: string
  orderDate: string
  expectedDate?: string
  receivedDate?: string
  organizationId: string
  supplierId: string
  userId: string
  createdAt: string
  updatedAt: string
}

export interface MockDailyCheck {
  id: string
  date: string
  shift: string
  mileage: number
  fuelLevel: number
  status: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "FAILED"
  notes?: string
  completedAt?: string
  vehicleId: string
  userId: string
  createdAt: string
  updatedAt: string
}

export interface MockLocation {
  id: string
  name: string
  type: "BUILDING" | "ROOM" | "CABINET" | "SHELF" | "CONTAINER" | "VEHICLE" | "OTHER"
  description?: string
  capacity?: number
  parentId?: string
  organizationId: string
  createdAt: string
  updatedAt: string
}

export interface MockNotification {
  id: string
  title: string
  message: string
  type: "INFO" | "WARNING" | "ERROR" | "SUCCESS"
  priority: "LOW" | "NORMAL" | "HIGH" | "URGENT"
  isRead: boolean
  userId: string
  data?: any
  createdAt: string
  updatedAt: string
}

class MockDatabase {
  private storageKey = "ambusupply_mock_db"

  private defaultData = {
    users: [
      {
        id: "user_1",
        email: "admin@metroems.com",
        password: "$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi", // admin123
        firstName: "Admin",
        lastName: "User",
        role: "ADMIN" as const,
        isActive: true,
        organizationId: "org_1",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ],
    vehicles: [
      {
        id: "vehicle_1",
        unitNumber: "AMB-001",
        make: "Ford",
        model: "Transit",
        year: 2022,
        vin: "1FTBW2CM6NKA12345",
        licensePlate: "EMS001",
        mileage: 45230,
        status: "IN_SERVICE" as const,
        fuelLevel: 85,
        organizationId: "org_1",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: "vehicle_2",
        unitNumber: "AMB-002",
        make: "Chevrolet",
        model: "Express",
        year: 2021,
        vin: "1GCWGAFG8M1234567",
        licensePlate: "EMS002",
        mileage: 38750,
        status: "MAINTENANCE" as const,
        fuelLevel: 60,
        organizationId: "org_1",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ],
    inventoryItems: [
      {
        id: "item_1",
        name: "Oxygen Tank (15L)",
        description: "Medical oxygen tank, 15 liter capacity",
        category: "EMERGENCY" as const,
        sku: "OXY-15L-001",
        currentStock: 25,
        minStock: 10,
        maxStock: 50,
        unitCost: 45.0,
        unitPrice: 65.0,
        supplier: "MedSupply Co",
        organizationId: "org_1",
        locationId: "loc_1",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: "item_2",
        name: "Cardiac Monitor",
        description: "Portable cardiac monitoring device",
        category: "EQUIPMENT" as const,
        sku: "CARD-MON-001",
        currentStock: 8,
        minStock: 5,
        maxStock: 15,
        unitCost: 2500.0,
        unitPrice: 3200.0,
        supplier: "MedTech Solutions",
        organizationId: "org_1",
        locationId: "loc_2",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ],
    medications: [
      {
        id: "med_1",
        name: "Epinephrine",
        dosage: "1mg/mL",
        form: "injection",
        lotNumber: "EPI2024001",
        expiryDate: "2025-06-15",
        quantity: 12,
        isControlled: false,
        location: "MAIN_SUPPLY" as const,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: "med_2",
        name: "Morphine Sulfate",
        dosage: "10mg/mL",
        form: "injection",
        lotNumber: "MOR2024002",
        expiryDate: "2025-03-20",
        quantity: 8,
        isControlled: true,
        controlledClass: "Schedule II",
        location: "VEHICLE" as const,
        vehicleId: "vehicle_1",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ],
    orders: [
      {
        id: "order_1",
        orderNumber: "ORD-2024-001",
        status: "PENDING" as const,
        priority: "NORMAL" as const,
        totalAmount: 1250.0,
        notes: "Urgent restocking of emergency supplies",
        orderDate: new Date().toISOString(),
        expectedDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        organizationId: "org_1",
        supplierId: "supplier_1",
        userId: "user_1",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ],
    dailyChecks: [
      {
        id: "check_1",
        date: new Date().toISOString(),
        shift: "Day Shift",
        mileage: 45230,
        fuelLevel: 85,
        status: "COMPLETED" as const,
        notes: "All systems operational",
        completedAt: new Date().toISOString(),
        vehicleId: "vehicle_1",
        userId: "user_1",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ],
    locations: [
      {
        id: "loc_1",
        name: "Main Supply Room",
        type: "ROOM" as const,
        description: "Primary storage for medical supplies",
        capacity: 1000,
        organizationId: "org_1",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: "loc_2",
        name: "Equipment Storage",
        type: "ROOM" as const,
        description: "Storage for medical equipment",
        capacity: 500,
        organizationId: "org_1",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ],
    notifications: [
      {
        id: "notif_1",
        title: "Low Stock Alert",
        message: "Oxygen Tank (15L) is running low. Current stock: 8 units",
        type: "WARNING" as const,
        priority: "HIGH" as const,
        isRead: false,
        userId: "user_1",
        data: { itemId: "item_1", currentStock: 8, minStock: 10 },
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
        updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: "notif_2",
        title: "Maintenance Due",
        message: "AMB-002 is scheduled for maintenance today",
        type: "INFO" as const,
        priority: "NORMAL" as const,
        isRead: false,
        userId: "user_1",
        data: { vehicleId: "vehicle_2", unitNumber: "AMB-002" },
        createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), // 4 hours ago
        updatedAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: "notif_3",
        title: "Order Approved",
        message: "Order ORD-2024-001 has been approved and sent to supplier",
        type: "SUCCESS" as const,
        priority: "NORMAL" as const,
        isRead: true,
        userId: "user_1",
        data: { orderId: "order_1", orderNumber: "ORD-2024-001" },
        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
        updatedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      },
    ],
  }

  private getData() {
    const stored = localStorage.getItem(this.storageKey)
    if (stored) {
      try {
        return JSON.parse(stored)
      } catch {
        return this.defaultData
      }
    }
    return this.defaultData
  }

  private saveData(data: any) {
    localStorage.setItem(this.storageKey, JSON.stringify(data))
  }

  // Generic CRUD operations
  findMany<T>(table: string, where?: Partial<T>): T[] {
    const data = this.getData()
    let items = data[table] || []

    if (where) {
      items = items.filter((item: any) => {
        return Object.entries(where).every(([key, value]) => item[key] === value)
      })
    }

    return items
  }

  findUnique<T>(table: string, where: Partial<T>): T | null {
    const items = this.findMany<T>(table, where)
    return items[0] || null
  }

  create<T>(table: string, data: Omit<T, "id" | "createdAt" | "updatedAt">): T {
    const allData = this.getData()
    const newItem = {
      ...data,
      id: `${table}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    } as T

    if (!allData[table]) {
      allData[table] = []
    }

    allData[table].push(newItem)
    this.saveData(allData)
    return newItem
  }

  update<T>(table: string, where: Partial<T>, data: Partial<T>): T | null {
    const allData = this.getData()
    const items = allData[table] || []
    const index = items.findIndex((item: any) => {
      return Object.entries(where).every(([key, value]) => item[key] === value)
    })

    if (index === -1) return null

    const updatedItem = {
      ...items[index],
      ...data,
      updatedAt: new Date().toISOString(),
    }

    items[index] = updatedItem
    this.saveData(allData)
    return updatedItem
  }

  delete<T>(table: string, where: Partial<T>): boolean {
    const allData = this.getData()
    const items = allData[table] || []
    const initialLength = items.length

    allData[table] = items.filter((item: any) => {
      return !Object.entries(where).every(([key, value]) => item[key] === value)
    })

    this.saveData(allData)
    return allData[table].length < initialLength
  }

  count<T>(table: string, where?: Partial<T>): number {
    const items = this.findMany<T>(table, where)
    return items.length
  }

  // Notification-specific methods to match Prisma API
  get notification() {
    return {
      findMany: (options?: { where?: any; orderBy?: any; take?: number; skip?: number }) => {
        let items = this.findMany<MockNotification>("notifications", options?.where)

        if (options?.orderBy) {
          // Simple ordering by createdAt desc (most common case)
          items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        }

        if (options?.skip) {
          items = items.slice(options.skip)
        }

        if (options?.take) {
          items = items.slice(0, options.take)
        }

        return items
      },

      count: (options?: { where?: any }) => {
        return this.count<MockNotification>("notifications", options?.where)
      },

      findUnique: (options: { where: any }) => {
        return this.findUnique<MockNotification>("notifications", options.where)
      },

      create: (options: { data: any }) => {
        return this.create<MockNotification>("notifications", options.data)
      },

      update: (options: { where: any; data: any }) => {
        return this.update<MockNotification>("notifications", options.where, options.data)
      },

      delete: (options: { where: any }) => {
        this.delete<MockNotification>("notifications", options.where)
        return { id: options.where.id }
      },

      updateMany: (options: { where: any; data: any }) => {
        const allData = this.getData()
        const items = allData.notifications || []
        let updatedCount = 0

        items.forEach((item: any, index: number) => {
          const matches = Object.entries(options.where).every(([key, value]) => item[key] === value)
          if (matches) {
            items[index] = { ...item, ...options.data, updatedAt: new Date().toISOString() }
            updatedCount++
          }
        })

        this.saveData(allData)
        return { count: updatedCount }
      },
    }
  }

  // Initialize with default data if empty
  initialize() {
    const stored = localStorage.getItem(this.storageKey)
    if (!stored) {
      this.saveData(this.defaultData)
    }
  }

  // Reset to default data
  reset() {
    this.saveData(this.defaultData)
  }
}

export const mockDb = new MockDatabase()

// Initialize on import
if (typeof window !== "undefined") {
  mockDb.initialize()
}
