import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format, addDays, isSameDay, parseISO, eachDayOfInterval } from "date-fns";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { MatchCard } from "./match-card";
import { Loader2, Save } from "lucide-react";
import { hexToRgba } from "@/lib/utils";

type ScheduleCalendarProps = {
  tournament: any;
  venues: any[];
  startDate: Date;
  endDate: Date;
};

export function ScheduleCalendar({ tournament, venues, startDate, endDate }: ScheduleCalendarProps) {
  const { toast } = useToast();
  const [selectedDate, setSelectedDate] = useState<Date>(startDate);
  const [draggedMatch, setDraggedMatch] = useState<any | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [hoveredCell, setHoveredCell] = useState<string | null>(null);
  const calendarRef = useRef<HTMLDivElement>(null);

  // Generate dates array for the date picker
  const dates = eachDayOfInterval({ start: startDate, end: endDate });

  // Generate time slots for the schedule (every 30 minutes from 9:00 to 22:00)
  const timeSlots = [
    "09:00", "09:30", "10:00", "10:30", "11:00", "11:30", "12:00", "12:30",
    "13:00", "13:30", "14:00", "14:30", "15:00", "15:30", "16:00", "16:30",
    "17:00", "17:30", "18:00", "18:30", "19:00", "19:30", "20:00", "20:30", 
    "21:00", "21:30", "22:00"
  ];

  // Extract all matches from all categories
  const allMatches = tournament?.categories?.flatMap((category: any) => 
    category.matches.map((match: any) => ({
      ...match,
      categoryName: category.name // Add category name for display
    }))
  ) || [];
  
  // Get all matches scheduled for the selected date
  const scheduledMatches = allMatches.filter((match: any) => {
    if (!match.scheduledTime) return false;
    try {
      const matchDate = parseISO(match.scheduledTime);
      return isSameDay(matchDate, selectedDate);
    } catch (error) {
      console.error("Invalid date format:", match.scheduledTime);
      return false;
    }
  });

  // Unscheduled matches are those that don't have a scheduledTime or courtId
  const unscheduledMatches = allMatches.filter((match: any) => 
    !match.scheduledTime || !match.courtId
  );

  // Simple color generator based on courtId
  const getCourtColor = (courtId: number) => {
    const colors = [
      "#3b82f6", // blue
      "#ef4444", // red
      "#10b981", // green
      "#f59e0b", // amber
      "#8b5cf6", // violet
      "#ec4899", // pink
      "#6366f1", // indigo
      "#14b8a6", // teal
      "#f97316", // orange
      "#a855f7"  // purple
    ];
    return colors[courtId % colors.length];
  };

  // Handle drag start for a match
  const handleDragStart = (e: React.DragEvent, match: any) => {
    setDraggedMatch(match);
    setIsDragging(true);
    e.dataTransfer.setData('text/plain', JSON.stringify({ matchId: match.id }));
    
    // Add a ghost image for dragging
    const element = e.currentTarget as HTMLDivElement;
    const rect = element.getBoundingClientRect();
    const ghostElement = element.cloneNode(true) as HTMLDivElement;
    
    // Set some styles for the ghost
    ghostElement.style.position = 'absolute';
    ghostElement.style.top = '-1000px';
    ghostElement.style.opacity = '0.8';
    ghostElement.style.width = `${rect.width}px`;
    
    document.body.appendChild(ghostElement);
    e.dataTransfer.setDragImage(ghostElement, 0, 0);
    
    // Clean up ghost element after dragging
    setTimeout(() => {
      document.body.removeChild(ghostElement);
    }, 0);
  };

  // Handle drag over for schedule cells
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    const element = e.currentTarget as HTMLDivElement;
    const courtId = element.dataset.courtId;
    const timeSlot = element.dataset.timeSlot;
    
    if (courtId && timeSlot) {
      setHoveredCell(`${courtId}-${timeSlot}`);
      element.classList.add('bg-blue-100');
    }
  };

  // Handle drag leave for schedule cells
  const handleDragLeave = (e: React.DragEvent) => {
    const element = e.currentTarget as HTMLDivElement;
    element.classList.remove('bg-blue-100');
    setHoveredCell(null);
  };

  // Handle drop for schedule cells
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const element = e.currentTarget as HTMLDivElement;
    element.classList.remove('bg-blue-100');
    
    // If no match is being dragged, or no court/time data, exit
    if (!draggedMatch) return;
    
    const courtId = parseInt(element.dataset.courtId || '0');
    const timeSlot = element.dataset.timeSlot || '';
    
    if (!courtId || !timeSlot) return;
    
    // Create a date object combining the selected date and time slot
    const [hours, minutes] = timeSlot.split(':').map(Number);
    const scheduledDate = new Date(selectedDate);
    scheduledDate.setHours(hours, minutes, 0, 0);
    
    // If dropping in the "unscheduled" area, we're removing the schedule
    if (courtId === -1) {
      scheduleMatchMutation.mutate({
        matchId: draggedMatch.id,
        data: { courtId: null, scheduledTime: null }
      });
    } else {
      // Schedule the match
      scheduleMatchMutation.mutate({
        matchId: draggedMatch.id,
        data: { courtId, scheduledTime: scheduledDate.toISOString() }
      });
    }
    
    setDraggedMatch(null);
    setIsDragging(false);
  };

  // Mutation for scheduling a match
  const scheduleMatchMutation = useMutation({
    mutationFn: async ({ matchId, data }: { matchId: number; data: any }) => {
      const res = await apiRequest('PATCH', `/api/matches/${matchId}`, data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/tournaments/${tournament.id}/details`] });
      toast({
        title: "Match scheduled",
        description: "The match has been successfully scheduled.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to schedule match",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  return (
    <div className="w-full">
      <div className="mb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
        <h2 className="text-2xl font-bold">Schedule</h2>
        
        <div className="flex gap-2 items-center">
          <Select 
            value={selectedDate.toISOString().split('T')[0]} 
            onValueChange={(value) => setSelectedDate(new Date(value))}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select date" />
            </SelectTrigger>
            <SelectContent>
              {dates.map((date) => (
                <SelectItem key={date.toISOString()} value={date.toISOString().split('T')[0]}>
                  {format(date, "EEEE, MMM d")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="w-full grid grid-cols-1 md:grid-cols-[1fr_3fr] gap-4" ref={calendarRef}>
        {/* Unscheduled matches */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-3 border-b">
            <h3 className="font-semibold">Unscheduled Matches</h3>
          </div>
          <div 
            className="p-3 min-h-[200px] max-h-[80vh] overflow-y-auto"
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            data-court-id="-1"
            data-time-slot="unscheduled"
          >
            {unscheduledMatches.length === 0 ? (
              <p className="text-muted-foreground text-sm">All matches have been scheduled.</p>
            ) : (
              <div className="grid gap-2">
                {unscheduledMatches.map((match: any) => (
                  <div 
                    key={match.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, match)}
                    className="cursor-grab"
                  >
                    <MatchCard match={match} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Calendar Schedule */}
        <div className="overflow-x-auto max-h-[80vh] custom-scrollbar">
          <div 
            className="grid" 
            style={{
              gridTemplateColumns: `50px repeat(${venues?.flatMap(v => v.courts)?.length || 0}, minmax(100px, 120px))`,
              minWidth: '800px',
              width: 'max-content'
            }}
          >
            {/* Time column */}
            <div className="sticky left-0 bg-white z-10 border-r border-neutral-light">
              <div className="h-12 flex items-center justify-center font-medium text-neutral-dark bg-neutral-lighter">
                Time
              </div>
              {timeSlots.map((slot) => (
                <div 
                  key={slot} 
                  className="h-20 flex items-center justify-center text-sm border-b border-neutral-lighter"
                >
                  {slot}
                </div>
              ))}
            </div>

            {/* Courts */}
            {venues?.flatMap(venue => 
              venue.courts?.map((court: any) => {
                const courtColor = getCourtColor(court.id);
                const bgColor = hexToRgba(courtColor, 0.15);
                
                return (
                  <div key={court.id} style={{ backgroundColor: bgColor }}>
                    <div 
                      className="h-12 flex items-center justify-center font-medium text-white border-b border-neutral-light"
                      style={{ backgroundColor: courtColor }}
                    >
                      {court.name}
                    </div>
                  
                    {timeSlots.map((slot) => {
                      const matchesInSlot = scheduledMatches.filter(
                        (match: any) => match.courtId === court.id && 
                        format(parseISO(match.scheduledTime), "HH:mm") === slot
                      );
                      
                      return (
                        <div
                          key={`${court.id}-${slot}`}
                          className="h-20 border-b border-neutral-lighter p-1 relative"
                          data-court-id={court.id}
                          data-time-slot={slot}
                          onDragOver={handleDragOver}
                          onDrop={handleDrop}
                          onDragLeave={handleDragLeave}
                        >
                          {matchesInSlot.map((match: any) => (
                            <div 
                              key={match.id}
                              draggable
                              onDragStart={(e) => handleDragStart(e, match)}
                              className="cursor-grab"
                            >
                              <MatchCard match={match} />
                            </div>
                          ))}
                        </div>
                      );
                    })}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {scheduleMatchMutation.isPending && (
        <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg flex items-center gap-3">
            <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
            <p>Saving schedule...</p>
          </div>
        </div>
      )}
    </div>
  );
}