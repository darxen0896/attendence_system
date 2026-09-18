import {
  mysqlTable,
  int,
  varchar,
  text,
  timestamp,
  date,
  serial,
} from "drizzle-orm/mysql-core";

export const members = mysqlTable("members", {
  id: serial("id").primaryKey(),
  fullName: varchar("full_name", { length: 255 }).notNull(),
  phoneNumber: varchar("phone_number", { length: 20 }),
  age: int("age"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const attendance = mysqlTable("attendance", {
  id: serial("id").primaryKey(),
  memberId: int("member_id").notNull().references(() => members.id, { onDelete: "cascade" }),
  date: date("date", { mode: "string" }).notNull(),
  status: varchar("status", { length: 20 }).notNull(), // 'present' or 'absent'
  markedAt: timestamp("marked_at").defaultNow().notNull(),
});

export type Member = typeof members.$inferSelect;
export type NewMember = typeof members.$inferInsert;
export type Attendance = typeof attendance.$inferSelect;
export type NewAttendance = typeof attendance.$inferInsert;
