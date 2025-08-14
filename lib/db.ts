import { mockDb } from "./mock-db"
import { PrismaClient } from "@prisma/client"

// Check if we're in v0 environment
const isV0Environment = typeof window !== "undefined" && window.location.hostname.includes("v0.app")

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const db = isV0Environment
  ? mockDb
  : (globalForPrisma.prisma ??
    new PrismaClient({
      log: ["query"],
    }))

if (!isV0Environment && process.env.NODE_ENV !== "production") globalForPrisma.prisma = db
