// // src/swagger.ts
// import swaggerAutogen from "swagger-autogen"
// import path from "path"

// const doc = {
//   info: {
//     title: "Accounts Users API",
//     description: "API documentation for Accounts_Users service",
//     version: "1.0.0",
//   },
//   host: "localhost:9330",
//   schemes: ["http"],
//   consumes: ["application/json"],
//   produces: ["application/json"],
//   tags: [{ name: "Auth", description: "Authentication endpoints" }],
//   securityDefinitions: {
//     bearerAuth: {
//       type: "apiKey",
//       in: "header",
//       name: "Authorization",
//       description: "Enter JWT Bearer token **_only_**",
//     },
//   },
//   definitions: {
//     LoginRequest: {
//       auth_0_reference_id: "auth0|user123456",
//     },
//     LoginResponse: {
//       user: {
//         user_id: "string",
//         first_name: "string",
//         last_name: "string",
//         email: "string",
//         phone_number: "string",
//         status: "string",
//         user_role_id: "string",
//         auth_0_reference_id: "string",
//         customer_id: "string",
//         assigned_account_ids: [],
//         role: "string",
//       },
//       token: "jwt-token",
//     },
//     ErrorResponse: {
//       message: "string",
//       error: "string",
//     },
//   },
// }

// const outputFile = path.resolve(__dirname, "swagger-output.json")
// const endpointsFiles = [path.resolve(__dirname, "app.ts")]

// console.log("Generating swagger documentation...")
// console.log("Output file:", outputFile)
// console.log("Scanning files:", endpointsFiles)

// // Use Swagger 2.0 instead of OpenAPI 3.0 for better compatibility
// swaggerAutogen()(outputFile, endpointsFiles, doc)
//   .then(() => {
//     console.log("✅ Swagger documentation generated successfully!")
//   })
//   .catch((err) => {
//     console.error("❌ Error generating swagger documentation:", err)
//   })

// src/swagger.ts
import swaggerJsdoc from "swagger-jsdoc"
import swaggerUi from "swagger-ui-express"
import { Express } from "express"

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Accounts Users API",
      version: "1.0.0",
      description: "API documentation for Accounts_Users service",
    },
    servers: [
      {
        url: "http://localhost:9330",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
      schemas: {
        LoginRequest: {
          type: "object",
          required: ["auth_0_reference_id"],
          properties: {
            auth_0_reference_id: {
              type: "string",
              example: "auth0|user123456",
            },
          },
        },
        LoginResponse: {
          type: "object",
          properties: {
            user: {
              type: "object",
              properties: {
                user_id: { type: "string" },
                first_name: { type: "string" },
                last_name: { type: "string" },
                email: { type: "string" },
                phone_number: { type: "string" },
                status: { type: "string" },
                user_role_id: { type: "string" },
                auth_0_reference_id: { type: "string" },
                customer_id: { type: "string" },
                assigned_account_ids: {
                  type: "array",
                  items: { type: "string" },
                },
                role: { type: "string" },
              },
            },
            token: { type: "string" },
          },
        },
        ErrorResponse: {
          type: "object",
          properties: {
            message: { type: "string" },
            error: { type: "string" },
          },
        },
      },
    },
  },
  apis: ["./src/routes/*.ts"], // Path to route files
}

const specs = swaggerJsdoc(options)

export const setupSwagger = (app: Express) => {
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(specs))
  // console.log("📚 Swagger UI available at: http://localhost:9330/api-docs")
}

export default specs
