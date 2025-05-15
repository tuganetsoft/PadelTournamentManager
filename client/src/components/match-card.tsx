import { Badge } from "@/components/ui/badge";

type MatchCardProps = {
  match: {
    id: number;
    teamA?: { name: string } | null;
    teamB?: { name: string } | null;
    teamAId: number;
    teamBId: number;
    round?: string;
    groupId?: number;
    category: {
      name: string;
      id: number;
    };
    completed?: boolean;
    winner?: number | null;
  };
};

export function MatchCard({ match }: MatchCardProps) {
  // Determine category color for styling
  const getCategoryColor = () => {
    const categoryName = match.category.name.toLowerCase();
    if (categoryName.includes('men')) {
      return 'bg-blue-100 border-blue-300';
    } else if (categoryName.includes('women')) {
      return 'bg-green-100 border-green-300';
    } else if (categoryName.includes('mixed')) {
      return 'bg-violet-100 border-violet-300';
    } else {
      return 'bg-amber-100 border-amber-300';
    }
  };

  const statusBadge = match.completed ? (
    <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">
      Completed
    </Badge>
  ) : (
    <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300">
      Scheduled
    </Badge>
  );

  return (
    <div className={`h-full w-full flex items-center justify-center ${getCategoryColor()} border rounded-md p-2`}>
      <div className="text-xs text-center space-y-1">
        <div className="font-medium text-neutral-dark">{match.category.name}</div>
        <div>
          {match.teamA?.name || `Team ID: ${match.teamAId}`} vs {match.teamB?.name || `Team ID: ${match.teamBId}`}
        </div>
        <div className="text-neutral-dark text-[10px]">
          {match.round === 'GROUP' ? `Group ${match.groupId ? String.fromCharCode(64 + match.groupId) : ''}` : match.round}
        </div>
        {match.completed && (
          <div className="text-neutral-dark text-[10px]">
            Winner: {match.winner === match.teamAId
              ? match.teamA?.name
              : match.winner === match.teamBId
                ? match.teamB?.name
                : 'Not set'
            }
          </div>
        )}
      </div>
    </div>
  );
}
