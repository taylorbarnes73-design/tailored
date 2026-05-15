import { bigint, int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * User files table for tracking uploaded files stored in S3.
 * Stores metadata about each file — the actual bytes live in S3.
 */
export const userFiles = mysqlTable("user_files", {
  id: int("id").autoincrement().primaryKey(),
  /** Foreign key to the users table */
  userId: int("userId").notNull(),
  /** S3 object key for retrieving/deleting the file */
  fileKey: varchar("fileKey", { length: 512 }).notNull(),
  /** Public CDN URL returned by storagePut */
  url: text("url").notNull(),
  /** Original filename as uploaded by the user */
  filename: varchar("filename", { length: 255 }).notNull(),
  /** MIME type of the file (e.g., image/png, application/pdf) */
  mimeType: varchar("mimeType", { length: 128 }).notNull(),
  /** File size in bytes */
  size: bigint("size", { mode: "number" }).notNull(),
  /** Category for organizing files: body-scan, profile-photo, measurement, or general */
  category: mysqlEnum("category", ["body-scan", "profile-photo", "measurement", "general"]).default("general").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type UserFile = typeof userFiles.$inferSelect;
export type InsertUserFile = typeof userFiles.$inferInsert;
