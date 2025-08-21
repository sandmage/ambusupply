// Deployment verification script
import { createServerClient } from "@/lib/supabase/server"
import type { InventoryItem, Location } from "@/lib/types"

async function testDatabaseConnection() {
  console.log("[v0] Testing database connection...")
  try {
    const supabase = createServerClient()
    const { data, error } = await supabase.from("organizations").select("id").limit(1)

    if (error) {
      console.error("[v0] Database connection failed:", error)
      return false
    }

    console.log("[v0] Database connection successful")
    return true
  } catch (error) {
    console.error("[v0] Database connection error:", error)
    return false
  }
}

async function testTypeDefinitions() {
  console.log("[v0] Testing type definitions...")

  // Test InventoryItem type
  const testItem: InventoryItem = {
    id: "test-id",
    name: "Test Item",
    description: "Test Description",
    quantity: 10,
    unit: "pieces",
    location_id: "test-location-id",
    storage_unit_id: "test-storage-id",
    organization_id: "test-org-id",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }

  // Test Location type
  const testLocation: Location = {
    id: "test-location-id",
    name: "Test Location",
    description: "Test Location Description",
    organization_id: "test-org-id",
    storage_units: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }

  console.log("[v0] Type definitions are valid")
  return true
}

async function runDeploymentTests() {
  console.log("[v0] Starting deployment verification tests...")

  const tests = [
    { name: "Database Connection", test: testDatabaseConnection },
    { name: "Type Definitions", test: testTypeDefinitions },
  ]

  const results = []

  for (const { name, test } of tests) {
    try {
      const result = await test()
      results.push({ name, passed: result })
      console.log(`[v0] ${name}: ${result ? "PASSED" : "FAILED"}`)
    } catch (error) {
      results.push({ name, passed: false, error })
      console.error(`[v0] ${name}: FAILED with error:`, error)
    }
  }

  const allPassed = results.every((r) => r.passed)
  console.log(`[v0] Deployment tests ${allPassed ? "PASSED" : "FAILED"}`)

  return allPassed
}

// Export for use in other files
export { runDeploymentTests }

// Run tests if this file is executed directly
if (require.main === module) {
  runDeploymentTests()
    .then((success) => {
      process.exit(success ? 0 : 1)
    })
    .catch((error) => {
      console.error("[v0] Test execution failed:", error)
      process.exit(1)
    })
}
