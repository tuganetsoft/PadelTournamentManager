import { Badge } from "@/components/ui/badge";
import { useLocation } from "wouter";

type CategoryCardProps = {
  category: {
    id: number;
    name: string;
    format: string;
    status: string;
    teams: any[];
    matches: any[];
    tournamentId?: number;
  };
  onClick?: () => void;
  tournamentId?: number;
};

export function CategoryCard({ category, onClick, tournamentId }: CategoryCardProps) {
  const effectiveTournamentId = category.tournamentId || tournamentId;
  const [_, setLocation] = useLocation();
  
  const formatLabel = {
    "GROUPS": "Groups",
    "SINGLE_ELIMINATION": "Single Elimination",
    "GROUPS_AND_ELIMINATION": "Groups + Single Elimination",
  };

  const statusColors = {
    "REGISTRATION_OPEN": "bg-blue-100 text-blue-800",
    "ACTIVE": "bg-green-100 text-green-800",
    "COMPLETED": "bg-gray-100 text-gray-800",
  };

  const statusLabels = {
    "REGISTRATION_OPEN": "Registration Open",
    "ACTIVE": "Active",
    "COMPLETED": "Completed",
  };

  return (
    <div 
      className="border border-neutral-light rounded-lg p-4 hover:border-primary/20 hover:bg-primary/5 transition-colors cursor-pointer"
      onClick={(e) => {
        if (onClick) {
          onClick();
        } else if (effectiveTournamentId) {
          setLocation(`/tournaments/${effectiveTournamentId}/categories/${category.id}`);
        } else {
          setLocation(`/categories/${category.id}`);
        }
      }}
    >
      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-medium text-neutral-dark">{category.name}</h3>
          <p className="text-sm text-neutral-dark mt-1">
            Format: {formatLabel[category.format as keyof typeof formatLabel] || category.format}
          </p>
          <div className="flex items-center text-sm text-neutral-dark mt-2">
            <span className="flex items-center mr-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              {category.teams?.length || 0} Teams
            </span>
            <span className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
              </svg>
              {category.matches?.length || 0} Matches
            </span>
          </div>
        </div>
        <Badge className={statusColors[category.status as keyof typeof statusColors] || "bg-gray-100"}>
          {statusLabels[category.status as keyof typeof statusLabels] || category.status}
        </Badge>
      </div>
    </div>
  );
}
