// import { PrismaClient } from "@prisma/client"
// const prisma = new PrismaClient()
// import { faker } from "@faker-js/faker"

// // Helper function to generate random coordinates within a range
// function getRandomInRange(min: number, max: number, decimals: number) {
//   const factor = Math.pow(10, decimals)
//   return Math.floor((Math.random() * (max - min) + min) * factor) / factor
// }

// const roles = [
//   { name: "SuperAdmin", description: "Super Administrator" },
//   { name: "TenAdmin", description: "Tenant Administrator" },
//   { name: "AccountAdmin", description: "Account Administrator" },
//   { name: "AccountUser", description: "Account User" },
// ]

// function getRandomSubset<T>(array: T[], min: number, max: number): T[] {
//   const count = Math.floor(Math.random() * (max - min + 1)) + min
//   const shuffled = array.sort(() => 0.5 - Math.random())
//   return shuffled.slice(0, count)
// }

// async function main() {
//   // --- Seed statuses ---
//   await prisma.simple_field_lookup.upsert({
//     where: { field_code: "ACTIVE" },
//     update: {},
//     create: {
//       field_name: "Status",
//       field_code: "ACTIVE",
//       short_description: "Active",
//       long_description: "Active status",
//       status: "A",
//     },
//   })
//   await prisma.simple_field_lookup.upsert({
//     where: { field_code: "INACTIVE" },
//     update: {},
//     create: {
//       field_name: "Status",
//       field_code: "INACTIVE",
//       short_description: "Inactive",
//       long_description: "Inactive status",
//       status: "A",
//     },
//   })
//   console.log("Seeded status lookups.")

//   // --- Seed assignment reasons ---
//   await prisma.simple_field_lookup.upsert({
//     where: { field_code: "O" },
//     update: {},
//     create: {
//       field_name: "Assignment Reason",
//       field_code: "O",
//       short_description: "Outbound",
//       long_description: "Outbound assignment",
//       status: "A",
//     },
//   })
//   await prisma.simple_field_lookup.upsert({
//     where: { field_code: "I" },
//     update: {},
//     create: {
//       field_name: "Assignment Reason",
//       field_code: "I",
//       short_description: "Inbound",
//       long_description: "Inbound assignment",
//       status: "A",
//     },
//   })
//   console.log("Seeded assignment reasons.")

//   // --- Seed country ---
//   const country = await prisma.country_lookup.upsert({
//     where: { country_code: "US" },
//     update: {},
//     create: {
//       country_code: "US",
//       country_name: "United States",
//       status: "ACTIVE",
//     },
//   })
//   console.log(`Seeded country: ${country.country_name}`)

//   // --- Seed 20 equipment types ---
//   const equipmentTypesData = Array.from({ length: 20 }, (_, i) => ({
//     equipment_type: `TYPE${i + 1}`,
//     equipment_description: `Equipment Type ${i + 1}`,
//     equipment_name: `EquipType ${i + 1}`,
//   }))
//   const equipmentTypes = []
//   for (const et of equipmentTypesData) {
//     const createdType = await prisma.equipment_type_lookup.upsert({
//       where: { equipment_type: et.equipment_type },
//       update: {},
//       create: et,
//     })
//     equipmentTypes.push(createdType)
//   }
//   console.log(`Seeded ${equipmentTypes.length} equipment types.`)

//   // --- Seed OEM lookup ---
//   const oem = await prisma.oem_lookup.upsert({
//     where: { manufacturer_code: "WABASH" },
//     update: {},
//     create: {
//       manufacturer_code: "WABASH",
//       manufacturer_name: "Wabash National",
//     },
//   })
//   console.log(`Seeded OEM manufacturer: ${oem.manufacturer_name}`)

//   // --- Seed OEM make/model ---
//   const oemModel = await prisma.oem_make_model_lookup.upsert({
//     where: { oem_make_model_lookup_id: 1 },
//     update: {},
//     create: {
//       oem_lookup_id: oem.oem_lookup_id,
//       make: "Wabash",
//       model: "DuraPlate",
//       year: "2023",
//     },
//   })
//   console.log(
//     `Seeded OEM make/model: ${oemModel.make} ${oemModel.model} ${oemModel.year}`
//   )

//   // --- Seed UOM ---
//   const uom = await prisma.uom_lookup.upsert({
//     where: { uom_lookup_id: 1 },
//     update: {},
//     create: {
//       uom_type: "MILE",
//       description: "Miles",
//     },
//   })
//   console.log(`Seeded UOM: ${uom.uom_type}`)

//   // --- Seed customer ---
//   const customer = await prisma.customer.upsert({
//     where: { customer_id: 1 },
//     update: {},
//     create: {
//       customer_name: "Acme Logistics",
//       customer_class: "NATIONAL",
//       status: "ACTIVE",
//       reference_number: "ACME001",
//     },
//   })
//   console.log(`Seeded customer: ${customer.customer_name}`)

//   // --- Seed parent accounts ---
//   const parentAccounts = []
//   for (let i = 1; i <= 5; i++) {
//     const parentAcc = await prisma.account.create({
//       data: {
//         customer_id: customer.customer_id,
//         account_name: `Parent ${i}`,
//         account_number: `ACME-P${i}`,
//         account_type: "REGIONAL",
//         status: "ACTIVE",
//         country_lookup_id: country.country_lookup_id,
//       },
//     })
//     parentAccounts.push(parentAcc)
//     console.log(`Created Parent Account: ${parentAcc.account_name}`)
//   }

//   // --- Seed child accounts (4 per parent) ---
//   const childAccounts = []
//   let childAccountId = 1
//   for (const parent of parentAccounts) {
//     for (let j = 1; j <= 4; j++) {
//       const childAcc = await prisma.account.create({
//         data: {
//           customer_id: customer.customer_id,
//           account_name: `Child ${childAccountId} of ${parent.account_name}`,
//           account_number: `ACME-C${childAccountId}`,
//           account_type: "NATIONAL",
//           status: "ACTIVE",
//           country_lookup_id: country.country_lookup_id,
//           parent_account_id: parent.account_id,
//         },
//       })
//       childAccounts.push(childAcc)
//       console.log(`Created Child Account: ${childAcc.account_name}`)
//       childAccountId++
//     }
//   }

