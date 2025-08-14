import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import { db } from "@/lib/db"

// User type from Prisma
interface User {
  id: string
  email: string
  password: string
  firstName: string
  lastName: string
  role: string
  organizationId: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
  organization?: any
}

const JWT_SECRET = process.env.JWT_SECRET || "fallback-secret-key"
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d"

export interface JWTPayload {
  userId: string
  email: string
  role: string
  organizationId: string
}

export class AuthError extends Error {
  constructor(
    message: string,
    public code: string,
  ) {
    super(message)
    this.name = "AuthError"
  }
}

export const authUtils = {
  // Hash password
  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 12)
  },

  // Verify password
  async verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword)
  },

  // Generate JWT tokens
  generateTokens(payload: JWTPayload) {
    const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN })
    const refreshToken = jwt.sign(payload, JWT_SECRET, { expiresIn: "30d" })

    return {
      accessToken,
      refreshToken,
      expiresIn: 7 * 24 * 60 * 60, // 7 days in seconds
    }
  },

  // Verify JWT token
  verifyToken(token: string): JWTPayload {
    try {
      return jwt.verify(token, JWT_SECRET) as JWTPayload
    } catch (error) {
      throw new AuthError("Invalid or expired token", "INVALID_TOKEN")
    }
  },

  // Get user by email
  async getUserByEmail(email: string): Promise<User | null> {
    return db.user.findUnique({
      where: { email },
      include: {
        organization: true,
      },
    })
  },

  // Get user by ID
  async getUserById(id: string): Promise<User | null> {
    return db.user.findUnique({
      where: { id },
      include: {
        organization: true,
      },
    })
  },

  // Authenticate user
  async authenticateUser(email: string, password: string) {
    const user = await this.getUserByEmail(email)

    if (!user) {
      throw new AuthError("Invalid email or password", "INVALID_CREDENTIALS")
    }

    if (!user.isActive) {
      throw new AuthError("Account is deactivated", "ACCOUNT_DEACTIVATED")
    }

    const isValidPassword = await this.verifyPassword(password, user.password)

    if (!isValidPassword) {
      throw new AuthError("Invalid email or password", "INVALID_CREDENTIALS")
    }

    const payload: JWTPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      organizationId: user.organizationId,
    }

    const tokens = this.generateTokens(payload)

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        organizationId: user.organizationId,
        organization: user.organization,
      },
      tokens,
    }
  },

  // Create new user
  async createUser(userData: {
    email: string
    password: string
    firstName: string
    lastName: string
    role?: string
    organizationId: string
  }) {
    const hashedPassword = await this.hashPassword(userData.password)

    return db.user.create({
      data: {
        email: userData.email,
        password: hashedPassword,
        firstName: userData.firstName,
        lastName: userData.lastName,
        role: userData.role || "USER",
        organizationId: userData.organizationId,
      },
      include: {
        organization: true,
      },
    })
  },
}
