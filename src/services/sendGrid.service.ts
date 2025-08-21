// import sgMail, { MailDataRequired } from "@sendgrid/mail"

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

import sgMail, { MailDataRequired } from "@sendgrid/mail"
import ejs from "ejs"
import path from "path"
import fs from "fs"

// Set API key
if (!process.env.SENDGRID_API_KEY) {
  throw new Error("SENDGRID_API_KEY is not defined in environment variables")
}
sgMail.setApiKey(process.env.SENDGRID_API_KEY)

export const sendWelcomeEmail = async (
  to: string,
  data: {
    name: string
    // organization: string
    Temporary_Password: string
    to: string
  }
) => {
  if (!process.env.SENDGRID_FROM_EMAIL) {
    throw new Error(
      "SENDGRID_FROM_EMAIL is not defined in environment variables"
    )
  }

  try {
    // 1. Load your EJS template file
    const templatePath = path.join(
      __dirname,
      "../views/emails/auth0welcome.ejs"
    )
    const template = fs.readFileSync(templatePath, "utf-8")

    // 2. Render the template with dynamic data
    const htmlContent = ejs.render(template, {
      data,
      process: {
        env: {
          LOGO_URL: process.env.LOGO_URL,
          FRONTEND_URL: process.env.FRONTEND_URL,
        },
      },
    })

    // 3. Send the email
    const msg: MailDataRequired = {
      to,
      from: process.env.SENDGRID_FROM_EMAIL,
      subject: "Welcome to Believ AI 🎉",
      html: htmlContent,
    }

    await sgMail.send(msg)
    console.log("✅ Welcome email sent to", to)
  } catch (error: any) {
    console.error("❌ SendGrid error:", error)

    if (error.response) {
      console.error("SendGrid response error:", error.response.body)
    }
  }
}
