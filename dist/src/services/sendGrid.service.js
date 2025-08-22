"use strict";
// import sgMail, { MailDataRequired } from "@sendgrid/mail"
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendWelcomeEmail = void 0;
// // Set API key
// if (!process.env.SENDGRID_API_KEY) {
//   throw new Error("SENDGRID_API_KEY is not defined in environment variables")
// }
// sgMail.setApiKey(process.env.SENDGRID_API_KEY)
// export const sendWelcomeEmail = async (to: string) => {
//   if (!process.env.SENDGRID_FROM_EMAIL) {
//     throw new Error(
//       "SENDGRID_FROM_EMAIL is not defined in environment variables"
//     )
//   }
//   const msg: MailDataRequired = {
//     to,
//     from: process.env.SENDGRID_FROM_EMAIL,
//     subject: "Welcome to our platform 🎉",
//     text: "We’re excited to have you on board!",
//     html: "<strong>We’re excited to have you on board!</strong>",
//   }
//   try {
//     await sgMail.send(msg)
//     console.log("✅ Welcome email sent to", to)
//   } catch (error: any) {
//     console.error("❌ SendGrid error:", error)
//     if (error.response) {
//       console.error("SendGrid response error:", error.response.body)
//     }
//   }
// }
const mail_1 = __importDefault(require("@sendgrid/mail"));
const ejs_1 = __importDefault(require("ejs"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
// Set API key
if (!process.env.SENDGRID_API_KEY) {
    throw new Error("SENDGRID_API_KEY is not defined in environment variables");
}
mail_1.default.setApiKey(process.env.SENDGRID_API_KEY);
const sendWelcomeEmail = async (to, data) => {
    if (!process.env.SENDGRID_FROM_EMAIL) {
        throw new Error("SENDGRID_FROM_EMAIL is not defined in environment variables");
    }
    try {
        // 1. Load your EJS template file
        const templatePath = path_1.default.join(__dirname, "../views/emails/auth0welcome.ejs");
        const template = fs_1.default.readFileSync(templatePath, "utf-8");
        // 2. Render the template with dynamic data
        const htmlContent = ejs_1.default.render(template, {
            data,
            process: {
                env: {
                    LOGO_URL: process.env.LOGO_URL,
                    FRONTEND_URL: process.env.FRONTEND_URL,
                },
            },
        });
        // 3. Send the email
        const msg = {
            to,
            from: process.env.SENDGRID_FROM_EMAIL,
            subject: "Welcome to Believ AI 🎉",
            html: htmlContent,
        };
        await mail_1.default.send(msg);
        console.log("✅ Welcome email sent to", to);
    }
    catch (error) {
        console.error("❌ SendGrid error:", error);
        if (error.response) {
            console.error("SendGrid response error:", error.response.body);
        }
    }
};
exports.sendWelcomeEmail = sendWelcomeEmail;