//   // --- Seed facility ---
//   const facility = await prisma.facility_lookup.upsert({
//     where: { facility_code: "WH1" },
//     update: {},
//     create: {
//       facility_code: "WH1",
//       facility_name: "Warehouse 1",
//       facility_description: "Main distribution center",
//     },
//   })
//   console.log(`Seeded facility: ${facility.facility_name}`)

//   // --- Seed contract type ---
//   const contractType = await prisma.contract_type_lookup.upsert({
//     where: { contract_type_lookup_id: 1 },
//     update: {},
//     create: {
//       description: "Standard Lease",
//       frequency: 12,
//       billing_method: "MONTHLY",
//       status: "ACTIVE",
//     },
//   })
//   console.log(`Seeded contract type: ${contractType.description}`)

//   // --- Seed master agreement (attach to first parent account) ---
//   const masterAgreement = await prisma.master_agreement.upsert({
//     where: { master_agreement_id: 1 },
//     update: {},
//     create: {
//       contract_term_type: "YEAR",
//       contract_effective_date: new Date(),
//       contract_term: 3,
//       contract_billing_method: "MONTHLY",
//       status: "ACTIVE",
//       contract_end_date: new Date(
//         new Date().setFullYear(new Date().getFullYear() + 3)
//       ),
//       accountAccount_id: parentAccounts[0].account_id,
//       customerCustomer_id: customer.customer_id,
//     },
//   })
//   console.log(
//     `Seeded master agreement with ID: ${masterAgreement.master_agreement_id}`
//   )

//   // --- Seed schedule agreement ---
//   const scheduleAgreement = await prisma.schedule_agreement.upsert({
//     where: { schedule_agreement_id: 1 },
//     update: {},
//     create: {
//       master_agreement_id: masterAgreement.master_agreement_id,
//       schedule_type: "A",
//       contract_type_lookup_id: contractType.contract_type_lookup_id,
//       facility_lookup_id: facility.facility_lookup_id,
//       effective_date: new Date(),
//       contract_term: 12,
//       contract_term_type: "MONTH",
//       contract_billing_method: "MONTHLY",
//       schedule_agreement_date: new Date(),
//       termination_date: new Date(
//         new Date().setFullYear(new Date().getFullYear() + 1)
//       ),
//       status: "ACTIVE",
//       early_termination_date: new Date(),
//       full_term_months: 12,
//       non_cancel_months: 0,
//       max_sub_days: 0,
//       max_sub_days_duration: 0,
//       created_at: new Date(),
//       updated_at: new Date(),
//     },
//   })
//   console.log(
//     `Seeded schedule agreement with ID: ${scheduleAgreement.schedule_agreement_id}`
//   )

//   // --- Split 100,000 equipment evenly across equipment types ---
//   const totalEquipment = 100000
//   const numEquipmentTypes = equipmentTypes.length
//   const basePerType = Math.floor(totalEquipment / numEquipmentTypes)
//   const remainderPerType = totalEquipment % numEquipmentTypes

//   // --- Create line items for each equipment type ---
//   const lineItems = []
//   for (let t = 0; t < numEquipmentTypes; t++) {
//     const type = equipmentTypes[t]
//     const units = basePerType + (t < remainderPerType ? 1 : 0)
//     const lineItem = await prisma.schedule_agreement_line_item.upsert({
//       where: { schedule_agreement_line_item_id: t + 1 },
//       update: {},
//       create: {
//         schedule_agreement_id: scheduleAgreement.schedule_agreement_id,
//         equipment_type_lookup_id: type.equipment_type_lookup_id,
//         oem_make_model_lookup_id: oemModel.oem_make_model_lookup_id,
//         number_of_units: units,
//         rate: 1200 + t * 10,
//         status: "ACTIVE",
//       },
//     })
//     lineItems.push({ lineItem, units, eqType: type })
//     console.log(
//       `Created schedule line item ${lineItem.schedule_agreement_line_item_id} for equipment type ${type.equipment_type}`
//     )
//   }

//   // --- Seed IOT device vendor lookup ---
//   const iotVendor = await prisma.iot_device_vendor_lookup.upsert({
//     where: { iot_device_vendor_lookup_id: 1 },
//     update: {},
//     create: {
//       vendor_name: "Geotab",
//       vendor_description: "Geotab GPS devices",
//       vendor_method_type: "GPS",
//       vendor_service_type: "TRACKING",
//       status: "ACTIVE",
//     },
//   })
//   console.log(`Seeded IoT device vendor: ${iotVendor.vendor_name}`)

//   // Combine parent and child accounts into one array
//   const allAccounts = [...parentAccounts, ...childAccounts]

//   const numAllAccounts = allAccounts.length
//   let globalEquipCounter = 1

//   for (const { lineItem, units, eqType } of lineItems) {
//     const basePerAccount = Math.floor(units / numAllAccounts)
//     const remainder = units % numAllAccounts

//     console.log(
//       `Assigning ${units} units of type ${eqType.equipment_type} across ${numAllAccounts} total accounts`
//     )

//     for (let i = 0; i < numAllAccounts; i++) {
//       const acc = allAccounts[i]
//       const unitsForAccount = basePerAccount + (i < remainder ? 1 : 0)

//       const allocation = await prisma.equipment_type_allocation.create({
//         data: {
//           schedule_agreement_line_item_id:
//             lineItem.schedule_agreement_line_item_id,
//           account_id: acc.account_id,
//           units_allowed: unitsForAccount,

//           units_assigned: unitsForAccount,
//           status: "ACTIVE",
//           pms_override: false,
//           created_at: new Date(),
//           created_by: 1,
//         },
//       })

