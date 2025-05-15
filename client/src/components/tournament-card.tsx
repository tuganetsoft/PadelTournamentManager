import { Tournament } from "@shared/schema";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useLocation } from "wouter";
import { format, parseISO, isAfter, isBefore, isToday } from "date-fns";
import { CalendarIcon, MapPinIcon, Trophy } from "lucide-react";

type TournamentCardProps = {
  tournament: Tournament;
};

export function TournamentCard({ tournament }: TournamentCardProps) {
  const [, navigate] = useLocation();
  const startDate = parseISO(tournament.startDate as unknown as string);
  const endDate = parseISO(tournament.endDate as unknown as string);
  const now = new Date();

  let status: { label: string; color: string } = { label: "Upcoming", color: "bg-blue-100 text-blue-800" };
  
  if (isAfter(startDate, now)) {
    status = { label: "Upcoming", color: "bg-blue-100 text-blue-800" };
  } else if (isBefore(endDate, now)) {
    status = { label: "Completed", color: "bg-gray-100 text-gray-800" };
  } else if ((isToday(startDate) || isAfter(now, startDate)) && (isToday(endDate) || isBefore(now, endDate))) {
    status = { label: "In Progress", color: "bg-green-100 text-green-800" };
  }

  const handleClick = () => {
    navigate(`/tournaments/${tournament.id}`);
  };

  return (
    <Card 
      className="hover:shadow-md transition-shadow duration-200 cursor-pointer"
      onClick={handleClick}
    >
      <div className="h-36 relative overflow-hidden rounded-t-lg">
        {tournament.imageUrl ? (
          <img
            src={tournament.imageUrl}
            alt={tournament.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-primary/10 flex items-center justify-center">
            <Trophy className="h-12 w-12 text-primary/40" />
          </div>
        )}
        <div className="absolute top-2 right-2">
          <Badge className={status.color}>
            {status.label}
          </Badge>
        </div>
      </div>
      <CardContent className="p-4">
        <h3 className="font-bold text-lg mb-2 text-neutral-dark">{tournament.name}</h3>
        
        <div className="space-y-1 text-sm text-muted-foreground">
          <div className="flex items-center">
            <CalendarIcon className="h-3.5 w-3.5 mr-1.5" />
            <span>
              {format(startDate, "MMM d")} - {format(endDate, "MMM d, yyyy")}
            </span>
          </div>
          
          {tournament.description && (
            <p className="text-sm line-clamp-2">{tournament.description}</p>
          )}
          
          {!tournament.description && (
            <div className="flex items-center">
              <MapPinIcon className="h-3.5 w-3.5 mr-1.5" />
              <span>No venue specified</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
