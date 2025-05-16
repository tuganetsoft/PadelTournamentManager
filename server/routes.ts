import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { 
  insertTournamentSchema, 
  insertVenueSchema, 
  insertCourtSchema, 
  insertCategorySchema, 
  insertTeamSchema, 
  insertGroupSchema, 
  insertMatchSchema,
  GameFormats, 
  CategoryStatus,
  MatchRounds 
} from "@shared/schema";
import { format, parseISO } from "date-fns";

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication routes
  setupAuth(app);

  // TOURNAMENTS
  
  // Get all tournaments
  app.get("/api/tournaments", async (req, res) => {
    const tournaments = await storage.getAllTournaments();
    res.json(tournaments);
  });

  // Get user's tournaments
  app.get("/api/tournaments/user", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    const tournaments = await storage.getTournamentsByUserId(req.user.id);
    res.json(tournaments);
  });

  // Get tournament by ID
  app.get("/api/tournaments/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).send("Invalid ID");
    
    const tournament = await storage.getTournament(id);
    if (!tournament) return res.status(404).send("Tournament not found");
    
    res.json(tournament);
  });
  
  // Get tournament full details
  app.get("/api/tournaments/:id/details", async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).send("Invalid ID");
    
    try {
      // Get base tournament data
      const tournament = await storage.getTournament(id);
      if (!tournament) return res.status(404).send("Tournament not found");
      
      // Get venues with courts
      const venues = await storage.getVenuesByTournamentId(id);
      const venuesWithCourts = await Promise.all(
        venues.map(async (venue) => {
          const courts = await storage.getCourtsByVenueId(venue.id);
          return { ...venue, courts };
        })
      );
      
      // Get categories with teams
      const categories = await storage.getCategoriesByTournamentId(id);
      const categoriesWithData = await Promise.all(
        categories.map(async (category) => {
          const teams = await storage.getTeamsByCategoryId(category.id);
          const groups = await storage.getGroupsByCategoryId(category.id);
          
          // Get group assignments
          const groupsWithAssignments = await Promise.all(
            groups.map(async (group) => {
              const assignments = await storage.getGroupAssignmentsByGroupId(group.id);
              
              // Add team data to assignments
              const assignmentsWithTeams = await Promise.all(
                assignments.map(async (assignment) => {
                  const team = await storage.getTeam(assignment.teamId);
                  return { ...assignment, team };
                })
              );
              
              return { ...group, assignments: assignmentsWithTeams };
            })
          );
          
          // Get matches
          const matches = await storage.getMatchesByCategoryId(category.id);
          const matchesWithTeams = await Promise.all(
            matches.map(async (match) => {
              const teamA = await storage.getTeam(match.teamAId);
              const teamB = await storage.getTeam(match.teamBId);
              
              return { ...match, teamA, teamB };
            })
          );
          
          return { 
            ...category, 
            teams, 
            groups: groupsWithAssignments,
            matches: matchesWithTeams 
          };
        })
      );
      
      // Calculate statistics
      const totalTeams = categoriesWithData.reduce(
        (sum, category) => sum + (category.teams?.length || 0), 
        0
      );
      
      const allMatches = categoriesWithData.flatMap(
        category => category.matches || []
      );
      
      const totalMatches = allMatches.length;
      const completedMatches = allMatches.filter(m => m.completed).length;
      
      // Combine all data
      const tournamentDetails = {
        ...tournament,
        venues: venuesWithCourts,
        categories: categoriesWithData,
        stats: {
          totalTeams,
          totalMatches,
          completedMatches
        }
      };
      
      res.json(tournamentDetails);
    } catch (error) {
      console.error("Error fetching tournament details:", error);
      res.status(500).json({ error: "Failed to load tournament details" });
    }
  });

  // Create tournament
  app.post("/api/tournaments", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    
    try {
      // Parse dates from strings if they are strings
      const formData = {
        ...req.body,
        startDate: req.body.startDate ? new Date(req.body.startDate) : undefined,
        endDate: req.body.endDate ? new Date(req.body.endDate) : undefined,
        userId: req.user.id
      };
      
      const data = insertTournamentSchema.parse(formData);
      
      const tournament = await storage.createTournament(data);
      res.status(201).json(tournament);
    } catch (error) {
      res.status(400).json({ error: JSON.stringify(error, null, 2) });
    }
  });

  // Update tournament
  app.patch("/api/tournaments/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).send("Invalid ID");
    
    try {
      const tournament = await storage.getTournament(id);
      if (!tournament) return res.status(404).send("Tournament not found");
      
      if (tournament.userId !== req.user.id) {
        return res.status(403).send("Not authorized to update this tournament");
      }
      
      const data = req.body;
      const updatedTournament = await storage.updateTournament(id, data);
      res.json(updatedTournament);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  // Delete tournament
  app.delete("/api/tournaments/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).send("Invalid ID");
    
    try {
      const tournament = await storage.getTournament(id);
      if (!tournament) return res.status(404).send("Tournament not found");
      
      if (tournament.userId !== req.user.id) {
        return res.status(403).send("Not authorized to delete this tournament");
      }
      
      await storage.deleteTournament(id);
      res.status(204).send();
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  // VENUES & COURTS
  
  // Get venues for a tournament
  app.get("/api/tournaments/:id/venues", async (req, res) => {
    const tournamentId = parseInt(req.params.id);
    if (isNaN(tournamentId)) return res.status(400).send("Invalid tournament ID");
    
    const venues = await storage.getVenuesByTournamentId(tournamentId);
    res.json(venues);
  });

  // Create venue
  app.post("/api/venues", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    
    try {
      const data = insertVenueSchema.parse(req.body);
      
      // Check if user owns the tournament
      const tournament = await storage.getTournament(data.tournamentId);
      if (!tournament) return res.status(404).send("Tournament not found");
      
      if (tournament.userId !== req.user.id) {
        return res.status(403).send("Not authorized to add venues to this tournament");
      }
      
      const venue = await storage.createVenue(data);
      res.status(201).json(venue);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  // Get courts for a venue
  app.get("/api/venues/:id/courts", async (req, res) => {
    const venueId = parseInt(req.params.id);
    if (isNaN(venueId)) return res.status(400).send("Invalid venue ID");
    
    const courts = await storage.getCourtsByVenueId(venueId);
    res.json(courts);
  });

  // Create court
  app.post("/api/courts", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    
    try {
      const data = insertCourtSchema.parse(req.body);
      
      // Check if user owns the venue's tournament
      const venue = await storage.getVenue(data.venueId);
      if (!venue) return res.status(404).send("Venue not found");
      
      const tournament = await storage.getTournament(venue.tournamentId);
      if (tournament.userId !== req.user.id) {
        return res.status(403).send("Not authorized to add courts to this venue");
      }
      
      const court = await storage.createCourt(data);
      res.status(201).json(court);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  // CATEGORIES
  
  // Get categories for a tournament
  app.get("/api/tournaments/:id/categories", async (req, res) => {
    const tournamentId = parseInt(req.params.id);
    if (isNaN(tournamentId)) return res.status(400).send("Invalid tournament ID");
    
    const categories = await storage.getCategoriesByTournamentId(tournamentId);
    res.json(categories);
  });

  // Create category
  app.post("/api/categories", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    
    try {
      const data = insertCategorySchema.parse(req.body);
      
      // Check if user owns the tournament
      const tournament = await storage.getTournament(data.tournamentId);
      if (!tournament) return res.status(404).send("Tournament not found");
      
      if (tournament.userId !== req.user.id) {
        return res.status(403).send("Not authorized to add categories to this tournament");
      }
      
      const category = await storage.createCategory(data);
      res.status(201).json(category);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  // Update category
  app.patch("/api/categories/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).send("Invalid ID");
    
    try {
      const category = await storage.getCategory(id);
      if (!category) return res.status(404).send("Category not found");
      
      // Check if user owns the tournament
      const tournament = await storage.getTournament(category.tournamentId);
      if (tournament.userId !== req.user.id) {
        return res.status(403).send("Not authorized to update this category");
      }
      
      const data = req.body;
      const updatedCategory = await storage.updateCategory(id, data);
      res.json(updatedCategory);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  // TEAMS
  
  // Get teams for a category
  app.get("/api/categories/:id/teams", async (req, res) => {
    const categoryId = parseInt(req.params.id);
    if (isNaN(categoryId)) return res.status(400).send("Invalid category ID");
    
    const teams = await storage.getTeamsByCategoryId(categoryId);
    res.json(teams);
  });
  
  // Get category details with all related data
  app.get("/api/categories/:id/details", async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).send("Invalid ID");
    
    try {
      // Get base category data
      const category = await storage.getCategory(id);
      if (!category) return res.status(404).send("Category not found");
      
      // Get tournament
      const tournament = await storage.getTournament(category.tournamentId);
      
      // Get teams
      const teams = await storage.getTeamsByCategoryId(id);
      
      // Get groups with assignments
      const groups = await storage.getGroupsByCategoryId(id);
      const groupsWithAssignments = await Promise.all(
        groups.map(async (group) => {
          const assignments = await storage.getGroupAssignmentsByGroupId(group.id);
          
          // Add team data to assignments
          const assignmentsWithTeams = await Promise.all(
            assignments.map(async (assignment) => {
              const team = await storage.getTeam(assignment.teamId);
              return { ...assignment, team };
            })
          );
          
          return { ...group, assignments: assignmentsWithTeams };
        })
      );
      
      // Get matches
      const matches = await storage.getMatchesByCategoryId(id);
      const matchesWithTeams = await Promise.all(
        matches.map(async (match) => {
          const teamA = match.teamAId ? await storage.getTeam(match.teamAId) : null;
          const teamB = match.teamBId ? await storage.getTeam(match.teamBId) : null;
          
          return { ...match, teamA, teamB };
        })
      );
      
      // Combine data
      const categoryDetails = {
        ...category,
        tournament,
        teams,
        groups: groupsWithAssignments,
        matches: matchesWithTeams
      };
      
      res.json(categoryDetails);
    } catch (error) {
      console.error("Error fetching category details:", error);
      res.status(500).json({ error: "Failed to load category details" });
    }
  });
  
  // Save team assignments (Confirm button)
  app.post("/api/categories/:id/save-assignments", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).send("Invalid ID");
    
    try {
      // Get category
      const category = await storage.getCategory(id);
      if (!category) return res.status(404).send("Category not found");
      
      // Check if user owns the tournament
      const tournament = await storage.getTournament(category.tournamentId);
      if (tournament?.userId !== req.user.id) {
        return res.status(403).send("Not authorized to manage this category");
      }

      // --------- SIMPLER APPROACH BASED ON AUTO-ASSIGN LOGIC ---------
      
      // Get teams and groups
      const teams = await storage.getTeamsByCategoryId(id);
      if (teams.length === 0) {
        return res.status(200).json({ success: true, message: "No teams to process" });
      }
      
      const groups = await storage.getGroupsByCategoryId(id);
      if (groups.length === 0) {
        return res.status(200).json({ success: true, message: "No groups available" });
      }
      
      // Build a map of existing assignments (teamId -> groupId)
      const teamToGroupMap = new Map<number, number>();
      const teamToAssignmentMap = new Map<number, number>(); // teamId -> assignmentId
      
      // Track all assignments across all groups
      for (const group of groups) {
        const assignments = await storage.getGroupAssignmentsByGroupId(group.id);
        for (const assignment of assignments) {
          teamToGroupMap.set(assignment.teamId, group.id);
          teamToAssignmentMap.set(assignment.teamId, assignment.id);
        }
      }
      
      console.log(`Current database state: ${teamToGroupMap.size} teams assigned to groups`);
      
      // Now check if there are any direct API calls needed to reconcile 
      // between what's in the database and what's in the UI state
      const changesCount = { created: 0, deleted: 0, updated: 0 };
      
      // The client already made individual API calls to add/remove teams
      // This endpoint just ensures database consistency and handles any race conditions
      
      // For each team in the database, make sure any manual assignments were correctly persisted
      // This ensures that even if individual API calls had issues, the final state is correct
      for (const team of teams) {
        // Get latest UI state for this team from query params or body
        // Since this is just a confirmation operation, we'll rely on whatever state is in the DB
        const currentGroupId = teamToGroupMap.get(team.id);
        
        // But as an extra check, verify the team is assigned to the expected group
        // If there's a mismatch between the DB and what we expected, fix it
        if (req.body && req.body.assignments) {
          const expectedAssignment = req.body.assignments.find((a: any) => a.teamId === team.id);
          if (expectedAssignment && expectedAssignment.groupId !== currentGroupId) {
            console.log(`Team ${team.id} should be in group ${expectedAssignment.groupId} but is in ${currentGroupId || 'none'}`);
            
            // Update the assignment
            const assignmentId = teamToAssignmentMap.get(team.id);
            if (assignmentId) {
              // Team already has an assignment, update it
              await storage.updateGroupAssignment(assignmentId, {
                groupId: expectedAssignment.groupId
              });
              changesCount.updated++;
            } else {
              // Team doesn't have an assignment yet, create one
              await storage.createGroupAssignment({
                teamId: team.id,
                groupId: expectedAssignment.groupId,
                played: 0,
                won: 0,
                lost: 0,
                points: 0
              });
              changesCount.created++;
            }
          }
        }
      }
      
      // Check for any orphaned assignments (assigned teams that no longer exist)
      // Convert the Map entries to an array to avoid TypeScript issues with Map.entries() iterator
      const assignedTeams = Array.from(teamToGroupMap.entries());
      for (const [teamId, groupId] of assignedTeams) {
        const teamExists = teams.some(t => t.id === teamId);
        if (!teamExists) {
          // This is an assignment for a team that no longer exists
          const assignmentId = teamToAssignmentMap.get(teamId);
          if (assignmentId) {
            console.log(`Deleting orphaned assignment ${assignmentId} for deleted team ${teamId}`);
            await storage.deleteGroupAssignment(assignmentId);
            changesCount.deleted++;
          }
        }
      }
      
      // If no changes were made here, it means all changes were already handled by individual API calls
      if (changesCount.created === 0 && changesCount.deleted === 0 && changesCount.updated === 0) {
        // We didn't need to make any changes here, but need to mark the state as saved on the client
        console.log("No additional changes needed during save-assignments");
        return res.status(200).json({ 
          success: true, 
          message: "Assignments verified and saved successfully",
          changes: false
        });
      }
      
      // If we made changes, return the counts
      return res.status(200).json({ 
        success: true, 
        message: `Team assignments saved (${changesCount.created} created, ${changesCount.updated} updated, ${changesCount.deleted} deleted)`,
        changes: true
      });
    } catch (error) {
      console.error("Error saving team assignments:", error);
      res.status(500).json({ error: "Failed to save team assignments" });
    }
  });

  // Auto-assign teams to groups
  app.post("/api/categories/:id/auto-assign-teams", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).send("Invalid ID");
    
    try {
      // Get category
      const category = await storage.getCategory(id);
      if (!category) return res.status(404).send("Category not found");
      
      // Check if user owns the tournament
      const tournament = await storage.getTournament(category.tournamentId);
      if (tournament.userId !== req.user.id) {
        return res.status(403).send("Not authorized to manage this category");
      }
      
      // Get teams and groups
      const teams = await storage.getTeamsByCategoryId(id);
      if (teams.length === 0) {
        return res.status(400).json({ error: "No teams to assign" });
      }
      
      const groups = await storage.getGroupsByCategoryId(id);
      if (groups.length === 0) {
        return res.status(400).json({ error: "No groups available" });
      }
      
      // Get existing assignments
      let existingAssignments = [];
      for (const group of groups) {
        const assignments = await storage.getGroupAssignmentsByGroupId(group.id);
        existingAssignments = [...existingAssignments, ...assignments.map(a => a.teamId)];
      }
      
      // Filter out already assigned teams
      const unassignedTeams = teams.filter(team => !existingAssignments.includes(team.id));
      
      if (unassignedTeams.length === 0) {
        return res.status(400).json({ error: "All teams are already assigned" });
      }
      
      // Separate seeded and non-seeded teams
      const seededTeams = unassignedTeams.filter(team => team.seeded);
      const nonSeededTeams = unassignedTeams.filter(team => !team.seeded);
      
      // Shuffle each group of teams randomly
      const shuffledSeededTeams = [...seededTeams].sort(() => Math.random() - 0.5);
      const shuffledNonSeededTeams = [...nonSeededTeams].sort(() => Math.random() - 0.5);
      
      // Distribute seeded teams first (ensuring they are evenly distributed)
      for (let i = 0; i < shuffledSeededTeams.length; i++) {
        const team = shuffledSeededTeams[i];
        const groupIndex = i % groups.length;
        const group = groups[groupIndex];
        
        await storage.createGroupAssignment({
          groupId: group.id,
          teamId: team.id,
          played: 0,
          won: 0,
          lost: 0,
          points: 0
        });
      }
      
      // Then distribute non-seeded teams
      for (let i = 0; i < shuffledNonSeededTeams.length; i++) {
        const team = shuffledNonSeededTeams[i];
        const groupIndex = i % groups.length;
        const group = groups[groupIndex];
        
        await storage.createGroupAssignment({
          groupId: group.id,
          teamId: team.id,
          played: 0,
          won: 0,
          lost: 0,
          points: 0
        });
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error auto-assigning teams:", error);
      res.status(500).json({ error: "Failed to auto-assign teams" });
    }
  });
  
  // Generate matches for category
  // First implementation of generate-matches endpoint removed (duplicate)

  // Create team
  app.post("/api/teams", async (req, res) => {
    try {
      const data = insertTeamSchema.parse(req.body);
      
      // Get the category
      const category = await storage.getCategory(data.categoryId);
      if (!category) return res.status(404).send("Category not found");
      
      const team = await storage.createTeam(data);
      res.status(201).json(team);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });
  
  // Update team
  app.patch("/api/teams/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).send("Invalid ID");
    
    try {
      // Get the team
      const team = await storage.getTeam(id);
      if (!team) return res.status(404).send("Team not found");
      
      // Get the category and tournament to check ownership
      const category = await storage.getCategory(team.categoryId);
      if (!category) return res.status(404).send("Category not found");
      
      const tournament = await storage.getTournament(category.tournamentId);
      if (!tournament) return res.status(404).send("Tournament not found");
      
      // Check if user owns the tournament
      if (tournament.userId !== req.user.id) {
        return res.status(403).send("Not authorized to update this team");
      }
      
      // Update the team
      const updatedTeam = await storage.updateTeam(id, req.body);
      res.json(updatedTeam);
    } catch (error) {
      console.error("Error updating team:", error);
      res.status(500).json({ error: "Failed to update team" });
    }
  });

  // GROUPS
  
  // Get groups for a category
  app.get("/api/categories/:id/groups", async (req, res) => {
    const categoryId = parseInt(req.params.id);
    if (isNaN(categoryId)) return res.status(400).send("Invalid category ID");
    
    const groups = await storage.getGroupsByCategoryId(categoryId);
    res.json(groups);
  });

  // Get group assignments (teams in a group with their standings)
  app.get("/api/groups/:id/assignments", async (req, res) => {
    const groupId = parseInt(req.params.id);
    if (isNaN(groupId)) return res.status(400).send("Invalid group ID");
    
    const assignments = await storage.getGroupAssignmentsByGroupId(groupId);
    
    // Map team details into assignments
    const assignmentsWithTeams = await Promise.all(
      assignments.map(async (assignment) => {
        const team = await storage.getTeam(assignment.teamId);
        return {
          ...assignment,
          team,
        };
      })
    );
    
    res.json(assignmentsWithTeams);
  });

  // Create group and assign teams
  app.post("/api/categories/:id/generate-groups", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    
    const categoryId = parseInt(req.params.id);
    if (isNaN(categoryId)) return res.status(400).send("Invalid category ID");
    
    try {
      const category = await storage.getCategory(categoryId);
      if (!category) return res.status(404).send("Category not found");
      
      // Check if user owns the tournament
      const tournament = await storage.getTournament(category.tournamentId);
      if (tournament.userId !== req.user.id) {
        return res.status(403).send("Not authorized to generate groups for this category");
      }
      
      // Get teams for this category
      const teams = await storage.getTeamsByCategoryId(categoryId);
      if (teams.length < 2) {
        return res.status(400).send("Need at least 2 teams to generate groups");
      }
      
      const { numGroups } = req.body;
      if (!numGroups || numGroups < 1) {
        return res.status(400).send("Invalid number of groups");
      }
      
      // Generate groups
      const teamsPerGroup = Math.ceil(teams.length / numGroups);
      let groups = [];
      
      for (let i = 0; i < numGroups; i++) {
        const groupName = String.fromCharCode(65 + i); // A, B, C, ...
        const group = await storage.createGroup({
          name: groupName,
          categoryId,
        });
        groups.push(group);
        
        // Assign teams to this group
        const groupTeams = teams.slice(i * teamsPerGroup, (i + 1) * teamsPerGroup);
        for (const team of groupTeams) {
          await storage.createGroupAssignment({
            groupId: group.id,
            teamId: team.id,
            played: 0,
            won: 0,
            lost: 0,
            points: 0,
          });
        }
      }
      
      res.status(201).json(groups);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  // MATCHES
  
  // Get matches for a category
  app.get("/api/categories/:id/matches", async (req, res) => {
    const categoryId = parseInt(req.params.id);
    if (isNaN(categoryId)) return res.status(400).send("Invalid category ID");
    
    const matches = await storage.getMatchesByCategoryId(categoryId);
    
    // Expand team information
    const matchesWithTeams = await Promise.all(
      matches.map(async (match) => {
        const teamA = await storage.getTeam(match.teamAId);
        const teamB = await storage.getTeam(match.teamBId);
        return {
          ...match,
          teamA,
          teamB,
        };
      })
    );
    
    res.json(matchesWithTeams);
  });

  // Get matches for a tournament by date
  app.get("/api/tournaments/:id/matches", async (req, res) => {
    const tournamentId = parseInt(req.params.id);
    if (isNaN(tournamentId)) return res.status(400).send("Invalid tournament ID");
    
    const dateParam = req.query.date as string;
    let date = null;
    
    if (dateParam) {
      date = parseISO(dateParam);
      if (isNaN(date.getTime())) {
        return res.status(400).send("Invalid date format");
      }
    }
    
    // Get all categories for this tournament
    const categories = await storage.getCategoriesByTournamentId(tournamentId);
    
    // Get matches for all these categories
    let allMatches = [];
    for (const category of categories) {
      const categoryMatches = await storage.getMatchesByCategoryId(category.id);
      
      // Filter by date if provided
      const filteredMatches = date
        ? categoryMatches.filter((match) => {
            if (!match.scheduledTime) return false;
            const matchDate = new Date(match.scheduledTime);
            return (
              matchDate.getFullYear() === date.getFullYear() &&
              matchDate.getMonth() === date.getMonth() &&
              matchDate.getDate() === date.getDate()
            );
          })
        : categoryMatches;
      
      // Add category info and team info to matches
      const matchesWithDetails = await Promise.all(
        filteredMatches.map(async (match) => {
          const teamA = await storage.getTeam(match.teamAId);
          const teamB = await storage.getTeam(match.teamBId);
          
          let court = null;
          if (match.courtId) {
            court = await storage.getCourt(match.courtId);
          }
          
          return {
            ...match,
            category,
            teamA,
            teamB,
            court,
          };
        })
      );
      
      allMatches = [...allMatches, ...matchesWithDetails];
    }
    
    res.json(allMatches);
  });

  // Create multiple groups at once
  app.post("/api/categories/:id/create-groups", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).send("Invalid ID");
    
    try {
      // Get category
      const category = await storage.getCategory(id);
      if (!category) return res.status(404).send("Category not found");
      
      // Check if user owns the tournament
      const tournament = await storage.getTournament(category.tournamentId);
      if (tournament.userId !== req.user.id) {
        return res.status(403).send("Not authorized to manage this category");
      }
      
      const { groupCount } = req.body;
      if (!groupCount || isNaN(Number(groupCount)) || Number(groupCount) < 1) {
        return res.status(400).json({ error: "Invalid group count" });
      }
      
      // Check if groups already exist
      const existingGroups = await storage.getGroupsByCategoryId(id);
      if (existingGroups.length > 0) {
        return res.status(400).json({ error: "Groups already exist for this category" });
      }
      
      // Create the specified number of groups
      const createdGroups = [];
      
      for (let i = 1; i <= Number(groupCount); i++) {
        const group = await storage.createGroup({
          name: `Group ${i}`,
          categoryId: id
        });
        
        createdGroups.push(group);
      }
      
      res.status(201).json(createdGroups);
    } catch (error) {
      console.error("Error creating groups:", error);
      res.status(500).json({ error: "Failed to create groups" });
    }
  });
  
  // Generate matches for a category
  app.post("/api/categories/:id/generate-matches", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    
    const categoryId = parseInt(req.params.id);
    if (isNaN(categoryId)) return res.status(400).send("Invalid category ID");
    
    try {
      const category = await storage.getCategory(categoryId);
      if (!category) return res.status(404).send("Category not found");
      
      // Check if user owns the tournament
      const tournament = await storage.getTournament(category.tournamentId);
      if (tournament.userId !== req.user.id) {
        return res.status(403).send("Not authorized to generate matches for this category");
      }
      
      // Generate matches based on the format
      const teams = await storage.getTeamsByCategoryId(categoryId);
      if (teams.length < 2) {
        return res.status(400).send("Need at least 2 teams to generate matches");
      }
      
      let matches = [];
      
      if (category.format === GameFormats.GROUPS || category.format === GameFormats.GROUPS_AND_ELIMINATION) {
        // Get groups for this category
        const groups = await storage.getGroupsByCategoryId(categoryId);
        if (groups.length === 0) {
          return res.status(400).send("No groups found. Create groups first.");
        }
        
        // Generate round-robin matches within each group
        for (const group of groups) {
          const groupAssignments = await storage.getGroupAssignmentsByGroupId(group.id);
          const groupTeams = await Promise.all(
            groupAssignments.map(async (assignment) => {
              return await storage.getTeam(assignment.teamId);
            })
          );
          
          // Generate round-robin matchups
          for (let i = 0; i < groupTeams.length; i++) {
            for (let j = i + 1; j < groupTeams.length; j++) {
              const match = await storage.createMatch({
                categoryId,
                teamAId: groupTeams[i].id,
                teamBId: groupTeams[j].id,
                groupId: group.id,
                round: MatchRounds.GROUP,
                completed: false,
              });
              matches.push(match);
            }
          }
        }
      }
      
      if (category.format === GameFormats.SINGLE_ELIMINATION || category.format === GameFormats.GROUPS_AND_ELIMINATION) {
        // For single elimination, we'll create placeholder matches for the bracket
        // The actual teams will be assigned later as matches progress
        let numTeams;
        
        if (category.format === GameFormats.SINGLE_ELIMINATION) {
          numTeams = teams.length;
        } else {
          // For GROUPS_AND_ELIMINATION, we need to determine how many teams advance from groups
          const groups = await storage.getGroupsByCategoryId(categoryId);
          // Typically, top 2 teams from each group advance
          numTeams = groups.length * 2;
        }
        
        // Calculate number of rounds and matches
        const numRounds = Math.ceil(Math.log2(numTeams));
        
        // Create bracket structure
        for (let round = numRounds; round > 0; round--) {
          const numMatchesInRound = Math.pow(2, round - 1);
          let roundName;
          
          switch (round) {
            case 1:
              roundName = MatchRounds.FINAL;
              break;
            case 2:
              roundName = MatchRounds.SEMI;
              break;
            case 3:
              roundName = MatchRounds.QUARTER;
              break;
            case 4:
              roundName = MatchRounds.ROUND_OF_16;
              break;
            case 5:
              roundName = MatchRounds.ROUND_OF_32;
              break;
            default:
              roundName = `ROUND_${round}`;
          }
          
          for (let i = 0; i < numMatchesInRound; i++) {
            // For first round matches in single elimination, we can assign teams now
            let teamAId = null;
            let teamBId = null;
            
            if (round === numRounds && category.format === GameFormats.SINGLE_ELIMINATION) {
              const seedA = i * 2;
              const seedB = i * 2 + 1;
              
              if (seedA < teams.length) {
                teamAId = teams[seedA].id;
              }
              
              if (seedB < teams.length) {
                teamBId = teams[seedB].id;
              }
            }
            
            // Only create the match if at least one team is assigned (for single elimination)
            // or always create for groups + elimination (teams will be determined later)
            if (teamAId || teamBId || category.format === GameFormats.GROUPS_AND_ELIMINATION) {
              const match = await storage.createMatch({
                categoryId,
                teamAId: teamAId || 0, // Placeholder
                teamBId: teamBId || 0, // Placeholder
                round: roundName,
                completed: false,
              });
              matches.push(match);
            }
          }
        }
      }
      
      // Update category status to ACTIVE
      await storage.updateCategory(categoryId, { status: CategoryStatus.ACTIVE });
      
      res.status(201).json(matches);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  // Update match (record score or schedule)
  app.patch("/api/matches/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).send("Invalid ID");
    
    try {
      const match = await storage.getMatch(id);
      if (!match) return res.status(404).send("Match not found");
      
      // Check if user owns the tournament
      const category = await storage.getCategory(match.categoryId);
      const tournament = await storage.getTournament(category.tournamentId);
      
      if (tournament.userId !== req.user.id) {
        return res.status(403).send("Not authorized to update this match");
      }
      
      // Process request data to ensure scheduledTime is properly formatted
      const data = { ...req.body };
      
      // Handle date - ensure it's a valid date string or null
      if (data.scheduledTime) {
        try {
          // If it's already an ISO string, this will just parse and re-format it
          // If it's some other format, this will attempt to convert it
          const dateObj = new Date(data.scheduledTime);
          if (!isNaN(dateObj.getTime())) {
            data.scheduledTime = dateObj.toISOString();
          } else {
            return res.status(400).json({ error: "Invalid date format" });
          }
        } catch (err) {
          return res.status(400).json({ error: "Could not process date format" });
        }
      }
      
      const updatedMatch = await storage.updateMatch(id, data);
      
      // If match is completed and has scores, update group standings
      if (updatedMatch.completed && updatedMatch.winner && updatedMatch.groupId) {
        // Update standings for this group
        const groupAssignments = await storage.getGroupAssignmentsByGroupId(match.groupId);
        
        // Find the assignments for both teams
        const teamAAssignment = groupAssignments.find(a => a.teamId === match.teamAId);
        const teamBAssignment = groupAssignments.find(a => a.teamId === match.teamBId);
        
        if (teamAAssignment && teamBAssignment) {
          // Update played count
          await storage.updateGroupAssignment(teamAAssignment.id, {
            played: teamAAssignment.played + 1
          });
          
          await storage.updateGroupAssignment(teamBAssignment.id, {
            played: teamBAssignment.played + 1
          });
          
          // Update win/loss count and points
          if (updatedMatch.winner === match.teamAId) {
            await storage.updateGroupAssignment(teamAAssignment.id, {
              won: teamAAssignment.won + 1,
              points: teamAAssignment.points + 3 // 3 points for a win
            });
            
            await storage.updateGroupAssignment(teamBAssignment.id, {
              lost: teamBAssignment.lost + 1
            });
          } else {
            await storage.updateGroupAssignment(teamBAssignment.id, {
              won: teamBAssignment.won + 1,
              points: teamBAssignment.points + 3 // 3 points for a win
            });
            
            await storage.updateGroupAssignment(teamAAssignment.id, {
              lost: teamAAssignment.lost + 1
            });
          }
        }
      }
      
      res.json(updatedMatch);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  // Schedule matches
  app.post("/api/tournaments/:id/schedule", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    
    const tournamentId = parseInt(req.params.id);
    if (isNaN(tournamentId)) return res.status(400).send("Invalid tournament ID");
    
    try {
      const tournament = await storage.getTournament(tournamentId);
      if (!tournament) return res.status(404).send("Tournament not found");
      
      if (tournament.userId !== req.user.id) {
        return res.status(403).send("Not authorized to schedule matches for this tournament");
      }
      
      const { schedules } = req.body;
      if (!Array.isArray(schedules)) {
        return res.status(400).send("Invalid schedule format");
      }
      
      const updatedMatches = [];
      
      for (const schedule of schedules) {
        const { matchId, courtId, scheduledTime } = schedule;
        
        if (!matchId || !courtId || !scheduledTime) {
          continue;
        }
        
        const match = await storage.getMatch(matchId);
        if (!match) continue;
        
        const updatedMatch = await storage.updateMatch(matchId, {
          courtId,
          scheduledTime: new Date(scheduledTime)
        });
        
        updatedMatches.push(updatedMatch);
      }
      
      res.json(updatedMatches);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  // Get tournament details with all related data
  app.get("/api/tournaments/:id/details", async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).send("Invalid ID");
    
    try {
      const tournament = await storage.getTournament(id);
      if (!tournament) return res.status(404).send("Tournament not found");
      
      // Get venues and courts
      const venues = await storage.getVenuesByTournamentId(id);
      const venuesWithCourts = await Promise.all(
        venues.map(async (venue) => {
          const courts = await storage.getCourtsByVenueId(venue.id);
          return { ...venue, courts };
        })
      );
      
      // Get categories
      const categories = await storage.getCategoriesByTournamentId(id);
      const categoriesWithDetails = await Promise.all(
        categories.map(async (category) => {
          const teams = await storage.getTeamsByCategoryId(category.id);
          const groups = await storage.getGroupsByCategoryId(category.id);
          
          const groupsWithTeams = await Promise.all(
            groups.map(async (group) => {
              const assignments = await storage.getGroupAssignmentsByGroupId(group.id);
              const assignmentsWithTeams = await Promise.all(
                assignments.map(async (assignment) => {
                  const team = await storage.getTeam(assignment.teamId);
                  return { ...assignment, team };
                })
              );
              
              return { ...group, assignments: assignmentsWithTeams };
            })
          );
          
          const matches = await storage.getMatchesByCategoryId(category.id);
          const matchesWithTeams = await Promise.all(
            matches.map(async (match) => {
              let teamA = null;
              let teamB = null;
              
              if (match.teamAId > 0) {
                teamA = await storage.getTeam(match.teamAId);
              }
              
              if (match.teamBId > 0) {
                teamB = await storage.getTeam(match.teamBId);
              }
              
              return { ...match, teamA, teamB };
            })
          );
          
          return {
            ...category,
            teams,
            groups: groupsWithTeams,
            matches: matchesWithTeams,
          };
        })
      );
      
      // Count total matches and completed matches
      let totalMatches = 0;
      let completedMatches = 0;
      
      categoriesWithDetails.forEach(category => {
        totalMatches += category.matches.length;
        completedMatches += category.matches.filter(m => m.completed).length;
      });
      
      // Return comprehensive tournament data
      res.json({
        ...tournament,
        venues: venuesWithCourts,
        categories: categoriesWithDetails,
        stats: {
          totalTeams: categoriesWithDetails.reduce((sum, c) => sum + c.teams.length, 0),
          totalMatches,
          completedMatches
        }
      });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