//       console.log(
//         `  Account ${acc.account_name} allocation ${allocation.equipment_type_allocation_id}: ${unitsForAccount} units allowed`
//       )

//       for (let j = 0; j < unitsForAccount; j++) {
//         const unitNumber = `TRL-${globalEquipCounter
//           .toString()
//           .padStart(6, "0")}`

//         const equipment = await prisma.equipment.create({
//           data: {
//             unit_number: unitNumber,
//             description: `53ft Dry Van Trailer - ${eqType.equipment_description}`,
//             date_in_service: new Date(),
//             status: "ACTIVE",
//             equipment_type_lookup_id: eqType.equipment_type_lookup_id,
//             oem_make_model_lookup_id: oemModel.oem_make_model_lookup_id,
//             uom_lookup_id: uom.uom_lookup_id,
//             gross_unit_weight: 35000.0,
//             trailer_length: "53 ft",
//             trailer_width: "8.5 ft",
//             assigned_to: acc.account_name,
//             assigned_date: new Date(),
//             created_at: new Date(),
//             created_by: 1,
//           },
//         })

//         const iotDevice = await prisma.iot_device.create({
//           data: {
//             iot_device_vendor_lookup_id: iotVendor.iot_device_vendor_lookup_id,
//             device_id_external: `GT-${unitNumber}`,
//             device_type: "GO9",
//             status: "ACTIVE",
//             created_at: new Date(),
//             created_by: 1,
//           },
//         })

//         await prisma.equipment_has_iot_device.create({
//           data: {
//             equipment_id: equipment.equipment_id,
//             iot_device_id: iotDevice.iot_device_id,
//             effective_date: new Date(),
//             status: "ACTIVE",
//             created_at: new Date(),
//             created_by: 1,
//           },
//         })

//         const latitude = getRandomInRange(24.396308, 49.384358, 6)
//         const longitude = getRandomInRange(-125.0, -66.93457, 6)
//         await prisma.current_equipment_gps_location.create({
//           data: {
//             equipment_id: equipment.equipment_id,
//             latitude,
//             longitude,
//             location: "Random US Location",
//             motion_status: Math.random() > 0.5 ? "MOVING" : "STOPPED",
//             last_gps_update: new Date(),
//             created_at: new Date(),
//             created_by: 1,
//           },
//         })

//         await prisma.equipment_assignment.create({
//           data: {
//             equipment_type_allocation_id:
//               allocation.equipment_type_allocation_id,
//             equipment_id: equipment.equipment_id,
//             activation_date: new Date(),
//             deactivation_date: new Date(
//               new Date().setFullYear(new Date().getFullYear() + 1)
//             ),
//             action_reason_type: "O",
//             driver_name: `Driver ${unitNumber}`,
//             is_gps_tracking: true,
//             is_substitute_allowed: false,
//             created_by: 1,
//             created_at: new Date(),
//             updated_at: new Date(),
//           },
//         })

//         if (globalEquipCounter % 1000 === 0) {
//           console.log(
//             `    Created ${globalEquipCounter} equipment records so far...`
//           )
//         }
//         globalEquipCounter++
//       }
//     }
//   }

//   // 1. Create roles
//   // Tenant role (customer_id: null)
//   const tenAdminRole = await prisma.user_role.upsert({
//     where: { customer_id_name: { customer_id: 0, name: "TenAdmin" } },
//     update: {},
//     create: {
//       name: "TenAdmin",
//       description: "Tenant Administrator",
//       customer_id: null as any,
//       auth0_role_id: faker.string.uuid(),
//       auth0_role_name: "TenAdmin_role",
//     },
//   })

//   // Customer-level roles (customer_id: 1)
//   const superAdminRole = await prisma.user_role.upsert({
//     where: { customer_id_name: { customer_id: 1, name: "SuperAdmin" } },
//     update: {},
//     create: {
//       name: "SuperAdmin",
//       description: "Super Administrator",
//       customer_id: 1,
//       auth0_role_id: faker.string.uuid(),
//       auth0_role_name: "SuperAdmin_role",
//     },
//   })
//   const accountAdminRole = await prisma.user_role.upsert({
//     where: { customer_id_name: { customer_id: 1, name: "AccountAdmin" } },
//     update: {},
//     create: {
//       name: "AccountAdmin",
//       description: "Account Administrator",
//       customer_id: 1,
//       auth0_role_id: faker.string.uuid(),
//       auth0_role_name: "AccountAdmin_role",
//     },
//   })
//   const accountUserRole = await prisma.user_role.upsert({
//     where: { customer_id_name: { customer_id: 1, name: "AccountUser" } },
//     update: {},
//     create: {
//       name: "AccountUser",
//       description: "Account User",
//       customer_id: 1,
//       auth0_role_id: faker.string.uuid(),
//       auth0_role_name: "AccountUser_role",
//     },
//   })

//   // 2. Create 20 tenant-level users (all TenAdmin)
//   for (let i = 0; i < 20; i++) {
//     await prisma.user.create({
//       data: {
//         customer_id: null,
//         user_role_id: tenAdminRole.user_role_id,
//         assigned_account_ids: [],
//         first_name: faker.person.firstName(),
//         last_name: faker.person.lastName(),
//         email: faker.internet.email(),
//         phone_number: faker.phone.number(),
//         designation: "TenAdmin",
//         avatar: faker.image.avatar(),
//         auth_0_reference_id: faker.string.uuid(),
//         auth0_role_id: tenAdminRole.auth0_role_id,
//         status: "Active",
//         is_customer_user: false,
//         first_active: faker.date.past(),
//         last_active: faker.date.recent(),
//         created_at: faker.date.past(),
//         created_by: 1,
//         updated_at: faker.date.recent(),
//       },
//     })
//   }

