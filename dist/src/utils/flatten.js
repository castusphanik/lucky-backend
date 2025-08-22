"use strict";
// // utils/flatten.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.flattenObject = flattenObject;
// /**
//  * Recursively flattens nested objects into a single-level object.
//  * Nested keys are joined by the separator (default: '_').
//  *
//  * @param obj - The object to flatten
//  * @param prefix - The prefix for keys (used internally during recursion)
//  * @param separator - The string to join nested keys (default '_')
//  * @returns Flattened object with keys like 'account_account_name', etc.
//  */
// export function flattenObject(
//   obj: Record<string, any>,
//   prefix = "",
//   separator = "_"
// ): Record<string, any> {
//   let flattened: Record<string, any> = {}
//   for (const [key, value] of Object.entries(obj)) {
//     const newKey = prefix ? `${prefix}${separator}${key}` : key
//     if (value && typeof value === "object" && !Array.isArray(value)) {
//       // Recurse for nested objects
//       Object.assign(flattened, flattenObject(value, newKey, separator))
//     } else {
//       // Assign primitive or array values directly
//       flattened[newKey] = value
//     }
//   }
//   return flattened
// }
function flattenObject(obj, prefix = "", separator = "_") {
    let flattened = {};
    for (const [key, value] of Object.entries(obj)) {
        const newKey = prefix ? `${prefix}${separator}${key}` : key;
        if (value &&
            typeof value === "object" &&
            !Array.isArray(value) &&
            !(value instanceof Date) // ⛔ do NOT recurse into Date
        ) {
            Object.assign(flattened, flattenObject(value, newKey, separator));
        }
        else {
            flattened[newKey] = value instanceof Date ? value.toISOString() : value; // ✅ Preserve date as string
        }
    }
    return flattened;
}
