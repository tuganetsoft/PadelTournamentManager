import { useState, useEffect } from "react";
import { useParams, Link, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { 
  Form, 
  FormControl, 
  FormDescription,
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, ArrowLeft, Edit, PlusCircle, Trash, Users, UserPlus, UserMinus, Loader2, GitBranch, FileText, Layers, Save } from "lucide-react";
import { TeamForm } from "@/components/team-form";
import { TeamEditForm } from "@/components/team-edit-form";
import { EliminationBracket } from "@/components/elimination-bracket";
import { TournamentStandings } from "@/components/tournament-standings";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { GameFormats, CategoryStatus } from "@shared/schema";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
// DND imports removed

// Type for Category Details
interface CategoryDetail {
  id: number;
  name: string;
  format: string;
  matchDuration: number;
  status: string;
  tournamentId: number;
  tournament?: {
    id: number;
    name: string;
  };
  teams: Array<{
    id: number;
    name: string;
    player1: string;
    player2?: string;
    categoryId: number;
    seeded?: boolean;
  }>;
  groups: Array<{
    id: number;
    name: string;
    categoryId: number;
    assignments: Array<{
      id: number;
      groupId: number;
      teamId: number;
      played: number;
      won: number;
      lost: number;
      points: number;
      team: {
        id: number;
        name: string;
        player1: string;
        player2?: string;
        categoryId: number;
        seeded?: boolean;
      };
    }>;
  }>;
  matches: Array<{
    id: number;
    categoryId: number;
    teamAId: number;
    teamBId: number;
    groupId?: number;
    round?: string;
    scoreA?: string;
    scoreB?: string;
    winner?: number;
    courtId?: number;
    scheduledTime?: string;
    completed: boolean;
    teamA?: {
      id: number;
      name: string;
      player1: string;
      player2?: string;
    };
    teamB?: {
      id: number;
      name: string;
      player1: string;
      player2?: string;
    };
  }>;
}

// Schema for bulk team import
const bulkTeamImportSchema = z.object({
  teamNames: z.string().min(1, "Team names are required")
});

// Schema for group creation
const createGroupSchema = z.object({
  groupCount: z.string().transform(val => parseInt(val, 10))
});

// Schema for match generation
const generateMatchesSchema = z.object({
  matchType: z.enum(["ROUND_ROBIN", "SINGLE_ELIMINATION"]),
  autoAssignCourts: z.boolean().default(false),
});

// Define Team type for drag and drop
type Team = {
  id: number;
  name: string;
  player1: string;
  player2?: string;
  categoryId: number;
  seeded?: boolean;
};

// DnD component removed

// Simple team component without complex dependencies
function TeamCard({
  team,
  onEdit,
  onDelete,
  onAssign,
  showAssignControls = false,
  groups = []
}: {
  team: any;
  onEdit: () => void;
  onDelete: () => void;
  onAssign?: (groupId: number) => void;
  showAssignControls?: boolean;
  groups?: any[];
}) {
  return (
    <div className="border rounded-lg p-4">
      <div className="flex flex-col gap-2">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-medium">{team.name}</h3>
            <div className="text-sm text-muted-foreground">
              {team.player1 && <p>Player 1: {team.player1}</p>}
              {team.player2 && <p>Player 2: {team.player2}</p>}
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="icon" onClick={onEdit}>
              <Edit className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={onDelete}>
              <Trash className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        {/* Assign to group controls */}
        {showAssignControls && onAssign && groups.length > 0 && (
          <div className="mt-2">
            <Select onValueChange={(groupId) => onAssign(parseInt(groupId))}>
              <SelectTrigger>
                <SelectValue placeholder="Assign to group..." />
              </SelectTrigger>
              <SelectContent>
                {groups.map(group => (
                  <SelectItem key={group.id} value={group.id.toString()}>
                    Group {group.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>
    </div>
  );
}

// Group team card with move/remove controls
function GroupTeamCard({
  team,
  onEdit,
  onMove,
  onRemove,
  otherGroups = []
}: {
  team: any;
  onEdit: () => void;
  onMove: (targetGroupId: number) => void;
  onRemove: () => void;
  otherGroups: any[];
}) {
  return (
    <div className="border rounded-lg p-4">
      <div className="flex flex-col gap-2">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-medium">{team.name}</h3>
            <div className="text-sm text-muted-foreground">
              {team.player1 && <p>Player 1: {team.player1}</p>}
              {team.player2 && <p>Player 2: {team.player2}</p>}
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="icon" onClick={onEdit}>
              <Edit className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        <div className="flex gap-2 mt-2">
          {/* Move to another group dropdown */}
          {otherGroups.length > 0 && (
            <Select onValueChange={(targetGroupId) => onMove(parseInt(targetGroupId))}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Move to group..." />
              </SelectTrigger>
              <SelectContent>
                {otherGroups.map(g => (
                  <SelectItem key={g.id} value={g.id.toString()}>
                    Group {g.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          
          {/* Remove from group button */}
          <Button 
            variant="outline" 
            size="sm"
            className="flex-shrink-0"
            onClick={onRemove}
          >
            <UserMinus className="h-4 w-4 mr-2" />
            Remove
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function CategoryDetail() {
  const { id, tournamentId } = useParams();
  const [, navigate] = useLocation();
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("teams");
  const [bulkImportOpen, setBulkImportOpen] = useState(false);
  const [createGroupsOpen, setCreateGroupsOpen] = useState(false);
  const [generateMatchesOpen, setGenerateMatchesOpen] = useState(false);
  const [unassignedTeams, setUnassignedTeams] = useState<any[]>([]);
  const [groupsWithTeams, setGroupsWithTeams] = useState<any[]>([]);
  
  // DnD sensors removed

  // Fetch category details
  const {
    data: category,
    isLoading,
    error,
  } = useQuery<CategoryDetail>({
    queryKey: [`/api/categories/${id}/details`],
    enabled: !!id,
  });
  
  // Toggle team seeded status
  const toggleSeededMutation = useMutation({
    mutationFn: async ({ teamId, seeded }: { teamId: number; seeded: boolean }) => {
      await apiRequest("PATCH", `/api/teams/${teamId}`, { seeded });
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/categories/${id}/details`] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error updating team",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  // Add delete team mutation
  const deleteTeamMutation = useMutation({
    mutationFn: async (teamId: number) => {
      const res = await apiRequest("DELETE", `/api/teams/${teamId}`);
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to delete team");
      }
      return { success: true };
    },
    onSuccess: () => {
      toast({
        title: "Team deleted",
        description: "The team has been deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/categories/${id}/details`] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error deleting team",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  // Save team assignments mutation
  const saveTeamAssignmentsMutation = useMutation({
    mutationFn: async () => {
      console.log("Saving team assignments...");
      
      // Collect current assignments from all groups
      const currentAssignments: { teamId: number; groupId: number }[] = [];
      
      // If we have category data with groups, collect all current assignments
      if (category?.groups) {
        category.groups.forEach(group => {
          group.assignments.forEach(assignment => {
            currentAssignments.push({
              teamId: assignment.teamId,
              groupId: group.id
            });
          });
        });
      }
      
      console.log("Current assignments to save:", currentAssignments);
      
      // Send the current assignments to the server
      const res = await apiRequest(
        "POST", 
        `/api/categories/${id}/save-assignments`,
        { assignments: currentAssignments }
      );
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to save team assignments");
      }
      return await res.json();
    },
    onSuccess: (data) => {
      console.log("Team assignments saved successfully:", data);
      toast({
        title: "Team assignments saved",
        description: "All team assignments have been saved successfully",
      });
      
      // Reset UI state
      setHasUnsavedChanges(false);
      
      // Refresh the data
      queryClient.invalidateQueries({ queryKey: [`/api/categories/${id}/details`] });
    },
    onError: (error: Error) => {
      console.error("Error saving assignments:", error);
      toast({
        title: "Error saving assignments",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Fetch tournament details
  const { data: tournament } = useQuery({
    queryKey: [`/api/tournaments/${tournamentId}`],
    enabled: !!tournamentId,
  });

  // Bulk team import form
  const bulkImportForm = useForm({
    resolver: zodResolver(bulkTeamImportSchema),
    defaultValues: {
      teamNames: "",
    },
  });

  // Create groups form
  const createGroupsForm = useForm({
    resolver: zodResolver(createGroupSchema),
    defaultValues: {
      groupCount: "2",
    },
  });

  // Generate matches form
  const generateMatchesForm = useForm({
    resolver: zodResolver(generateMatchesSchema),
    defaultValues: {
      matchType: "ROUND_ROBIN" as const,
      autoAssignCourts: false,
    },
  });

  // Bulk import teams mutation
  const bulkImportMutation = useMutation({
    mutationFn: async (data: { teamNames: string }) => {
      const teamLines = data.teamNames
        .split("\\n")
        .map((name) => name.trim())
        .filter((name) => name.length > 0);

      // Create all teams
      const promises = teamLines.map((line) => {
        const isSeeded = line.startsWith('*');
        const teamName = isSeeded ? line.substring(1).trim() : line;
        
        return apiRequest("POST", "/api/teams", {
          name: teamName,
          player1: "",
          player2: "",
          categoryId: Number(id),
          seeded: isSeeded
        });
      });

      await Promise.all(promises);
      return { success: true };
    },
    onSuccess: () => {
      toast({
        title: "Teams imported",
        description: "Teams have been successfully imported",
      });
      bulkImportForm.reset();
      setBulkImportOpen(false);
      queryClient.invalidateQueries({ queryKey: [`/api/categories/${id}/details`] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error importing teams",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Create groups mutation
  const createGroupsMutation = useMutation({
    mutationFn: async (data: { groupCount: number }) => {
      // Create all groups at once via the batch endpoint
      const response = await apiRequest("POST", `/api/categories/${id}/create-groups`, {
        groupCount: data.groupCount
      });
      const result = await response.json();
      return result;
    },
    onSuccess: () => {
      toast({
        title: "Groups created",
        description: "Groups have been successfully created",
      });
      createGroupsForm.reset();
      setCreateGroupsOpen(false);
      // Refetch category details data
      queryClient.invalidateQueries({ queryKey: [`/api/categories/${id}/details`] });
      // Also refresh any list that might show this category
      queryClient.invalidateQueries({ queryKey: [`/api/tournaments/${tournamentId}/details`] });
      // Force UI update
      setTimeout(() => {
        if (category) {
          const groupCount = parseInt(createGroupsForm.getValues().groupCount, 10);
          setGroupsWithTeams(prevGroups => [
            ...prevGroups, 
            ...Array.from({ length: groupCount }, (_, i) => ({
              id: -1 * (i + 1), // Temporary ID until refresh
              name: `Group ${String.fromCharCode(65 + prevGroups.length + i)}`,
              categoryId: Number(id),
              assignments: [],
            }))
          ]);
        }
      }, 100);
    },
    onError: (error: Error) => {
      toast({
        title: "Error creating groups",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Auto-assign teams to groups mutation
  const autoAssignTeamsMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", `/api/categories/${id}/auto-assign-teams`, {});
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Teams assigned",
        description: "Teams have been automatically assigned to groups",
      });
      
      // Optimistic UI update to show teams as assigned
      // Move all unassigned teams to groups (rough estimation since we don't know exact group assignment)
      if (category && groupsWithTeams.length > 0) {
        const teams = [...unassignedTeams];
        setUnassignedTeams([]); // Clear unassigned teams
        
        // Distribute teams evenly across groups (not the real algorithm but a visual estimation)
        const updatedGroups = [...groupsWithTeams];
        let groupIndex = 0;
        
        // First assign seeded teams
        const seededTeams = teams.filter(team => team.seeded);
        for (const team of seededTeams) {
          if (groupIndex >= updatedGroups.length) groupIndex = 0;
          
          updatedGroups[groupIndex] = {
            ...updatedGroups[groupIndex],
            assignments: [
              ...updatedGroups[groupIndex].assignments,
              {
                id: -1, // Temporary ID
                groupId: updatedGroups[groupIndex].id,
                teamId: team.id,
                played: 0,
                won: 0,
                lost: 0,
                points: 0,
                team: team
              }
            ]
          };
          groupIndex++;
        }
        
        // Then assign non-seeded teams
        const nonSeededTeams = teams.filter(team => !team.seeded);
        for (const team of nonSeededTeams) {
          if (groupIndex >= updatedGroups.length) groupIndex = 0;
          
          updatedGroups[groupIndex] = {
            ...updatedGroups[groupIndex],
            assignments: [
              ...updatedGroups[groupIndex].assignments,
              {
                id: -1, // Temporary ID
                groupId: updatedGroups[groupIndex].id,
                teamId: team.id,
                played: 0,
                won: 0,
                lost: 0,
                points: 0,
                team: team
              }
            ]
          };
          groupIndex++;
        }
        
        setGroupsWithTeams(updatedGroups);
      }
      
      // Refetch category details data
      queryClient.invalidateQueries({ queryKey: [`/api/categories/${id}/details`] });
      // Also refresh any list that might show this category
      queryClient.invalidateQueries({ queryKey: [`/api/tournaments/${tournamentId}/details`] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error assigning teams",
        description: error.message,
        variant: "destructive",
      });
      
      // Revert any optimistic UI updates
      if (category) {
        const assignedTeamIds = category.groups.flatMap(g => 
          g.assignments.map(a => a.teamId)
        );
        
        const unassigned = category.teams.filter(
          team => !assignedTeamIds.includes(team.id)
        );

        setUnassignedTeams(unassigned);
        setGroupsWithTeams(category.groups);
      }
    }
  });

  // Generate matches mutation
  const generateMatchesMutation = useMutation({
    mutationFn: async (data: z.infer<typeof generateMatchesSchema>) => {
      const response = await apiRequest("POST", `/api/categories/${id}/generate-matches`, {
        matchType: data.matchType,
        autoAssignCourts: data.autoAssignCourts,
      });
      return await response.json();
    },
    onSuccess: (result) => {
      toast({
        title: "Matches generated",
        description: "Matches have been successfully generated",
      });
      generateMatchesForm.reset();
      setGenerateMatchesOpen(false);
      
      // Set active tab to matches to show the newly generated matches
      setActiveTab("matches");
      
      // Refresh data to get the latest matches
      queryClient.invalidateQueries({ queryKey: [`/api/categories/${id}/details`] });
      
      // Also refresh any list that might show this category
      queryClient.invalidateQueries({ queryKey: [`/api/tournaments/${tournamentId}/details`] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error generating matches",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Prepare teams and groups data for drag-and-drop interface
  useEffect(() => {
    if (category) {
      // Get all teams that are not assigned to any group
      const assignedTeamIds = category.groups.flatMap(g => 
        g.assignments.map(a => a.teamId)
      );
      
      const unassigned = category.teams.filter(
        team => !assignedTeamIds.includes(team.id)
      );

      setUnassignedTeams(unassigned);
      setGroupsWithTeams(category.groups);
    }
  }, [category]);

  // Handle drag end for team assignment
  // DnD handleDragEnd function removed

  // Assign team to group
  // Manual team assignment functions removed - Using auto-assign only

  // Bulk import teams form submission
  const onSubmitBulkImport = (data: z.infer<typeof bulkTeamImportSchema>) => {
    bulkImportMutation.mutate(data);
  };

  // Create groups form submission
  const onSubmitCreateGroups = (data: z.infer<typeof createGroupSchema>) => {
    createGroupsMutation.mutate(data);
  };

  // Generate matches form submission
  const onSubmitGenerateMatches = (data: z.infer<typeof generateMatchesSchema>) => {
    generateMatchesMutation.mutate(data);
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="container py-6">
          <div className="flex items-center mb-6">
            <Button variant="ghost" size="icon" className="mr-2" asChild>
              <Link to={`/tournaments/${tournamentId}`}>
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <Skeleton className="h-8 w-64" />
          </div>
          <Skeleton className="h-12 w-full mb-6" />
          <Skeleton className="h-64 w-full" />
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="container py-6">
          <div className="flex items-center mb-6">
            <Button variant="ghost" size="icon" className="mr-2" asChild>
              <Link to={`/tournaments/${tournamentId}`}>
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <h1 className="text-2xl font-bold">Error</h1>
          </div>
          <p className="text-destructive">
            Failed to load category details: {error.message}
          </p>
        </div>
      </Layout>
    );
  }

  if (!category) return null;

  return (
    <Layout>
      <div className="container py-6">
        <div className="flex items-center mb-6">
          <Button variant="ghost" size="icon" className="mr-2" asChild>
            <Link to={`/tournaments/${tournamentId}`}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">{category.name}</h1>
          <div className="ml-auto flex items-center gap-2">
            <Button variant="outline" size="sm">
              Edit Category
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="md:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Format</h3>
                    <p>{category.format === "GROUPS" 
                        ? "Groups" 
                        : category.format === "SINGLE_ELIMINATION" 
                            ? "Single Elimination" 
                            : "Groups & Elimination"}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Match Duration</h3>
                    <p>{category.matchDuration} minutes</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Status</h3>
                    <p>{category.status === "REGISTRATION_OPEN" 
                        ? "Registration Open" 
                        : category.status === "ACTIVE" 
                            ? "Active" 
                            : "Completed"}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Teams</h3>
                    <p>{category.teams.length}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Matches</h3>
                    <p>{category.matches.length}</p>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex flex-col items-stretch gap-2">
                {category.format === "GROUPS" && (
                  <>
                    <Button 
                      variant="outline" 
                      className="w-full justify-start" 
                      onClick={() => setCreateGroupsOpen(true)}
                    >
                      <PlusCircle className="mr-2 h-4 w-4" />
                      Create Groups
                    </Button>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button 
                          variant="outline" 
                          className="w-full justify-start"
                          onClick={() => autoAssignTeamsMutation.mutate()}
                          disabled={autoAssignTeamsMutation.isPending}
                        >
                          {autoAssignTeamsMutation.isPending ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <Users className="mr-2 h-4 w-4" />
                          )}
                          Auto-Assign Teams
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs p-3">
                        <p className="font-medium mb-1">Smart Distribution Algorithm</p>
                        <ol className="list-decimal pl-4 space-y-1 text-sm">
                          <li>Seeded teams are distributed first, one per group</li>
                          <li>Non-seeded teams are distributed evenly afterward</li>
                          <li>Teams are randomly shuffled within each priority group</li>
                        </ol>
                      </TooltipContent>
                    </Tooltip>
                  </>
                )}
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => setGenerateMatchesOpen(true)}
                >
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Generate Matches
                </Button>
              </CardFooter>
            </Card>
          </div>

          <div className="md:col-span-3">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid grid-cols-3 w-full">
                <TabsTrigger value="teams">Teams</TabsTrigger>
                {category.format === "GROUPS" && (
                  <TabsTrigger value="groups">Groups</TabsTrigger>
                )}
                <TabsTrigger value="matches">Matches</TabsTrigger>
              </TabsList>

              <TabsContent value="teams" className="mt-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle>Teams</CardTitle>
                      <CardDescription>
                        Manage teams in this category
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Dialog open={bulkImportOpen} onOpenChange={setBulkImportOpen}>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Bulk Import
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Bulk Import Teams</DialogTitle>
                            <DialogDescription>
                              Enter team names, one per line. Mark seeded teams with an asterisk (*) at the beginning of the name.
                            </DialogDescription>
                          </DialogHeader>
                          <Form {...bulkImportForm}>
                            <form 
                              onSubmit={bulkImportForm.handleSubmit(onSubmitBulkImport)}
                              className="space-y-4"
                            >
                              <FormField
                                control={bulkImportForm.control}
                                name="teamNames"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Team Names</FormLabel>
                                    <FormControl>
                                      <Textarea 
                                        {...field} 
                                        placeholder="Team 1\n*Team 2\nTeam 3"
                                        rows={10}
                                      />
                                    </FormControl>
                                    <FormDescription className="space-y-2">
                                      <p>
                                        Add an asterisk (*) at the beginning of a team name to mark it as seeded.
                                        Seeded teams will be evenly distributed across groups during auto-assignment.
                                      </p>
                                      <div className="flex items-start gap-2 p-2 border rounded-md bg-muted text-xs">
                                        <div>
                                          <span className="font-medium">Examples:</span>
                                          <ul className="list-disc pl-4 mt-1">
                                            <li>Team Alpha</li>
                                            <li>*Team Bravo (seeded)</li>
                                            <li>Team Charlie</li>
                                          </ul>
                                        </div>
                                      </div>
                                    </FormDescription>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <DialogFooter>
                                <Button 
                                  type="submit"
                                  disabled={bulkImportMutation.isPending}
                                >
                                  {bulkImportMutation.isPending ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  ) : (
                                    <UserPlus className="mr-2 h-4 w-4" />
                                  )}
                                  Import Teams
                                </Button>
                              </DialogFooter>
                            </form>
                          </Form>
                        </DialogContent>
                      </Dialog>
                      
                      <TeamForm 
                        tournamentId={Number(tournamentId)}
                        categories={[{id: Number(id), name: category?.name || ""}]}
                        onSuccess={() => queryClient.invalidateQueries({ queryKey: [`/api/categories/${id}/details`] })}
                      >
                        <Button>
                          <PlusCircle className="mr-2 h-4 w-4" />
                          Add Team
                        </Button>
                      </TeamForm>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {category.teams.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        No teams added yet
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {category.teams.map((team) => (
                          <div 
                            key={team.id} 
                            className="border border-border rounded-md p-4 bg-card"
                          >
                            <div className="flex justify-between items-center">
                              <div className="flex items-center gap-2">
                                <h3 className="font-medium">{team.name}</h3>
                                {team.seeded && (
                                  <div className="px-2 py-0.5 bg-amber-100 text-amber-800 text-xs rounded-full">
                                    Seeded
                                  </div>
                                )}
                              </div>
                              <div className="flex items-center space-x-1">
                                <TeamEditForm 
                                  team={team}
                                  tournamentId={Number(tournamentId)}
                                  onSuccess={() => queryClient.invalidateQueries({ queryKey: [`/api/categories/${id}/details`] })}
                                >
                                  <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                </TeamEditForm>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-8 w-8"
                                  onClick={() => deleteTeamMutation.mutate(team.id)}
                                  disabled={deleteTeamMutation.isPending}
                                >
                                  {deleteTeamMutation.isPending && deleteTeamMutation.variables === team.id ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <Trash className="h-4 w-4" />
                                  )}
                                </Button>
                              </div>
                            </div>
                            <div className="mt-2 text-sm text-muted-foreground">
                              {team.player1 && <div>Player 1: {team.player1}</div>}
                              {team.player2 && <div>Player 2: {team.player2}</div>}
                              {!team.player1 && !team.player2 && (
                                <div>No players assigned</div>
                              )}
                            </div>
                            <div className="mt-3 pt-3 border-t border-border flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                <Switch 
                                  id={`team-seeded-${team.id}`}
                                  checked={team.seeded || false}
                                  onCheckedChange={(checked) => {
                                    toggleSeededMutation.mutate({ 
                                      teamId: team.id, 
                                      seeded: checked 
                                    });
                                  }}
                                  disabled={toggleSeededMutation.isPending}
                                />
                                <label 
                                  htmlFor={`team-seeded-${team.id}`}
                                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                >
                                  Seeded team
                                </label>
                              </div>
                              {toggleSeededMutation.isPending && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {category.format === "GROUPS" && (
                <TabsContent value="groups" className="mt-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Groups</CardTitle>
                      <CardDescription>
                        Manage groups and team assignments
                      </CardDescription>
                      <div className="flex items-start gap-2 p-3 border rounded-md bg-amber-50 text-amber-800 mt-4 text-sm">
                        <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="font-medium">About Seeded Teams</p>
                          <p className="mt-1">Seeded teams are marked with a badge and will be distributed evenly across 
                          groups during auto-assignment. This ensures balanced competition by preventing the 
                          strongest teams from being placed in the same group.</p>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {category.groups.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          <p className="mb-6">No groups created yet</p>
                          <Button 
                            onClick={() => setCreateGroupsOpen(true)}
                            size="lg"
                          >
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Create Groups
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-6">
                          {/* Teams Assignment section */}
                          <div className="bg-muted p-4 rounded-md">
                            <div className="flex flex-col sm:flex-row gap-3 justify-between items-center">
                              <div>
                                <h3 className="text-lg font-medium">Teams Assignment</h3>
                                <p className="text-sm text-muted-foreground mt-1">
                                  {unassignedTeams.length} teams unassigned
                                </p>
                              </div>
                              <div>
                                <Button 
                                  variant="default" 
                                  onClick={() => autoAssignTeamsMutation.mutate()}
                                  disabled={autoAssignTeamsMutation.isPending || unassignedTeams.length === 0}
                                >
                                  {autoAssignTeamsMutation.isPending ? (
                                    <>
                                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                      Assigning Teams...
                                    </>
                                  ) : (
                                    <>
                                      <Users className="mr-2 h-4 w-4" />
                                      Auto-Assign Teams
                                    </>
                                  )}
                                </Button>
                              </div>
                            </div>
                            
                            {unassignedTeams.length > 0 && (
                              <div className="mt-4 border border-border rounded-md p-4 bg-card">
                                <h4 className="font-medium mb-2">Unassigned Teams</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                  {unassignedTeams.map(team => (
                                    <div key={team.id} className="border border-border rounded-md p-3 bg-white">
                                      <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                          <span className="font-medium">{team.name}</span>
                                          {team.seeded && (
                                            <div className="px-2 py-0.5 bg-amber-100 text-amber-800 text-xs rounded-full">
                                              Seeded
                                            </div>
                                          )}
                                        </div>
                                        <TeamEditForm 
                                          team={team}
                                          tournamentId={Number(tournamentId)}
                                          onSuccess={() => queryClient.invalidateQueries({ queryKey: [`/api/categories/${id}/details`] })}
                                        >
                                          <Button variant="ghost" size="icon" className="h-8 w-8">
                                            <Edit className="h-4 w-4" />
                                          </Button>
                                        </TeamEditForm>
                                      </div>
                                      {(team.player1 || team.player2) && (
                                        <div className="mt-2 text-sm text-muted-foreground">
                                          {team.player1 && <div>Player 1: {team.player1}</div>}
                                          {team.player2 && <div>Player 2: {team.player2}</div>}
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                          
                          {/* Group listing */}
                          {groupsWithTeams.length > 0 && (
                            <div className="space-y-6">
                              <h3 className="text-lg font-medium">Groups</h3>
                              {groupsWithTeams.map(group => (
                                <div key={group.id} className="border border-border p-4 rounded-md">
                                  <h4 className="font-medium text-lg mb-4">Group {group.name}</h4>
                                  <div className="space-y-3">
                                    {group.assignments.length === 0 ? (
                                      <div className="text-center py-4 text-muted-foreground">
                                        No teams assigned to this group
                                      </div>
                                    ) : (
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {group.assignments.map(assignment => (
                                          <div key={assignment.team.id} className="border border-border rounded-md p-3 bg-card">
                                            <div className="flex justify-between items-center">
                                              <div className="flex items-center gap-2">
                                                <span className="font-medium">{assignment.team.name}</span>
                                                {assignment.team.seeded && (
                                                  <div className="px-2 py-0.5 bg-amber-100 text-amber-800 text-xs rounded-full">
                                                    Seeded
                                                  </div>
                                                )}
                                              </div>
                                              <TeamEditForm 
                                                team={assignment.team}
                                                tournamentId={Number(tournamentId)}
                                                onSuccess={() => queryClient.invalidateQueries({ queryKey: [`/api/categories/${id}/details`] })}
                                              >
                                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                                  <Edit className="h-4 w-4" />
                                                </Button>
                                              </TeamEditForm>
                                            </div>
                                            <div className="mt-2 text-sm text-muted-foreground">
                                              {assignment.team.player1 && <div>Player 1: {assignment.team.player1}</div>}
                                              {assignment.team.player2 && <div>Player 2: {assignment.team.player2}</div>}
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                          
                          {/* Action buttons */}
                          <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-between">
                            <div className="flex-1">
                              <Button 
                                variant="outline" 
                                className="w-full"
                                onClick={() => setCreateGroupsOpen(true)}
                              >
                                <PlusCircle className="mr-2 h-4 w-4" />
                                Manage Groups
                              </Button>
                            </div>
                            
                            <div className="flex-1">
                              <Button 
                                variant="outline" 
                                className="w-full"
                                onClick={() => setGenerateMatchesOpen(true)}
                              >
                                <GitBranch className="mr-2 h-4 w-4" />
                                Generate Matches
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              )}

              <TabsContent value="matches" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Matches</CardTitle>
                    <CardDescription>
                      View and manage matches in this category
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {category.matches.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        No matches generated yet
                      </div>
                    ) : (
                      <>
                        {category.format === "GROUPS" && (
                          <TournamentStandings groups={category.groups} />
                        )}
                        
                        {category.format === "SINGLE_ELIMINATION" && (
                          <EliminationBracket matches={category.matches} />
                        )}
                        
                        <div className="mt-8">
                          <h3 className="font-medium mb-4">Match List</h3>
                          <div className="border border-border rounded-md overflow-hidden">
                            <table className="w-full">
                              <thead className="bg-muted">
                                <tr>
                                  <th className="px-4 py-2 text-left">Teams</th>
                                  <th className="px-4 py-2 text-left">Round/Group</th>
                                  <th className="px-4 py-2 text-left">Score</th>
                                  <th className="px-4 py-2 text-left">Status</th>
                                  <th className="px-4 py-2 text-left">Actions</th>
                                </tr>
                              </thead>
                              <tbody>
                                {category.matches.map(match => (
                                  <tr key={match.id} className="border-t border-border">
                                    <td className="px-4 py-2">
                                      {match.teamA?.name || 'TBD'} vs {match.teamB?.name || 'TBD'}
                                    </td>
                                    <td className="px-4 py-2">
                                      {match.groupId ? 
                                        `Group ${category.groups.find(g => g.id === match.groupId)?.name}` : 
                                        match.round
                                      }
                                    </td>
                                    <td className="px-4 py-2">
                                      {match.scoreA ? `${match.scoreA} - ${match.scoreB}` : 'Not played'}
                                    </td>
                                    <td className="px-4 py-2">
                                      {match.completed ? 
                                        <span className="text-green-600">Completed</span> : 
                                        <span className="text-yellow-600">Pending</span>
                                      }
                                    </td>
                                    <td className="px-4 py-2">
                                      <Button variant="ghost" size="sm">
                                        Edit
                                      </Button>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>

      {/* Create Groups Dialog */}
      <Dialog open={createGroupsOpen} onOpenChange={setCreateGroupsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Groups</DialogTitle>
            <DialogDescription>
              Specify the number of groups to create
            </DialogDescription>
          </DialogHeader>
          <Form {...createGroupsForm}>
            <form 
              onSubmit={createGroupsForm.handleSubmit(onSubmitCreateGroups)}
              className="space-y-4"
            >
              <FormField
                control={createGroupsForm.control}
                name="groupCount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Number of Groups</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select number of groups" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {[2, 3, 4, 5, 6, 8].map(count => (
                          <SelectItem key={count} value={count.toString()}>
                            {count} groups
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button 
                  type="submit"
                  disabled={createGroupsMutation.isPending}
                >
                  {createGroupsMutation.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <PlusCircle className="mr-2 h-4 w-4" />
                  )}
                  Create Groups
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Generate Matches Dialog */}
      <Dialog open={generateMatchesOpen} onOpenChange={setGenerateMatchesOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Generate Matches</DialogTitle>
            <DialogDescription>
              Configure match generation options
            </DialogDescription>
          </DialogHeader>
          <Form {...generateMatchesForm}>
            <form 
              onSubmit={generateMatchesForm.handleSubmit(onSubmitGenerateMatches)}
              className="space-y-4"
            >
              <FormField
                control={generateMatchesForm.control}
                name="matchType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Match Type</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select match type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="ROUND_ROBIN">Group Stage</SelectItem>
                        <SelectItem value="SINGLE_ELIMINATION">Knockout / Elimination</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={generateMatchesForm.control}
                name="autoAssignCourts"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <input
                        type="checkbox"
                        checked={field.value}
                        onChange={field.onChange}
                        className="h-4 w-4 rounded border-gray-300 text-primary"
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>
                        Auto-assign courts
                      </FormLabel>
                      <p className="text-sm text-muted-foreground">
                        Automatically assign available courts to matches
                      </p>
                    </div>
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button 
                  type="submit"
                  disabled={generateMatchesMutation.isPending}
                >
                  {generateMatchesMutation.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <PlusCircle className="mr-2 h-4 w-4" />
                  )}
                  Generate Matches
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}