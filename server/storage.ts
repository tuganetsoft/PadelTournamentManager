import { 
  User, InsertUser, 
  Tournament, InsertTournament,
  Venue, InsertVenue,
  Court, InsertCourt,
  Category, InsertCategory,
  Team, InsertTeam,
  Group, InsertGroup,
  GroupAssignment, InsertGroupAssignment,
  Match, InsertMatch
} from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";

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
  sessionStore: session.SessionStore;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private tournaments: Map<number, Tournament>;
  private venues: Map<number, Venue>;
  private courts: Map<number, Court>;
  private categories: Map<number, Category>;
  private teams: Map<number, Team>;
  private groups: Map<number, Group>;
  private groupAssignments: Map<number, GroupAssignment>;
  private matches: Map<number, Match>;

  private userIdCounter: number = 1;
  private tournamentIdCounter: number = 1;
  private venueIdCounter: number = 1;
  private courtIdCounter: number = 1;
  private categoryIdCounter: number = 1;
  private teamIdCounter: number = 1;
  private groupIdCounter: number = 1;
  private groupAssignmentIdCounter: number = 1;
  private matchIdCounter: number = 1;

  sessionStore: session.SessionStore;

  constructor() {
    this.users = new Map();
    this.tournaments = new Map();
    this.venues = new Map();
    this.courts = new Map();
    this.categories = new Map();
    this.teams = new Map();
    this.groups = new Map();
    this.groupAssignments = new Map();
    this.matches = new Map();
    
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000, // prune expired entries every 24h
    });
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const user: User = { 
      ...insertUser, 
      id,
      createdAt: new Date() 
    };
    this.users.set(id, user);
    return user;
  }

  // Tournament operations
  async getAllTournaments(): Promise<Tournament[]> {
    return Array.from(this.tournaments.values());
  }

  async getTournamentsByUserId(userId: number): Promise<Tournament[]> {
    return Array.from(this.tournaments.values()).filter(
      (tournament) => tournament.userId === userId
    );
  }

  async getTournament(id: number): Promise<Tournament | undefined> {
    return this.tournaments.get(id);
  }

  async createTournament(insertTournament: InsertTournament): Promise<Tournament> {
    const id = this.tournamentIdCounter++;
    const tournament: Tournament = { 
      ...insertTournament, 
      id,
      createdAt: new Date()
    };
    this.tournaments.set(id, tournament);
    return tournament;
  }

  async updateTournament(id: number, data: Partial<Tournament>): Promise<Tournament> {
    const tournament = this.tournaments.get(id);
    if (!tournament) {
      throw new Error(`Tournament with ID ${id} not found`);
    }
    
    const updatedTournament = { ...tournament, ...data };
    this.tournaments.set(id, updatedTournament);
    return updatedTournament;
  }

  async deleteTournament(id: number): Promise<void> {
    // Delete all related entities first (categories, teams, matches, etc.)
    // Get all venues for this tournament
    const venues = await this.getVenuesByTournamentId(id);
    for (const venue of venues) {
      await this.deleteVenue(venue.id);
    }
    
    // Get all categories for this tournament
    const categories = await this.getCategoriesByTournamentId(id);
    for (const category of categories) {
      await this.deleteCategory(category.id);
    }
    
    this.tournaments.delete(id);
  }

  // Venue operations
  async getVenue(id: number): Promise<Venue | undefined> {
    return this.venues.get(id);
  }

  async getVenuesByTournamentId(tournamentId: number): Promise<Venue[]> {
    return Array.from(this.venues.values()).filter(
      (venue) => venue.tournamentId === tournamentId
    );
  }

  async createVenue(insertVenue: InsertVenue): Promise<Venue> {
    const id = this.venueIdCounter++;
    const venue: Venue = { ...insertVenue, id };
    this.venues.set(id, venue);
    return venue;
  }

  async updateVenue(id: number, data: Partial<Venue>): Promise<Venue> {
    const venue = this.venues.get(id);
    if (!venue) {
      throw new Error(`Venue with ID ${id} not found`);
    }
    
    const updatedVenue = { ...venue, ...data };
    this.venues.set(id, updatedVenue);
    return updatedVenue;
  }

  async deleteVenue(id: number): Promise<void> {
    // Delete all courts for this venue
    const courts = await this.getCourtsByVenueId(id);
    for (const court of courts) {
      await this.deleteCourt(court.id);
    }
    
    this.venues.delete(id);
  }

  // Court operations
  async getCourt(id: number): Promise<Court | undefined> {
    return this.courts.get(id);
  }

  async getCourtsByVenueId(venueId: number): Promise<Court[]> {
    return Array.from(this.courts.values()).filter(
      (court) => court.venueId === venueId
    );
  }

  async createCourt(insertCourt: InsertCourt): Promise<Court> {
    const id = this.courtIdCounter++;
    const court: Court = { ...insertCourt, id };
    this.courts.set(id, court);
    return court;
  }

  async updateCourt(id: number, data: Partial<Court>): Promise<Court> {
    const court = this.courts.get(id);
    if (!court) {
      throw new Error(`Court with ID ${id} not found`);
    }
    
    const updatedCourt = { ...court, ...data };
    this.courts.set(id, updatedCourt);
    return updatedCourt;
  }

  async deleteCourt(id: number): Promise<void> {
    this.courts.delete(id);
  }

  // Category operations
  async getCategory(id: number): Promise<Category | undefined> {
    return this.categories.get(id);
  }

  async getCategoriesByTournamentId(tournamentId: number): Promise<Category[]> {
    return Array.from(this.categories.values()).filter(
      (category) => category.tournamentId === tournamentId
    );
  }

  async createCategory(insertCategory: InsertCategory): Promise<Category> {
    const id = this.categoryIdCounter++;
    const category: Category = { ...insertCategory, id };
    this.categories.set(id, category);
    return category;
  }

  async updateCategory(id: number, data: Partial<Category>): Promise<Category> {
    const category = this.categories.get(id);
    if (!category) {
      throw new Error(`Category with ID ${id} not found`);
    }
    
    const updatedCategory = { ...category, ...data };
    this.categories.set(id, updatedCategory);
    return updatedCategory;
  }

  async deleteCategory(id: number): Promise<void> {
    // Delete all teams, groups, and matches for this category
    const teams = await this.getTeamsByCategoryId(id);
    for (const team of teams) {
      await this.deleteTeam(team.id);
    }
    
    const groups = await this.getGroupsByCategoryId(id);
    for (const group of groups) {
      await this.deleteGroup(group.id);
    }
    
    const matches = await this.getMatchesByCategoryId(id);
    for (const match of matches) {
      await this.deleteMatch(match.id);
    }
    
    this.categories.delete(id);
  }

  // Team operations
  async getTeam(id: number): Promise<Team | undefined> {
    return this.teams.get(id);
  }

  async getTeamsByCategoryId(categoryId: number): Promise<Team[]> {
    return Array.from(this.teams.values()).filter(
      (team) => team.categoryId === categoryId
    );
  }

  async createTeam(insertTeam: InsertTeam): Promise<Team> {
    const id = this.teamIdCounter++;
    const team: Team = { ...insertTeam, id };
    this.teams.set(id, team);
    return team;
  }

  async updateTeam(id: number, data: Partial<Team>): Promise<Team> {
    const team = this.teams.get(id);
    if (!team) {
      throw new Error(`Team with ID ${id} not found`);
    }
    
    const updatedTeam = { ...team, ...data };
    this.teams.set(id, updatedTeam);
    return updatedTeam;
  }

  async deleteTeam(id: number): Promise<void> {
    // Delete all group assignments for this team
    const assignments = Array.from(this.groupAssignments.values()).filter(
      (assignment) => assignment.teamId === id
    );
    
    for (const assignment of assignments) {
      await this.deleteGroupAssignment(assignment.id);
    }
    
    this.teams.delete(id);
  }

  // Group operations
  async getGroup(id: number): Promise<Group | undefined> {
    return this.groups.get(id);
  }

  async getGroupsByCategoryId(categoryId: number): Promise<Group[]> {
    return Array.from(this.groups.values()).filter(
      (group) => group.categoryId === categoryId
    );
  }

  async createGroup(insertGroup: InsertGroup): Promise<Group> {
    const id = this.groupIdCounter++;
    const group: Group = { ...insertGroup, id };
    this.groups.set(id, group);
    return group;
  }

  async updateGroup(id: number, data: Partial<Group>): Promise<Group> {
    const group = this.groups.get(id);
    if (!group) {
      throw new Error(`Group with ID ${id} not found`);
    }
    
    const updatedGroup = { ...group, ...data };
    this.groups.set(id, updatedGroup);
    return updatedGroup;
  }

  async deleteGroup(id: number): Promise<void> {
    // Delete all group assignments for this group
    const assignments = await this.getGroupAssignmentsByGroupId(id);
    for (const assignment of assignments) {
      await this.deleteGroupAssignment(assignment.id);
    }
    
    this.groups.delete(id);
  }

  // Group Assignment operations
  async getGroupAssignment(id: number): Promise<GroupAssignment | undefined> {
    return this.groupAssignments.get(id);
  }

  async getGroupAssignmentsByGroupId(groupId: number): Promise<GroupAssignment[]> {
    return Array.from(this.groupAssignments.values()).filter(
      (assignment) => assignment.groupId === groupId
    );
  }

  async createGroupAssignment(insertAssignment: InsertGroupAssignment): Promise<GroupAssignment> {
    const id = this.groupAssignmentIdCounter++;
    const assignment: GroupAssignment = { ...insertAssignment, id };
    this.groupAssignments.set(id, assignment);
    return assignment;
  }

  async updateGroupAssignment(id: number, data: Partial<GroupAssignment>): Promise<GroupAssignment> {
    const assignment = this.groupAssignments.get(id);
    if (!assignment) {
      throw new Error(`Group assignment with ID ${id} not found`);
    }
    
    const updatedAssignment = { ...assignment, ...data };
    this.groupAssignments.set(id, updatedAssignment);
    return updatedAssignment;
  }

  async deleteGroupAssignment(id: number): Promise<void> {
    this.groupAssignments.delete(id);
  }

  // Match operations
  async getMatch(id: number): Promise<Match | undefined> {
    return this.matches.get(id);
  }

  async getMatchesByCategoryId(categoryId: number): Promise<Match[]> {
    return Array.from(this.matches.values()).filter(
      (match) => match.categoryId === categoryId
    );
  }

  async createMatch(insertMatch: InsertMatch): Promise<Match> {
    const id = this.matchIdCounter++;
    const match: Match = { ...insertMatch, id };
    this.matches.set(id, match);
    return match;
  }

  async updateMatch(id: number, data: Partial<Match>): Promise<Match> {
    const match = this.matches.get(id);
    if (!match) {
      throw new Error(`Match with ID ${id} not found`);
    }
    
    const updatedMatch = { ...match, ...data };
    this.matches.set(id, updatedMatch);
    return updatedMatch;
  }

  async deleteMatch(id: number): Promise<void> {
    this.matches.delete(id);
  }
}

export const storage = new MemStorage();