//   // Gather all account IDs (parents + children)
//   const allAccountIds = [...parentAccounts, ...childAccounts].map(
//     (acc) => acc.account_id
//   )
//   // 3. Create 20 customer-level users (customer_id: 1)
//   // One SuperAdmin
//   await prisma.user.create({
//     data: {
//       customer_id: 1,
//       user_role_id: superAdminRole.user_role_id,
//       assigned_account_ids: allAccountIds,
//       first_name: faker.person.firstName(),
//       last_name: faker.person.lastName(),
//       email: faker.internet.email(),
//       phone_number: faker.phone.number(),
//       designation: "SuperAdmin",
//       avatar: faker.image.avatar(),
//       auth_0_reference_id: faker.string.uuid(),
//       auth0_role_id: superAdminRole.auth0_role_id,
//       status: "Active",
//       is_customer_user: true,
//       first_active: faker.date.past(),
//       last_active: faker.date.recent(),
//       created_at: faker.date.past(),
//       created_by: 1,
//       updated_at: faker.date.recent(),
//     },
//   })

//   const nonSuperAdminRoles = [accountAdminRole, accountUserRole]
//   // 19 users: randomly AccountAdmin or AccountUser
//   const userRoles = [accountAdminRole, accountUserRole]
//   for (let i = 0; i < 19; i++) {
//     // const randomRole = faker.helpers.arrayElement(userRoles)
//     const randomRole = faker.helpers.arrayElement(nonSuperAdminRoles)
//     const assignedAccounts = getRandomSubset(allAccountIds, 5, 10)
//     await prisma.user.create({
//       data: {
//         customer_id: 1,
//         user_role_id: randomRole.user_role_id,
//         assigned_account_ids: assignedAccounts,
//         first_name: faker.person.firstName(),
//         last_name: faker.person.lastName(),
//         email: faker.internet.email(),
//         phone_number: faker.phone.number(),
//         designation: randomRole.name,
//         avatar: faker.image.avatar(),
//         auth_0_reference_id: faker.string.uuid(),
//         auth0_role_id: randomRole.auth0_role_id,
//         status: "Active",
//         is_customer_user: true,
//         first_active: faker.date.past(),
//         last_active: faker.date.recent(),
//         created_at: faker.date.past(),
//         created_by: 1,
//         updated_at: faker.date.recent(),
//       },
//     })
//   }

//   console.log(
//     `Seeding complete: Created ${
//       globalEquipCounter - 1
//     } equipment records distributed across ${numAllAccounts} accounts and 20 equipment types.`
//   )
// }

// main()
//   .catch((e) => {
//     console.error("Error during seeding:", e)
//     process.exit(1)
//   })
//   .finally(async () => {
//     await prisma.$disconnect()
//   })

import { PrismaClient } from "@prisma/client"
const prisma = new PrismaClient()
import { faker } from "@faker-js/faker"

// Helper function to generate random coordinates within a range
function getRandomInRange(min: number, max: number, decimals: number) {
  const factor = Math.pow(10, decimals)
  return Math.floor((Math.random() * (max - min) + min) * factor) / factor
}

// Helper function to generate random integers
function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

const roles = [
  { name: "SuperAdmin", description: "Super Administrator" },
  { name: "TenAdmin", description: "Tenant Administrator" },
  { name: "AccountAdmin", description: "Account Administrator" },
  { name: "AccountUser", description: "Account User" },
]

function getRandomSubset<T>(array: T[], min: number, max: number): T[] {
  const count = Math.floor(Math.random() * (max - min + 1)) + min
  const shuffled = array.sort(() => 0.5 - Math.random())
  return shuffled.slice(0, count)
}

