import nodemailer from "nodemailer"
import type { NotificationType, NotificationPriority } from "@prisma/client"
import { generateNotificationTemplate } from "./templates/notification-template"
import {
  generatePasswordResetTemplate,
  generateWelcomeTemplate,
  generateEmailVerificationTemplate,
} from "./templates/auth-templates"

export interface EmailConfig {
  host: string
  port: number
  secure: boolean
  auth: {
    user: string
    pass: string
  }
}

export interface EmailOptions {
  to: string | string[]
  subject: string
  html: string
  text?: string
  attachments?: Array<{
    filename: string
    content: Buffer | string
    contentType?: string
  }>
}

export interface NotificationEmailData {
  type: NotificationType
  priority: NotificationPriority
  title: string
  message: string
  data?: any
  actionUrl?: string
}

class EmailService {
  private transporter: nodemailer.Transporter | null = null
  private isConfigured = false

  constructor() {
    this.initialize()
  }

  private initialize() {
    try {
      const config: EmailConfig = {
        host: process.env.SMTP_HOST || "smtp.gmail.com",
        port: Number.parseInt(process.env.SMTP_PORT || "587"),
        secure: process.env.SMTP_SECURE === "true",
        auth: {
          user: process.env.SMTP_USER || "",
          pass: process.env.SMTP_PASS || "",
        },
      }

      if (!config.auth.user || !config.auth.pass) {
        console.warn("Email service not configured: Missing SMTP credentials")
        return
      }

      this.transporter = nodemailer.createTransport(config)
      this.isConfigured = true

      // Verify connection
      this.transporter.verify((error, success) => {
        if (error) {
          console.error("Email service connection failed:", error)
          this.isConfigured = false
        } else {
          console.log("Email service ready")
        }
      })
    } catch (error) {
      console.error("Failed to initialize email service:", error)
    }
  }

  async sendEmail(options: EmailOptions): Promise<boolean> {
    if (!this.isConfigured || !this.transporter) {
      console.warn("Email service not configured, skipping email send")
      return false
    }

    try {
      const mailOptions = {
        from: `"AmbuSupply" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
        to: Array.isArray(options.to) ? options.to.join(", ") : options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
        attachments: options.attachments,
      }

      const result = await this.transporter.sendMail(mailOptions)
      console.log("Email sent successfully:", result.messageId)
      return true
    } catch (error) {
      console.error("Failed to send email:", error)
      return false
    }
  }

  async sendNotificationEmail(to: string | string[], data: NotificationEmailData): Promise<boolean> {
    const html = generateNotificationTemplate(data)
    const text = this.generatePlainTextFromNotification(data)

    return this.sendEmail({
      to,
      subject: `[AmbuSupply] ${data.title}`,
      html,
      text,
    })
  }

  async sendPasswordResetEmail(to: string, resetToken: string, userName: string): Promise<boolean> {
    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/reset-password?token=${resetToken}`
    const html = generatePasswordResetTemplate(userName, resetUrl)
    const text = `Hi ${userName},\n\nYou requested a password reset for your AmbuSupply account.\n\nClick the link below to reset your password:\n${resetUrl}\n\nThis link will expire in 1 hour.\n\nIf you didn't request this, please ignore this email.\n\nBest regards,\nAmbuSupply Team`

    return this.sendEmail({
      to,
      subject: "[AmbuSupply] Password Reset Request",
      html,
      text,
    })
  }

  async sendWelcomeEmail(to: string, userName: string): Promise<boolean> {
    const html = generateWelcomeTemplate(userName)
    const text = `Welcome to AmbuSupply, ${userName}!\n\nYour account has been created successfully. You can now access all features of the AmbuSupply platform.\n\nGet started by logging in at: ${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}\n\nBest regards,\nAmbuSupply Team`

    return this.sendEmail({
      to,
      subject: "[AmbuSupply] Welcome to AmbuSupply",
      html,
      text,
    })
  }

  async sendEmailVerification(to: string, verificationToken: string, userName: string): Promise<boolean> {
    const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/verify-email?token=${verificationToken}`
    const html = generateEmailVerificationTemplate(userName, verificationUrl)
    const text = `Hi ${userName},\n\nPlease verify your email address by clicking the link below:\n${verificationUrl}\n\nThis link will expire in 24 hours.\n\nIf you didn't create an account, please ignore this email.\n\nBest regards,\nAmbuSupply Team`

    return this.sendEmail({
      to,
      subject: "[AmbuSupply] Verify Your Email Address",
      html,
      text,
    })
  }

  private generatePlainTextFromNotification(data: NotificationEmailData): string {
    const typeIcons = {
      INFO: "ℹ️",
      WARNING: "⚠️",
      ERROR: "❌",
      SUCCESS: "✅",
    }

    let text = `${typeIcons[data.type]} ${data.title}\n\n${data.message}\n\nPriority: ${data.priority}\nType: ${data.type}\nTime: ${new Date().toLocaleString()}\n\n`

    if (data.data) {
      text += "Additional Details:\n"
      Object.entries(data.data).forEach(([key, value]) => {
        text += `${key}: ${value}\n`
      })
      text += "\n"
    }

    if (data.actionUrl) {
      text += `View in AmbuSupply: ${data.actionUrl}\n\n`
    }

    text += "This email was sent by AmbuSupply."

    return text
  }

  isReady(): boolean {
    return this.isConfigured
  }
}

export const emailService = new EmailService()
