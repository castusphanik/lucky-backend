import prisma from "../config/database.config" // Adjust path as needed

// Get user's saved column preferences for a particular table
export const getUserColumnPreferences = async (
  userId: number,
  tableName: string
): Promise<string[] | null> => {
  const pref = await prisma.user_column_preferences.findUnique({
    where: {
      user_id_table_name: {
        user_id: userId,
        table_name: tableName,
      },
    },
    select: { selected_columns: true },
  })
  return pref ? (pref.selected_columns as string[]) : null
}

// Build Prisma select object dynamically based on column names
export const buildPrismaSelect = (columns: string[]): Record<string, any> => {
  const select: Record<string, any> = {}
  for (const col of columns) {
    if (col.includes(".")) {
      // Handle relation (e.g., "user_role_ref.name")
      const [relation, field] = col.split(".")
      if (!select[relation]) select[relation] = { select: {} }
      select[relation].select[field] = true
    } else {
      select[col] = true
    }
  }
  return select
}

// Default columns for your tables
export const getDefaultColumns = (tableName: string): string[] => {
  if (tableName === "users") {
    return [
      "user_id",
      "first_name",
      // "last_name",
      // "email",
      // "status",
      // "user_role_ref.name",
    ]
  }
  // Add any other tables here
  return []
}