async function main() {
  // return
  // Add these before creating preventive maintenance events

  await prisma.simple_field_lookup.createMany({
    data: [
      {
        field_name: "Preventive Maintenance Status",
        field_code: "SCHEDULED",
        short_description: "Scheduled",
        long_description: "Preventive maintenance is scheduled",
        status: "A",
      },
      {
        field_name: "Preventive Maintenance Status",
        field_code: "COMPLETED",
        short_description: "Completed",
        long_description: "Preventive maintenance is completed",
        status: "A",
      },
      {
        field_name: "Preventive Maintenance Status",
        field_code: "OVERDUE",
        short_description: "Overdue",
        long_description: "Preventive maintenance is overdue",
        status: "A",
      },
      {
        field_name: "Preventive Maintenance Status",
        field_code: "CANCELLED",
        short_description: "Cancelled",
        long_description: "Preventive maintenance is cancelled",
        status: "A",
      },
    ],
    skipDuplicates: true,
  })
  await prisma.simple_field_lookup.createMany({
    data: [
      // Motion status values
      {
        field_name: "Motion Status",
        field_code: "MOVING",
        short_description: "Moving",
        long_description: "Equipment is currently moving",
        status: "A",
      },
      {
        field_name: "Motion Status",
        field_code: "STOPPED",
        short_description: "Stopped",
        long_description: "Equipment is currently stopped",
        status: "A",
      },
      {
        field_name: "Motion Status",
        field_code: "IDLE",
        short_description: "Idle",
        long_description: "Equipment is idle",
        status: "A",
      },

      // Alarm status values

      {
        field_name: "Alarm Status",
        field_code: "TRIGGERED",
        short_description: "Triggered",
        long_description: "Alarm has been triggered",
        status: "A",
      },
      {
        field_name: "Alarm Status",
        field_code: "ACKNOWLEDGED",
        short_description: "Acknowledged",
        long_description: "Alarm has been acknowledged",
        status: "A",
      },

      {
        field_name: "equipment_load_status",
        field_code: "LOADED",
        short_description: "LOADED",
        long_description: "Equipment has been loaded",
        status: "A",
      },
      {
        field_name: "equipment_load_status",
        field_code: "UNLOADED",
        short_description: "UNLOADED",
        long_description: "Equipment has been UNLOADED",
        status: "A",
      },
    ],
    skipDuplicates: true,
  })

  // --- Seed statuses ---
  await prisma.simple_field_lookup.upsert({
    where: { field_code: "ACTIVE" },
    update: {},
    create: {
      field_name: "Status",
      field_code: "ACTIVE",
      short_description: "Active",
      long_description: "Active status",
      status: "A",
    },
  })
  await prisma.simple_field_lookup.upsert({
    where: { field_code: "INACTIVE" },
    update: {},
    create: {
      field_name: "Status",
      field_code: "INACTIVE",
      short_description: "Inactive",
      long_description: "Inactive status",
      status: "A",
    },
  })
  console.log("Seeded status lookups.")

  // --- Seed assignment reasons ---
  await prisma.simple_field_lookup.upsert({
    where: { field_code: "O" },
    update: {},
    create: {
      field_name: "Assignment Reason",
      field_code: "O",
      short_description: "Outbound",
      long_description: "Outbound assignment",
      status: "A",
    },
  })
  await prisma.simple_field_lookup.upsert({
    where: { field_code: "I" },
    update: {},
    create: {
      field_name: "Assignment Reason",
      field_code: "I",
      short_description: "Inbound",
      long_description: "Inbound assignment",
      status: "A",
    },
  })
  console.log("Seeded assignment reasons.")

  // --- Seed country ---
  const country = await prisma.country_lookup.upsert({
    where: { country_code: "US" },
    update: {},
    create: {
      country_code: "US",
      country_name: "United States",
      status: "ACTIVE",
    },
  })
  console.log(`Seeded country: ${country.country_name}`)

  // --- Seed 20 equipment types ---
  const equipmentTypesData = Array.from({ length: 20 }, (_, i) => ({
    equipment_type: `TYPE${i + 1}`,
    equipment_description: `Equipment Type ${i + 1}`,
    equipment_name: `EquipType ${i + 1}`,
  }))
  const equipmentTypes = []
  for (const et of equipmentTypesData) {
    const createdType = await prisma.equipment_type_lookup.upsert({
      where: { equipment_type: et.equipment_type },
      update: {},
      create: et,
    })
    equipmentTypes.push(createdType)
  }
  console.log(`Seeded ${equipmentTypes.length} equipment types.`)

  // --- Seed OEM lookup ---
  const oem = await prisma.oem_lookup.upsert({
    where: { manufacturer_code: "WABASH" },
    update: {},
    create: {
      manufacturer_code: "WABASH",
      manufacturer_name: "Wabash National",
    },
  })
  console.log(`Seeded OEM manufacturer: ${oem.manufacturer_name}`)

  // --- Seed OEM make/model ---
  const oemModel = await prisma.oem_make_model_lookup.upsert({
    where: { oem_make_model_lookup_id: 1 },
    update: {},
    create: {
      oem_lookup_id: oem.oem_lookup_id,
      make: "Wabash",
      model: "DuraPlate",
      year: "2023",
    },
  })
  console.log(
    `Seeded OEM make/model: ${oemModel.make} ${oemModel.model} ${oemModel.year}`
  )

  // --- Seed UOM ---
  const uom = await prisma.uom_lookup.upsert({
    where: { uom_lookup_id: 1 },
    update: {},
    create: {
      uom_type: "MILE",
      description: "Miles",
    },
  })
  console.log(`Seeded UOM: ${uom.uom_type}`)

  // --- Seed customer ---
  const customer = await prisma.customer.upsert({
    where: { customer_id: 1 },
    update: {},
    create: {
      customer_name: "Acme Logistics",
      customer_class: "NATIONAL",
      status: "ACTIVE",
      reference_number: "ACME001",
    },
  })
  console.log(`Seeded customer: ${customer.customer_name}`)

  // --- Seed parent accounts ---
  const parentAccounts = []
  for (let i = 1; i <= 5; i++) {
    const parentAcc = await prisma.account.create({
      data: {
        customer_id: customer.customer_id,
        account_name: `Parent ${i}`,
        account_number: `ACME-P${i}`,
        account_type: "REGIONAL",
        status: "ACTIVE",
        country_lookup_id: country.country_lookup_id,
        is_deleted: false,
      },
    })
    parentAccounts.push(parentAcc)
    console.log(`Created Parent Account: ${parentAcc.account_name}`)
  }

  // --- Seed child accounts (4 per parent) ---
  const childAccounts = []
  let childAccountId = 1
  for (const parent of parentAccounts) {
    for (let j = 1; j <= 4; j++) {
      const childAcc = await prisma.account.create({
        data: {
          customer_id: customer.customer_id,
          account_name: `Child ${childAccountId} of ${parent.account_name}`,
          account_number: `ACME-C${childAccountId}`,
          account_type: "NATIONAL",
          status: "ACTIVE",
          country_lookup_id: country.country_lookup_id,
          parent_account_id: parent.account_id,
          is_deleted: false,
        },
      })
      childAccounts.push(childAcc)
      console.log(`Created Child Account: ${childAcc.account_name}`)
      childAccountId++
    }
  }

  // --- Seed facility ---
  const facilities = []
  for (let i = 1; i <= 5; i++) {
    const facility = await prisma.facility_lookup.upsert({
      where: { facility_code: `WH${i}` },
      update: {},
      create: {
        facility_code: `WH${i}`,
        facility_name: `Warehouse ${i}`,
        facility_description: `Distribution center ${i}`,
      },
    })
    facilities.push(facility)
    console.log(`Seeded facility: ${facility.facility_name}`)
  }

  // --- Seed contract type ---
  const contractType = await prisma.contract_type_lookup.upsert({
    where: { contract_type_lookup_id: 1 },
    update: {},
    create: {
      description: "Standard Lease",
      frequency: 12,
      billing_method: "MONTHLY",
      status: "ACTIVE",
    },
  })
  console.log(`Seeded contract type: ${contractType.description}`)

  // --- Seed master agreement (attach to first parent account) ---
  const masterAgreement = await prisma.master_agreement.upsert({
    where: { master_agreement_id: 1 },
    update: {},
    create: {
      contract_term_type: "YEAR",
      contract_effective_date: new Date(),
      contract_term: 3,
      contract_billing_method: "MONTHLY",
      status: "ACTIVE",
      contract_end_date: new Date(
        new Date().setFullYear(new Date().getFullYear() + 3)
      ),
      accountAccount_id: parentAccounts[0].account_id,
      customerCustomer_id: customer.customer_id,
    },
  })
  console.log(
    `Seeded master agreement with ID: ${masterAgreement.master_agreement_id}`
  )

  // --- Seed schedule agreement ---
  const scheduleAgreement = await prisma.schedule_agreement.upsert({
    where: { schedule_agreement_id: 1 },
    update: {},
    create: {
      master_agreement_id: masterAgreement.master_agreement_id,
      schedule_type: "A",
      contract_type_lookup_id: contractType.contract_type_lookup_id,
      facility_lookup_id: facilities[0].facility_lookup_id,
      effective_date: new Date(),
      contract_term: 12,
      contract_term_type: "MONTH",
      contract_billing_method: "MONTHLY",
      schedule_agreement_date: new Date(),
      termination_date: new Date(
        new Date().setFullYear(new Date().getFullYear() + 1)
      ),
      status: "ACTIVE",
      early_termination_date: new Date(),
      full_term_months: 12,
      non_cancel_months: 0,
      max_sub_days: 0,
      max_sub_days_duration: 0,
      created_at: new Date(),
      updated_at: new Date(),
    },
  })
  console.log(
    `Seeded schedule agreement with ID: ${scheduleAgreement.schedule_agreement_id}`
  )

  // --- Split 100,000 equipment evenly across equipment types ---
  const totalEquipment = 1000
  const numEquipmentTypes = equipmentTypes.length
  const basePerType = Math.floor(totalEquipment / numEquipmentTypes)
  const remainderPerType = totalEquipment % numEquipmentTypes

  // --- Create line items for each equipment type ---
  const lineItems = []
  for (let t = 0; t < numEquipmentTypes; t++) {
    const type = equipmentTypes[t]
    const units = basePerType + (t < remainderPerType ? 1 : 0)
    const lineItem = await prisma.schedule_agreement_line_item.upsert({
      where: { schedule_agreement_line_item_id: t + 1 },
      update: {},
      create: {
        schedule_agreement_id: scheduleAgreement.schedule_agreement_id,
        equipment_type_lookup_id: type.equipment_type_lookup_id,
        oem_make_model_lookup_id: oemModel.oem_make_model_lookup_id,
        number_of_units: units,
        rate: 1200 + t * 10,
        status: "ACTIVE",
      },
    })
    lineItems.push({ lineItem, units, eqType: type })
    console.log(
      `Created schedule line item ${lineItem.schedule_agreement_line_item_id} for equipment type ${type.equipment_type}`
    )
  }

  // --- Seed IOT device vendor lookup ---
  const iotVendor = await prisma.iot_device_vendor_lookup.upsert({
    where: { iot_device_vendor_lookup_id: 1 },
    update: {},
    create: {
      vendor_name: "Geotab",
      vendor_description: "Geotab GPS devices",
      vendor_method_type: "GPS",
      vendor_service_type: "TRACKING",
      status: "ACTIVE",
    },
  })
  console.log(`Seeded IoT device vendor: ${iotVendor.vendor_name}`)

  // Combine parent and child accounts into one array
  const allAccounts = [...parentAccounts, ...childAccounts]

  const numAllAccounts = allAccounts.length
  let globalEquipCounter = 1

  for (const { lineItem, units, eqType } of lineItems) {
    const basePerAccount = Math.floor(units / numAllAccounts)
    const remainder = units % numAllAccounts

    console.log(
      `Assigning ${units} units of type ${eqType.equipment_type} across ${numAllAccounts} total accounts`
    )

    for (let i = 0; i < numAllAccounts; i++) {
      const acc = allAccounts[i]
      const unitsForAccount = basePerAccount + (i < remainder ? 1 : 0)

      const allocation = await prisma.equipment_type_allocation.create({
        data: {
          schedule_agreement_line_item_id:
            lineItem.schedule_agreement_line_item_id,
          account_id: acc.account_id,
          units_allowed: unitsForAccount,
          units_assigned: unitsForAccount,
          status: "ACTIVE",
          pms_override: false,
          created_at: new Date(),
          created_by: 1,
        },
      })

      console.log(
        `  Account ${acc.account_name} allocation ${allocation.equipment_type_allocation_id}: ${unitsForAccount} units allowed`
      )

      for (let j = 0; j < unitsForAccount; j++) {
        const unitNumber = `TRL-${globalEquipCounter
          .toString()
          .padStart(6, "0")}`

        const equipment = await prisma.equipment.create({
          data: {
            unit_number: unitNumber,
            description: `53ft Dry Van Trailer - ${eqType.equipment_description}`,
            date_in_service: new Date(),
            status: "ACTIVE",
            equipment_type_lookup_id: eqType.equipment_type_lookup_id,
            oem_make_model_lookup_id: oemModel.oem_make_model_lookup_id,
            uom_lookup_id: uom.uom_lookup_id,
            gross_unit_weight: 35000.0,
            trailer_length: "53 ft",
            trailer_width: "8.5 ft",
            assigned_to: acc.account_name,
            assigned_date: new Date(),
            created_at: new Date(),
            created_by: 1,
          },
        })

        const iotDevice = await prisma.iot_device.create({
          data: {
            iot_device_vendor_lookup_id: iotVendor.iot_device_vendor_lookup_id,
            device_id_external: `GT-${unitNumber}`,
            device_type: "GO9",
            status: "ACTIVE",
            created_at: new Date(),
            created_by: 1,
          },
        })

        await prisma.equipment_has_iot_device.create({
          data: {
            equipment_id: equipment.equipment_id,
            iot_device_id: iotDevice.iot_device_id,
            effective_date: new Date(),
            status: "ACTIVE",
            created_at: new Date(),
            created_by: 1,
          },
        })

        const latitude = getRandomInRange(24.396308, 49.384358, 6)
        const longitude = getRandomInRange(-125.0, -66.93457, 6)
        const motionStatuses = ["MOVING", "STOPPED", "IDLE"]
        const alarmStatuses = ["TRIGGERED", "ACKNOWLEDGED"]
        await prisma.current_equipment_gps_location.create({
          data: {
            equipment_id: equipment.equipment_id,
            latitude,
            longitude,
            location: "Random US Location",
            // motion_status: Math.random() > 0.5 ? "MOVING" : "STOPPED",

            motion_status: faker.helpers.arrayElement(motionStatuses),
            alarm_code_status: faker.helpers.arrayElement(alarmStatuses),
            last_gps_update: new Date(),
            created_at: new Date(),
            created_by: 1,
          },
        })

        await prisma.equipment_assignment.create({
          data: {
            equipment_type_allocation_id:
              allocation.equipment_type_allocation_id,
            equipment_id: equipment.equipment_id,
            activation_date: new Date(),
            deactivation_date: new Date(
              new Date().setFullYear(new Date().getFullYear() + 1)
            ),
            action_reason_type: "O",
            driver_name: `Driver ${unitNumber}`,
            is_gps_tracking: true,
            is_substitute_allowed: false,
            created_by: 1,
            created_at: new Date(),
            updated_at: new Date(),
          },
        })

        if (globalEquipCounter % 1000 === 0) {
          console.log(
            `    Created ${globalEquipCounter} equipment records so far...`
          )
        }
        globalEquipCounter++
      }
    }
  }

  // --- Seed preventive maintenance and DOT inspections ---
  console.log("Seeding preventive maintenance and DOT inspections...")

  const accounts = await prisma.account.findMany({
    where: { is_deleted: false },
    select: { account_id: true, account_name: true },
  })

  for (const account of accounts) {
    const assignedEquipments = await prisma.equipment_assignment.findMany({
      where: {
        equipment_type_allocation_ref: {
          account_id: account.account_id,
        },
      },
      select: { equipment_id: true },
    })

    if (!assignedEquipments.length) {
      console.log(
        `⚠ No equipment found for account ${account.account_name}, skipping.`
      )
      continue
    }

    // Only process 2 equipments per account to avoid too much data
    for (const { equipment_id } of assignedEquipments.slice(0, 2)) {
      const scheduleAgreementId = scheduleAgreement.schedule_agreement_id
      const facilityLookupId =
        facilities[randomInt(0, facilities.length - 1)].facility_lookup_id

      // --- Schedule ---
      const pmSchedule = await prisma.preventive_maintenance_schedule.create({
        data: {
          schedule_agreement_id: scheduleAgreementId,
          equipment_id,
          account_id: account.account_id,
          facility_lookup_id: facilityLookupId,
          pm_type: randomInt(0, 1) ? "PM 90" : "PM 180",
          pm_task_description: "Quarterly Brake Inspection",
          frequency_interval: 3,
          frequency_type: "MONTHS",
          status: "ACTIVE",
          comments: "Check brakes and fluid",
          created_by: 1,
        },
      })

      // --- Past completed events ---
      for (let e = 0; e < 2; e++) {
        const performedDate = new Date(2025, 3 + e * 3, randomInt(10, 25))
        const nextDueDate = new Date(performedDate)
        nextDueDate.setMonth(performedDate.getMonth() + 3)

        const pmEvent = await prisma.preventive_maintenance_event.create({
          data: {
            equipment_id,
            pm_schedule_id: pmSchedule.pm_schedule_id,
            account_id: account.account_id,
            performed_date: performedDate,
            next_due_date: nextDueDate,
            work_performed:
              e === 0 ? "Brake Pad Inspection" : "Brake Pad Replacement",
            location: `Facility ${facilityLookupId}`,
            vendor_technician: e === 0 ? "John Doe" : "Jane Smith",
            time_taken: randomInt(60, 120),
            warranty_status: e === 0 ? "OEM Warranty" : "Out of Warranty",
            after_hours: e % 2 === 1,
            notes: e === 0 ? "Brakes OK, pads 70%" : "Pads replaced",
            status: "COMPLETED",
            created_by: 1,
          },
        })

        await prisma.pm_parts_used.createMany({
          data: [
            {
              pm_event_id: pmEvent.pm_event_id,
              part_name: "Brake Pad Set",
              part_quantity: 1,
              part_cost: 120.0,
              created_by: 1,
            },
            {
              pm_event_id: pmEvent.pm_event_id,
              part_name: "Brake Fluid",
              part_quantity: 1,
              part_cost: 15.5,
              created_by: 1,
            },
          ],
        })
      }

      // --- Future scheduled events ---
      for (let f = 1; f <= 2; f++) {
        const performedDate = new Date()
        performedDate.setMonth(performedDate.getMonth() + f * 3) // 3 or 6 months ahead

        const nextDueDate = new Date(performedDate)
        nextDueDate.setMonth(nextDueDate.getMonth() + 3)

        await prisma.preventive_maintenance_event.create({
          data: {
            equipment_id,
            pm_schedule_id: pmSchedule.pm_schedule_id,
            account_id: account.account_id,
            performed_date: performedDate,
            next_due_date: nextDueDate,
            work_performed: "Brake Inspection (Planned)",
            location: `Facility ${facilityLookupId}`,
            vendor_technician: "Scheduled Tech",
            time_taken: null, // Not done yet
            warranty_status: null,
            after_hours: false,
            notes: "Planned future event",
            status: "SCHEDULED",
            created_by: 1,
          },
        })
      }

      // --- DOT Inspection ---
      const inspection = await prisma.dot_inspection.create({
        data: {
          equipment_id,
          account_id: account.account_id,
          schedule_agreement_id: scheduleAgreementId,
          inspection_date: new Date("2025-08-20"),
          inspector_name: "DOT Officer Smith",
          inspection_result: randomInt(0, 1) ? "PASS" : "FAIL",
          notes: "Routine check",
          next_inspection_due: new Date("2025-12-20"),
          created_by: 1,
        },
      })

      if (inspection.inspection_result === "FAIL") {
        await prisma.dot_inspection_violation.create({
          data: {
            dot_inspection_id: inspection.dot_inspection_id,
            violation_code: "BRAKE01",
            description: "Brake wear over legal limit.",
            severity_level: "MAJOR",
            corrective_action_taken: "Replaced pads & rotors",
            created_by: 1,
          },
        })
      }
    }
  }

  // 1. Create roles
  // Tenant role (customer_id: null)
  const tenAdminRole = await prisma.user_role.upsert({
    where: { customer_id_name: { customer_id: 0, name: "TenAdmin" } },
    update: {},
    create: {
      name: "TenAdmin",
      description: "Tenant Administrator",
      customer_id: null as any,
      auth0_role_id: faker.string.uuid(),
      auth0_role_name: "TenAdmin_role",
    },
  })

  // Customer-level roles (customer_id: 1)
  const superAdminRole = await prisma.user_role.upsert({
    where: { customer_id_name: { customer_id: 1, name: "SuperAdmin" } },
    update: {},
    create: {
      name: "SuperAdmin",
      description: "Super Administrator",
      customer_id: 1,
      auth0_role_id: faker.string.uuid(),
      auth0_role_name: "SuperAdmin_role",
    },
  })
  const accountAdminRole = await prisma.user_role.upsert({
    where: { customer_id_name: { customer_id: 1, name: "AccountAdmin" } },
    update: {},
    create: {
      name: "AccountAdmin",
      description: "Account Administrator",
      customer_id: 1,
      auth0_role_id: faker.string.uuid(),
      auth0_role_name: "AccountAdmin_role",
    },
  })
  const accountUserRole = await prisma.user_role.upsert({
    where: { customer_id_name: { customer_id: 1, name: "AccountUser" } },
    update: {},
    create: {
      name: "AccountUser",
      description: "Account User",
      customer_id: 1,
      auth0_role_id: faker.string.uuid(),
      auth0_role_name: "AccountUser_role",
    },
  })

  // 2. Create 20 tenant-level users (all TenAdmin)
  for (let i = 0; i < 20; i++) {
    await prisma.user.create({
      data: {
        customer_id: null,
        user_role_id: tenAdminRole.user_role_id,
        assigned_account_ids: [],
        first_name: faker.person.firstName(),
        last_name: faker.person.lastName(),
        email: faker.internet.email(),
        phone_number: faker.phone.number(),
        designation: "TenAdmin",
        avatar: faker.image.avatar(),
        auth_0_reference_id: faker.string.uuid(),
        auth0_role_id: tenAdminRole.auth0_role_id,
        status: "ACTIVE",
        is_customer_user: false,
        first_active: faker.date.past(),
        last_active: faker.date.recent(),
        created_at: faker.date.past(),
        created_by: 1,
        updated_at: faker.date.recent(),
      },
    })
  }

  // Gather all account IDs (parents + children)
  const allAccountIds = [...parentAccounts, ...childAccounts].map(
    (acc) => acc.account_id
  )
  // 3. Create 20 customer-level users (customer_id: 1)
  // One SuperAdmin
  await prisma.user.create({
    data: {
      customer_id: 1,
      user_role_id: superAdminRole.user_role_id,
      assigned_account_ids: allAccountIds,
      first_name: faker.person.firstName(),
      last_name: faker.person.lastName(),
      email: faker.internet.email(),
      phone_number: faker.phone.number(),
      designation: "SuperAdmin",
      avatar: faker.image.avatar(),
      auth_0_reference_id: faker.string.uuid(),
      auth0_role_id: superAdminRole.auth0_role_id,
      status: "ACTIVE",
      is_customer_user: true,
      first_active: faker.date.past(),
      last_active: faker.date.recent(),
      created_at: faker.date.past(),
      created_by: 1,
      updated_at: faker.date.recent(),
    },
  })

  await prisma.user_column_preferences.createMany({
    data: [
      {
        user_id: 1,
        table_name: "users",
        selected_columns: [
          "user_id",
          "first_name",
          "last_name",
          "email",
          "phone_number",
          "status",
          "user_role_ref.name",
        ],
      },
    ],
    skipDuplicates: true,
  })

  const nonSuperAdminRoles = [accountAdminRole, accountUserRole]
  // 19 users: randomly AccountAdmin or AccountUser
  const userRoles = [accountAdminRole, accountUserRole]
  for (let i = 0; i < 19; i++) {
    const randomRole = faker.helpers.arrayElement(nonSuperAdminRoles)
    const assignedAccounts = getRandomSubset(allAccountIds, 5, 10)
    await prisma.user.create({
      data: {
        customer_id: 1,
        user_role_id: randomRole.user_role_id,
        assigned_account_ids: assignedAccounts,
        first_name: faker.person.firstName(),
        last_name: faker.person.lastName(),
        email: faker.internet.email(),
        phone_number: faker.phone.number(),
        designation: randomRole.name,
        avatar: faker.image.avatar(),
        auth_0_reference_id: faker.string.uuid(),
        auth0_role_id: randomRole.auth0_role_id,
        status: "ACTIVE",
        is_customer_user: true,
        first_active: faker.date.past(),
        last_active: faker.date.recent(),
        created_at: faker.date.past(),
        created_by: 1,
        updated_at: faker.date.recent(),
      },
    })
  }

  console.log(
    `Seeding complete: Created ${
      globalEquipCounter - 1
    } equipment records distributed across ${numAllAccounts} accounts and 20 equipment types.`
  )
}

main()
  .catch((e) => {
    console.error("Error during seeding:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
