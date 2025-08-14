import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
  console.log("🌱 Seeding database...")

  // Create or update organization
  const organization = await prisma.organization.upsert({
    where: { email: "admin@metroems.com" },
    update: {},
    create: {
      name: "Metro Emergency Services",
      address: "123 Emergency Way, City, State 12345",
      phone: "(555) 123-4567",
      email: "admin@metroems.com",
      timezone: "America/New_York",
    },
  })

  // Create or update admin user
  const hashedPassword = await bcrypt.hash("admin123", 12)
  const adminUser = await prisma.user.upsert({
    where: { email: "admin@metroems.com" },
    update: {},
    create: {
      email: "admin@metroems.com",
      password: hashedPassword,
      firstName: "Admin",
      lastName: "User",
      role: "ADMIN",
      organizationId: organization.id,
    },
  })

  // Create locations if they don't exist
  const headquarters = await prisma.location.upsert({
    where: {
      name_organizationId: {
        name: "Headquarters",
        organizationId: organization.id,
      },
    },
    update: {},
    create: {
      name: "Headquarters",
      type: "BUILDING",
      description: "Main facility",
      organizationId: organization.id,
    },
  })

  const mainCloset = await prisma.location.upsert({
    where: {
      name_organizationId: {
        name: "Main Supply Closet",
        organizationId: organization.id,
      },
    },
    update: {},
    create: {
      name: "Main Supply Closet",
      type: "ROOM",
      description: "Primary inventory storage",
      parentId: headquarters.id,
      organizationId: organization.id,
    },
  })

  // Continue with other seed data...
  console.log("✅ Database seeded successfully!")
}

main()
  .catch((e) => {
    console.error("❌ Error seeding database:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
