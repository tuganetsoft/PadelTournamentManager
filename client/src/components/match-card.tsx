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
    category?: {
      name: string;
      id: number;
    };
    categoryName?: string; // Added for flattened structure from schedule
    completed?: boolean;
    winner?: number | null;
  };
};

export function MatchCard({ match }: MatchCardProps) {
  // Determine category color for styling
  const getCategoryColor = () => {
    // Get category name from either the category object or the categoryName property
    const categoryName = (match.category?.name || match.categoryName || '').toLowerCase();
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
    <div className={`h-full w-full flex items-center justify-center ${getCategoryColor()} border rounded-md p-1`}>
      <div className="text-[9px] text-center space-y-0 w-full leading-tight">
        <div className="font-medium text-neutral-dark text-[10px]">{match.category?.name || match.categoryName || 'Match'}</div>
        <div className="truncate max-w-full" title={match.teamA?.name || `Team ${match.teamAId}`}>
          {match.teamA?.name || `T${match.teamAId}`}
        </div>
        <div className="text-[8px]">vs</div>
        <div className="truncate max-w-full" title={match.teamB?.name || `Team ${match.teamBId}`}>
          {match.teamB?.name || `T${match.teamBId}`}
        </div>
        <div className="text-neutral-dark text-[8px]">
          {match.round === 'GROUP' ? `G${match.groupId ? String.fromCharCode(64 + match.groupId) : ''}` : match.round}
        </div>
      </div>
    </div>
  );
}
