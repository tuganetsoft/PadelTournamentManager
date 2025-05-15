import { useState, useCallback, useEffect } from 'react';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

// Define types for group management
interface Team {
  id: number;
  name: string;
  player1?: string;
  player2?: string;
  seeded?: boolean;
  categoryId: number;
}

interface Group {
  id: number;
  name: string;
  categoryId: number;
  assignments: GroupAssignment[];
}

interface GroupAssignment {
  id: number;
  groupId: number;
  teamId: number;
  played: number;
  won: number;
  lost: number;
  points: number;
  team: Team;
}

interface GroupTeamOperation {
  teamId: number;
  groupId: number;
  operation: string; // 'add' | 'remove' | 'move'
  sourceGroupId?: number;
}

interface GroupState {
  groups: Group[];
  unassignedTeams: Team[];
  hasUnsavedChanges: boolean;
  operations: any[]; // More flexible type for operations
}

/**
 * Custom hook for managing group state in a category
 */
export function useGroupState(
  categoryId: number,
  initialGroups: Group[] = [],
  initialTeams: Team[] = []
) {
  const { toast } = useToast();
  const [state, setState] = useState<GroupState>({
    groups: initialGroups,
    unassignedTeams: [],
    hasUnsavedChanges: false,
    operations: []
  });

  // Initialize unassigned teams
  useEffect(() => {
    if (initialGroups && initialTeams) {
      // Find all assigned team IDs
      const assignedTeamIds = new Set<number>();
      initialGroups.forEach(group => {
        group.assignments.forEach(assignment => {
          assignedTeamIds.add(assignment.teamId);
        });
      });
      
      // Find unassigned teams
      const unassigned = initialTeams.filter(team => !assignedTeamIds.has(team.id));
      
      setState(prev => ({
        ...prev,
        groups: initialGroups,
        unassignedTeams: unassigned,
        hasUnsavedChanges: false,
        operations: []
      }));
    }
  }, [initialGroups, initialTeams]);

  /**
   * Assign a team to a group
   */
  const assignTeam = useCallback(async (teamId: number, groupId: number) => {
    try {
      // Optimistically update UI state
      setState(prev => {
        // Find the team from unassigned teams
        const team = prev.unassignedTeams.find(t => t.id === teamId);
        if (!team) return prev; // Team not found
        
        // Remove from unassigned teams
        const newUnassignedTeams = prev.unassignedTeams.filter(t => t.id !== teamId);
        
        // Add to group
        const newGroups = prev.groups.map(group => {
          if (group.id === groupId) {
            // Create a new assignment
            const newAssignment: GroupAssignment = {
              id: -1, // Temporary ID until saved
              groupId,
              teamId,
              played: 0,
              won: 0,
              lost: 0,
              points: 0,
              team
            };
            
            // Add to this group
            return {
              ...group,
              assignments: [...group.assignments, newAssignment]
            };
          }
          return group;
        });
        
        // Add to operations list
        const newOperations = [...prev.operations, { 
          teamId, 
          groupId, 
          operation: 'add' 
        }];
        
        return {
          ...prev,
          groups: newGroups,
          unassignedTeams: newUnassignedTeams,
          hasUnsavedChanges: true,
          operations: newOperations
        };
      });
      
      // Make API call to assign team to group
      await apiRequest('POST', '/api/group-assignments', {
        teamId,
        groupId,
        played: 0,
        won: 0,
        lost: 0,
        points: 0
      });
      
      console.log(`Team ${teamId} assigned to group ${groupId}`);
    } catch (error) {
      console.error('Error assigning team to group:', error);
      toast({
        title: 'Error',
        description: 'Failed to assign team to group.',
        variant: 'destructive'
      });
    }
  }, [toast]);

  /**
   * Remove a team from a group
   */
  const removeTeam = useCallback(async (teamId: number, groupId: number) => {
    try {
      // Find the assignment
      let assignmentId: number | undefined;
      let team: Team | undefined;
      
      setState(prev => {
        // Find the group containing the team
        const group = prev.groups.find(g => g.id === groupId);
        if (!group) return prev;
        
        // Find the assignment for this team
        const assignment = group.assignments.find(a => a.teamId === teamId);
        if (!assignment) return prev;
        
        // Save the assignment ID and team for the API call
        assignmentId = assignment.id;
        team = assignment.team;
        
        // Remove the team from the group
        const newGroups = prev.groups.map(g => {
          if (g.id === groupId) {
            return {
              ...g,
              assignments: g.assignments.filter(a => a.teamId !== teamId)
            };
          }
          return g;
        });
        
        // Add back to unassigned teams
        const newUnassignedTeams = team 
          ? [...prev.unassignedTeams, team]
          : prev.unassignedTeams;
        
        // Add to operations list
        const newOperations = [...prev.operations, { 
          teamId, 
          groupId, 
          operation: 'remove' 
        }];
        
        return {
          ...prev,
          groups: newGroups,
          unassignedTeams: newUnassignedTeams,
          hasUnsavedChanges: true,
          operations: newOperations
        };
      });
      
      // Only make API call if assignment exists in database
      if (assignmentId && assignmentId > 0) {
        await apiRequest('DELETE', `/api/group-assignments/${assignmentId}`);
        console.log(`Removed team ${teamId} from group ${groupId}`);
      }
    } catch (error) {
      console.error('Error removing team from group:', error);
      toast({
        title: 'Error',
        description: 'Failed to remove team from group.',
        variant: 'destructive'
      });
    }
  }, [toast]);

  /**
   * Move a team from one group to another
   */
  const moveTeam = useCallback(async (teamId: number, sourceGroupId: number, targetGroupId: number) => {
    try {
      // Find the assignment
      let assignmentId: number | undefined;
      let team: Team | undefined;
      
      setState(prev => {
        // Find the source group
        const sourceGroup = prev.groups.find(g => g.id === sourceGroupId);
        if (!sourceGroup) return prev;
        
        // Find the assignment
        const assignment = sourceGroup.assignments.find(a => a.teamId === teamId);
        if (!assignment) return prev;
        
        // Save the assignment ID and team for the API call
        assignmentId = assignment.id;
        team = assignment.team;
        
        // Remove from source group
        const newGroups = prev.groups.map(g => {
          if (g.id === sourceGroupId) {
            return {
              ...g,
              assignments: g.assignments.filter(a => a.teamId !== teamId)
            };
          } else if (g.id === targetGroupId && team) {
            // Add to target group
            const newAssignment: GroupAssignment = {
              id: -1, // Temporary ID until saved
              groupId: targetGroupId,
              teamId,
              played: 0,
              won: 0,
              lost: 0,
              points: 0,
              team: team
            };
            
            return {
              ...g,
              assignments: [...g.assignments, newAssignment]
            };
          }
          return g;
        });
        
        // Add to operations list
        const newOperations = [...prev.operations, { 
          teamId, 
          groupId: targetGroupId, 
          operation: 'move',
          sourceGroupId 
        }];
        
        return {
          ...prev,
          groups: newGroups,
          hasUnsavedChanges: true,
          operations: newOperations
        };
      });
      
      // API call to update assignment
      if (assignmentId && assignmentId > 0) {
        // Update the assignment with the new group
        await apiRequest('PATCH', `/api/group-assignments/${assignmentId}`, {
          groupId: targetGroupId
        });
      } else {
        // Create a new assignment
        await apiRequest('POST', '/api/group-assignments', {
          teamId,
          groupId: targetGroupId,
          played: 0,
          won: 0,
          lost: 0,
          points: 0
        });
      }
      
      console.log(`Moved team ${teamId} from group ${sourceGroupId} to ${targetGroupId}`);
    } catch (error) {
      console.error('Error moving team between groups:', error);
      toast({
        title: 'Error',
        description: 'Failed to move team between groups.',
        variant: 'destructive'
      });
    }
  }, [toast]);

  /**
   * Save all pending group assignments
   */
  const saveAssignments = useCallback(async () => {
    try {
      console.log('Saving all group assignments...');
      
      // Collect current assignments from state
      const currentAssignments = state.groups.flatMap(group => 
        group.assignments.map(assignment => ({
          teamId: assignment.teamId,
          groupId: group.id
        }))
      );
      
      // Send all current assignments to server
      const res = await apiRequest(
        'POST',
        `/api/categories/${categoryId}/save-assignments`,
        { assignments: currentAssignments }
      );
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to save team assignments');
      }
      
      const result = await res.json();
      console.log('Save assignments result:', result);
      
      // Reset state
      setState(prev => ({
        ...prev,
        hasUnsavedChanges: false,
        operations: []
      }));
      
      toast({
        title: 'Success',
        description: 'Team assignments have been saved.',
      });
      
      // Refresh data
      queryClient.invalidateQueries({ queryKey: [`/api/categories/${categoryId}/details`] });
      
      return result;
    } catch (error) {
      console.error('Error saving assignments:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to save team assignments',
        variant: 'destructive'
      });
      throw error;
    }
  }, [categoryId, state.groups, toast]);

  /**
   * Auto-assign teams to groups
   */
  const autoAssignTeams = useCallback(async () => {
    try {
      const res = await apiRequest(
        'POST',
        `/api/categories/${categoryId}/auto-assign-teams`
      );
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to auto-assign teams');
      }
      
      toast({
        title: 'Success',
        description: 'Teams have been automatically assigned to groups.',
      });
      
      // Refresh data
      queryClient.invalidateQueries({ queryKey: [`/api/categories/${categoryId}/details`] });
      
      return await res.json();
    } catch (error) {
      console.error('Error auto-assigning teams:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to auto-assign teams',
        variant: 'destructive'
      });
      throw error;
    }
  }, [categoryId, toast]);

  /**
   * Reset all assignments and return to initial state
   */
  const resetAssignments = useCallback(() => {
    // Reset to initial state
    if (initialGroups && initialTeams) {
      // Find all assigned team IDs
      const assignedTeamIds = new Set<number>();
      initialGroups.forEach(group => {
        group.assignments.forEach(assignment => {
          assignedTeamIds.add(assignment.teamId);
        });
      });
      
      // Find unassigned teams
      const unassigned = initialTeams.filter(team => !assignedTeamIds.has(team.id));
      
      setState({
        groups: initialGroups,
        unassignedTeams: unassigned,
        hasUnsavedChanges: false,
        operations: []
      });
      
      toast({
        title: 'Reset',
        description: 'All unsaved changes have been discarded.',
      });
    }
  }, [initialGroups, initialTeams, toast]);

  return {
    groups: state.groups,
    unassignedTeams: state.unassignedTeams,
    hasUnsavedChanges: state.hasUnsavedChanges,
    assignTeam,
    removeTeam,
    moveTeam,
    saveAssignments,
    autoAssignTeams,
    resetAssignments
  };
}