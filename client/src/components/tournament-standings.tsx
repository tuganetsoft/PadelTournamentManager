import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useState } from "react";

type TournamentStandingsProps = {
  groups: {
    id: number;
    name: string;
    assignments: {
      id: number;
      teamId: number;
      played: number;
      won: number;
      lost: number;
      points: number;
      team: {
        id: number;
        name: string;
        player1: string;
        player2: string;
      };
    }[];
  }[];
};

export function TournamentStandings({ groups }: TournamentStandingsProps) {
  const [activeGroup, setActiveGroup] = useState<string>(groups[0]?.id.toString() || "");

  // When groups are provided in a grid layout
  if (groups.length > 3) {
    return (
      <Tabs 
        value={activeGroup} 
        onValueChange={setActiveGroup} 
        className="w-full"
      >
        <TabsList className="grid grid-cols-4 mb-4">
          {groups.map((group) => (
            <TabsTrigger 
              key={group.id} 
              value={group.id.toString()}
              className="data-[state=active]:bg-primary data-[state=active]:text-white"
            >
              Group {group.name}
            </TabsTrigger>
          ))}
        </TabsList>
        
        {groups.map((group) => (
          <TabsContent key={group.id} value={group.id.toString()}>
            <StandingsTable group={group} />
          </TabsContent>
        ))}
      </Tabs>
    );
  }

  // When we have 1-3 groups, display them in a grid
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {groups.map((group) => (
        <div key={group.id} className="border border-neutral-light rounded-lg overflow-hidden">
          <div className="bg-neutral-lighter px-4 py-2 font-medium text-neutral-dark border-b border-neutral-light">
            Group {group.name}
          </div>
          <div className="p-4">
            <StandingsTable group={group} />
          </div>
        </div>
      ))}
    </div>
  );
}

function StandingsTable({ group }: { group: TournamentStandingsProps["groups"][0] }) {
  // Sort teams by points (descending), then by won (descending)
  const sortedAssignments = [...group.assignments].sort((a, b) => {
    if (a.points !== b.points) {
      return b.points - a.points;
    }
    return b.won - a.won;
  });

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[50%]">Team</TableHead>
          <TableHead className="text-center">P</TableHead>
          <TableHead className="text-center">W</TableHead>
          <TableHead className="text-center">L</TableHead>
          <TableHead className="text-center">PTS</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sortedAssignments.map((assignment) => (
          <TableRow key={assignment.id}>
            <TableCell className="font-medium">{assignment.team.name}</TableCell>
            <TableCell className="text-center">{assignment.played}</TableCell>
            <TableCell className="text-center">{assignment.won}</TableCell>
            <TableCell className="text-center">{assignment.lost}</TableCell>
            <TableCell className="text-center font-medium text-primary">{assignment.points}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
