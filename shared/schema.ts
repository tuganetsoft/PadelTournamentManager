import { pgTable, text, serial, integer, boolean, timestamp, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User model
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Tournament model
export const tournaments = pgTable("tournaments", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  description: text("description"),
  externalLink: text("external_link"),
  imageUrl: text("image_url"),
  userId: integer("user_id").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Venue model
export const venues = pgTable("venues", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  address: text("address"),
  tournamentId: integer("tournament_id").notNull(),
});

// Court model
export const courts = pgTable("courts", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  venueId: integer("venue_id").notNull(),
});

// Category model
export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  format: text("format").notNull(), // 'GROUPS', 'SINGLE_ELIMINATION', 'GROUPS_AND_ELIMINATION'
  matchDuration: integer("match_duration").notNull(), // Duration in minutes
  status: text("status").notNull().default("REGISTRATION_OPEN"), // 'REGISTRATION_OPEN', 'ACTIVE', 'COMPLETED'
  tournamentId: integer("tournament_id").notNull(),
});

// Team model
export const teams = pgTable("teams", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  player1: text("player1").notNull(),
  player2: text("player2"),
  categoryId: integer("category_id").notNull(),
  seeded: boolean("seeded").default(false),
});

// Group model
export const groups = pgTable("groups", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  categoryId: integer("category_id").notNull(),
});

// Group assignment model
export const groupAssignments = pgTable("group_assignments", {
  id: serial("id").primaryKey(),
  groupId: integer("group_id").notNull(),
  teamId: integer("team_id").notNull(),
  // Stats
  played: integer("played").notNull().default(0),
  won: integer("won").notNull().default(0),
  lost: integer("lost").notNull().default(0),
  points: integer("points").notNull().default(0),
});

// Match model
export const matches = pgTable("matches", {
  id: serial("id").primaryKey(),
  categoryId: integer("category_id").notNull(),
  teamAId: integer("team_a_id").notNull(),
  teamBId: integer("team_b_id").notNull(),
  groupId: integer("group_id"), // Optional, only for group matches
  round: text("round"), // For bracket matches: 'ROUND_OF_16', 'QUARTER', 'SEMI', 'FINAL', for groups: 'GROUP'
  scoreA: text("score_a"), // Serialized score (e.g., '6-4,6-2')
  scoreB: text("score_b"),
  winner: integer("winner"), // ID of the winning team
  courtId: integer("court_id"), // Optional, set when scheduled
  scheduledTime: timestamp("scheduled_time"), // Optional, set when scheduled
  completed: boolean("completed").notNull().default(false),
});

// Schemas for insertion
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  name: true,
  email: true,
});

export const insertTournamentSchema = createInsertSchema(tournaments).pick({
  name: true,
  startDate: true,
  endDate: true,
  description: true,
  externalLink: true,
  imageUrl: true,
  userId: true,
});

export const insertVenueSchema = createInsertSchema(venues).pick({
  name: true,
  address: true,
  tournamentId: true,
});

export const insertCourtSchema = createInsertSchema(courts).pick({
  name: true,
  venueId: true,
});

export const insertCategorySchema = createInsertSchema(categories).pick({
  name: true,
  format: true,
  matchDuration: true,
  status: true,
  tournamentId: true,
});

export const insertTeamSchema = createInsertSchema(teams).pick({
  name: true,
  player1: true,
  player2: true,
  categoryId: true,
  seeded: true,
});

export const insertGroupSchema = createInsertSchema(groups).pick({
  name: true,
  categoryId: true,
});

export const insertGroupAssignmentSchema = createInsertSchema(groupAssignments).pick({
  groupId: true,
  teamId: true,
  played: true,
  won: true,
  lost: true,
  points: true,
});

export const insertMatchSchema = createInsertSchema(matches).pick({
  categoryId: true,
  teamAId: true,
  teamBId: true,
  groupId: true,
  round: true,
  scoreA: true,
  scoreB: true,
  winner: true,
  courtId: true,
  scheduledTime: true,
  completed: true,
});

// Types for insertion and selection
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertTournament = z.infer<typeof insertTournamentSchema>;
export type Tournament = typeof tournaments.$inferSelect;

export type InsertVenue = z.infer<typeof insertVenueSchema>;
export type Venue = typeof venues.$inferSelect;

export type InsertCourt = z.infer<typeof insertCourtSchema>;
export type Court = typeof courts.$inferSelect;

export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type Category = typeof categories.$inferSelect;

export type InsertTeam = z.infer<typeof insertTeamSchema>;
export type Team = typeof teams.$inferSelect;

export type InsertGroup = z.infer<typeof insertGroupSchema>;
export type Group = typeof groups.$inferSelect;

export type InsertGroupAssignment = z.infer<typeof insertGroupAssignmentSchema>;
export type GroupAssignment = typeof groupAssignments.$inferSelect;

export type InsertMatch = z.infer<typeof insertMatchSchema>;
export type Match = typeof matches.$inferSelect;

// Define game formats
export const GameFormats = {
  GROUPS: 'GROUPS',
  SINGLE_ELIMINATION: 'SINGLE_ELIMINATION',
  GROUPS_AND_ELIMINATION: 'GROUPS_AND_ELIMINATION',
} as const;

// Define category statuses
export const CategoryStatus = {
  REGISTRATION_OPEN: 'REGISTRATION_OPEN',
  ACTIVE: 'ACTIVE',
  COMPLETED: 'COMPLETED',
} as const;

// Define match rounds
export const MatchRounds = {
  GROUP: 'GROUP',
  ROUND_OF_32: 'ROUND_OF_32',
  ROUND_OF_16: 'ROUND_OF_16',
  QUARTER: 'QUARTER',
  SEMI: 'SEMI',
  FINAL: 'FINAL',
} as const;
