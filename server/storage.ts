import { 
  User, InsertUser, 
  Tournament, InsertTournament,
  Venue, InsertVenue,
  Court, InsertCourt,
  Category, InsertCategory,
  Team, InsertTeam,
  Group, InsertGroup,
  GroupAssignment, InsertGroupAssignment,
  Match, InsertMatch,
  users,
  tournaments,
  venues,
  courts,
  categories,
  teams,
  groups,
  groupAssignments,
  matches
} from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";
import connectPg from "connect-pg-simple";
import { db, pool } from "./db";
import { eq, and } from "drizzle-orm";

const PostgresSessionStore = connectPg(session);
const MemoryStore = createMemoryStore(session);

// modify the interface with any CRUD methods
// you might need
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Tournament operations
  getAllTournaments(): Promise<Tournament[]>;
  getTournamentsByUserId(userId: number): Promise<Tournament[]>;
  getTournament(id: number): Promise<Tournament | undefined>;
  createTournament(tournament: InsertTournament): Promise<Tournament>;
  updateTournament(id: number, data: Partial<Tournament>): Promise<Tournament>;
  deleteTournament(id: number): Promise<void>;

  // Venue operations
  getVenue(id: number): Promise<Venue | undefined>;
  getVenuesByTournamentId(tournamentId: number): Promise<Venue[]>;
  createVenue(venue: InsertVenue): Promise<Venue>;
  updateVenue(id: number, data: Partial<Venue>): Promise<Venue>;
  deleteVenue(id: number): Promise<void>;

  // Court operations
  getCourt(id: number): Promise<Court | undefined>;
  getCourtsByVenueId(venueId: number): Promise<Court[]>;
  createCourt(court: InsertCourt): Promise<Court>;
  updateCourt(id: number, data: Partial<Court>): Promise<Court>;
  deleteCourt(id: number): Promise<void>;

  // Category operations
  getCategory(id: number): Promise<Category | undefined>;
  getCategoriesByTournamentId(tournamentId: number): Promise<Category[]>;
  createCategory(category: InsertCategory): Promise<Category>;
  updateCategory(id: number, data: Partial<Category>): Promise<Category>;
  deleteCategory(id: number): Promise<void>;

  // Team operations
  getTeam(id: number): Promise<Team | undefined>;
  getTeamsByCategoryId(categoryId: number): Promise<Team[]>;
  createTeam(team: InsertTeam): Promise<Team>;
  updateTeam(id: number, data: Partial<Team>): Promise<Team>;
  deleteTeam(id: number): Promise<void>;

  // Group operations
  getGroup(id: number): Promise<Group | undefined>;
  getGroupsByCategoryId(categoryId: number): Promise<Group[]>;
  createGroup(group: InsertGroup): Promise<Group>;
  updateGroup(id: number, data: Partial<Group>): Promise<Group>;
  deleteGroup(id: number): Promise<void>;

  // Group Assignment operations
  getGroupAssignment(id: number): Promise<GroupAssignment | undefined>;
  getGroupAssignmentsByGroupId(groupId: number): Promise<GroupAssignment[]>;
  createGroupAssignment(assignment: InsertGroupAssignment): Promise<GroupAssignment>;
  updateGroupAssignment(id: number, data: Partial<GroupAssignment>): Promise<GroupAssignment>;
  deleteGroupAssignment(id: number): Promise<void>;

  // Match operations
  getMatch(id: number): Promise<Match | undefined>;
  getMatchesByCategoryId(categoryId: number): Promise<Match[]>;
  createMatch(match: InsertMatch): Promise<Match>;
  updateMatch(id: number, data: Partial<Match>): Promise<Match>;
  deleteMatch(id: number): Promise<void>;

  // Session store
  sessionStore: session.Store;
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    this.sessionStore = new PostgresSessionStore({
      pool,
      createTableIfMissing: true
    });
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.username, username)).limit(1);
    return result[0];
  }

  async createUser(user: InsertUser): Promise<User> {
    const result = await db.insert(users).values(user).returning();
    return result[0];
  }

  // Tournament operations
  async getAllTournaments(): Promise<Tournament[]> {
    return await db.select().from(tournaments);
  }

  async getTournamentsByUserId(userId: number): Promise<Tournament[]> {
    return await db.select().from(tournaments).where(eq(tournaments.userId, userId));
  }

  async getTournament(id: number): Promise<Tournament | undefined> {
    const result = await db.select().from(tournaments).where(eq(tournaments.id, id)).limit(1);
    return result[0];
  }

  async createTournament(tournament: InsertTournament): Promise<Tournament> {
    const result = await db.insert(tournaments).values(tournament).returning();
    return result[0];
  }

  async updateTournament(id: number, data: Partial<Tournament>): Promise<Tournament> {
    const result = await db.update(tournaments)
      .set(data)
      .where(eq(tournaments.id, id))
      .returning();
    
    if (result.length === 0) {
      throw new Error(`Tournament with ID ${id} not found`);
    }
    
    return result[0];
  }

  async deleteTournament(id: number): Promise<void> {
    // Delete all related entities (using cascade would be better in a real DB)
    
    // Get venues to delete courts
    const venuesList = await this.getVenuesByTournamentId(id);
    for (const venue of venuesList) {
      await this.deleteVenue(venue.id);
    }
    
    // Categories have teams, groups, matches
    const categoriesList = await this.getCategoriesByTournamentId(id);
    for (const category of categoriesList) {
      await this.deleteCategory(category.id);
    }
    
    // Finally delete the tournament
    await db.delete(tournaments).where(eq(tournaments.id, id));
  }

  // Venue operations
  async getVenue(id: number): Promise<Venue | undefined> {
    const result = await db.select().from(venues).where(eq(venues.id, id)).limit(1);
    return result[0];
  }

  async getVenuesByTournamentId(tournamentId: number): Promise<Venue[]> {
    return await db.select().from(venues).where(eq(venues.tournamentId, tournamentId));
  }

  async createVenue(venue: InsertVenue): Promise<Venue> {
    const result = await db.insert(venues).values(venue).returning();
    return result[0];
  }

  async updateVenue(id: number, data: Partial<Venue>): Promise<Venue> {
    const result = await db.update(venues)
      .set(data)
      .where(eq(venues.id, id))
      .returning();
    
    if (result.length === 0) {
      throw new Error(`Venue with ID ${id} not found`);
    }
    
    return result[0];
  }

  async deleteVenue(id: number): Promise<void> {
    // Delete all courts for this venue
    await db.delete(courts).where(eq(courts.venueId, id));
    
    // Delete the venue
    await db.delete(venues).where(eq(venues.id, id));
  }

  // Court operations
  async getCourt(id: number): Promise<Court | undefined> {
    const result = await db.select().from(courts).where(eq(courts.id, id)).limit(1);
    return result[0];
  }

  async getCourtsByVenueId(venueId: number): Promise<Court[]> {
    return await db.select().from(courts).where(eq(courts.venueId, venueId));
  }

  async createCourt(court: InsertCourt): Promise<Court> {
    const result = await db.insert(courts).values(court).returning();
    return result[0];
  }

  async updateCourt(id: number, data: Partial<Court>): Promise<Court> {
    const result = await db.update(courts)
      .set(data)
      .where(eq(courts.id, id))
      .returning();
    
    if (result.length === 0) {
      throw new Error(`Court with ID ${id} not found`);
    }
    
    return result[0];
  }

  async deleteCourt(id: number): Promise<void> {
    await db.delete(courts).where(eq(courts.id, id));
  }

  // Category operations
  async getCategory(id: number): Promise<Category | undefined> {
    const result = await db.select().from(categories).where(eq(categories.id, id)).limit(1);
    return result[0];
  }

  async getCategoriesByTournamentId(tournamentId: number): Promise<Category[]> {
    return await db.select().from(categories).where(eq(categories.tournamentId, tournamentId));
  }

  async createCategory(category: InsertCategory): Promise<Category> {
    const result = await db.insert(categories).values(category).returning();
    return result[0];
  }

  async updateCategory(id: number, data: Partial<Category>): Promise<Category> {
    const result = await db.update(categories)
      .set(data)
      .where(eq(categories.id, id))
      .returning();
    
    if (result.length === 0) {
      throw new Error(`Category with ID ${id} not found`);
    }
    
    return result[0];
  }

  async deleteCategory(id: number): Promise<void> {
    // Delete all teams, groups, and matches for this category
    await db.delete(teams).where(eq(teams.categoryId, id));
    
    // Get groups to delete assignments
    const groupsList = await this.getGroupsByCategoryId(id);
    for (const group of groupsList) {
      await db.delete(groupAssignments).where(eq(groupAssignments.groupId, group.id));
    }
    
    // Delete all groups
    await db.delete(groups).where(eq(groups.categoryId, id));
    
    // Delete all matches
    await db.delete(matches).where(eq(matches.categoryId, id));
    
    // Delete the category
    await db.delete(categories).where(eq(categories.id, id));
  }

  // Team operations
  async getTeam(id: number): Promise<Team | undefined> {
    const result = await db.select().from(teams).where(eq(teams.id, id)).limit(1);
    return result[0];
  }

  async getTeamsByCategoryId(categoryId: number): Promise<Team[]> {
    return await db.select().from(teams).where(eq(teams.categoryId, categoryId));
  }

  async createTeam(team: InsertTeam): Promise<Team> {
    const result = await db.insert(teams).values(team).returning();
    return result[0];
  }

  async updateTeam(id: number, data: Partial<Team>): Promise<Team> {
    const result = await db.update(teams)
      .set(data)
      .where(eq(teams.id, id))
      .returning();
    
    if (result.length === 0) {
      throw new Error(`Team with ID ${id} not found`);
    }
    
    return result[0];
  }

  async deleteTeam(id: number): Promise<void> {
    // Delete all related assignments
    await db.delete(groupAssignments).where(eq(groupAssignments.teamId, id));
    
    // Delete the team
    await db.delete(teams).where(eq(teams.id, id));
  }

  // Group operations
  async getGroup(id: number): Promise<Group | undefined> {
    const result = await db.select().from(groups).where(eq(groups.id, id)).limit(1);
    return result[0];
  }

  async getGroupsByCategoryId(categoryId: number): Promise<Group[]> {
    return await db.select().from(groups).where(eq(groups.categoryId, categoryId));
  }

  async createGroup(group: InsertGroup): Promise<Group> {
    const result = await db.insert(groups).values(group).returning();
    return result[0];
  }

  async updateGroup(id: number, data: Partial<Group>): Promise<Group> {
    const result = await db.update(groups)
      .set(data)
      .where(eq(groups.id, id))
      .returning();
    
    if (result.length === 0) {
      throw new Error(`Group with ID ${id} not found`);
    }
    
    return result[0];
  }

  async deleteGroup(id: number): Promise<void> {
    // Delete all assignments
    await db.delete(groupAssignments).where(eq(groupAssignments.groupId, id));
    
    // Delete the group
    await db.delete(groups).where(eq(groups.id, id));
  }

  // Group Assignment operations
  async getGroupAssignment(id: number): Promise<GroupAssignment | undefined> {
    const result = await db.select().from(groupAssignments).where(eq(groupAssignments.id, id)).limit(1);
    return result[0];
  }

  async getGroupAssignmentsByGroupId(groupId: number): Promise<GroupAssignment[]> {
    return await db.select().from(groupAssignments).where(eq(groupAssignments.groupId, groupId));
  }

  async createGroupAssignment(assignment: InsertGroupAssignment): Promise<GroupAssignment> {
    const result = await db.insert(groupAssignments).values(assignment).returning();
    return result[0];
  }

  async updateGroupAssignment(id: number, data: Partial<GroupAssignment>): Promise<GroupAssignment> {
    const result = await db.update(groupAssignments)
      .set(data)
      .where(eq(groupAssignments.id, id))
      .returning();
    
    if (result.length === 0) {
      throw new Error(`Group assignment with ID ${id} not found`);
    }
    
    return result[0];
  }

  async deleteGroupAssignment(id: number): Promise<void> {
    await db.delete(groupAssignments).where(eq(groupAssignments.id, id));
  }

  // Match operations
  async getMatch(id: number): Promise<Match | undefined> {
    const result = await db.select().from(matches).where(eq(matches.id, id)).limit(1);
    return result[0];
  }

  async getMatchesByCategoryId(categoryId: number): Promise<Match[]> {
    return await db.select().from(matches).where(eq(matches.categoryId, categoryId));
  }

  async createMatch(match: InsertMatch): Promise<Match> {
    const result = await db.insert(matches).values(match).returning();
    return result[0];
  }

  async updateMatch(id: number, data: Partial<Match>): Promise<Match> {
    // Create a copy to avoid modifying the original
    const processedData: Record<string, any> = {};
    
    // Copy all fields except scheduledTime
    Object.keys(data).forEach(key => {
      if (key !== 'scheduledTime') {
        processedData[key] = data[key as keyof typeof data];
      }
    });
    
    // Get the existing match
    const existingMatch = await this.getMatch(id);
    if (!existingMatch) {
      throw new Error(`Match with ID ${id} not found`);
    }
    
    // Execute a raw SQL query to update the match with proper timestamp handling
    let updateQuery = 'UPDATE matches SET ';
    const updateValues: any[] = [];
    let paramCount = 1;
    
    // Add all fields except scheduledTime to the query
    Object.keys(processedData).forEach((key, index) => {
      const snakeCaseKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
      updateQuery += `${snakeCaseKey} = $${paramCount}, `;
      updateValues.push(processedData[key]);
      paramCount++;
    });
    
    // Add scheduledTime with special handling if it exists in the data
    if ('scheduledTime' in data) {
      if (data.scheduledTime === null) {
        updateQuery += `scheduled_time = NULL, `;
      } else {
        try {
          // If it's a string, use it directly in the query with explicit casting
          updateQuery += `scheduled_time = $${paramCount}::timestamp with time zone, `;
          updateValues.push(data.scheduledTime);
          paramCount++;
        } catch (err) {
          console.error("Error processing scheduledTime:", err);
          throw new Error("Invalid date format for scheduledTime");
        }
      }
    }
    
    // Remove trailing comma and space
    updateQuery = updateQuery.slice(0, -2);
    
    // Add WHERE clause and RETURNING
    updateQuery += ` WHERE id = $${paramCount} RETURNING *`;
    updateValues.push(id);
    
    // Execute the query
    console.log("Executing raw SQL update:", updateQuery, updateValues);
    
    // Use pool directly to execute the query
    const { pool } = await import('./db');
    const result = await pool.query(updateQuery, updateValues);
    
    if (!result.rows || result.rows.length === 0) {
      throw new Error(`Failed to update match with ID ${id}`);
    }
    
    return result.rows[0] as Match;
  }

  async deleteMatch(id: number): Promise<void> {
    await db.delete(matches).where(eq(matches.id, id));
  }
}

// Use the database storage instead of in-memory
export const storage = new DatabaseStorage();
