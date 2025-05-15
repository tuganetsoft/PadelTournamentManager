import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format, addDays, isSameDay, parseISO } from "date-fns";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { MatchCard } from "./match-card";
import { Loader2, Save } from "lucide-react";

type ScheduleCalendarProps = {
  tournament: any;
  venues: any[];
  startDate: Date;
  endDate: Date;
};

export function ScheduleCalendar({ tournament, venues, startDate, endDate }: ScheduleCalendarProps) {
  const { toast } = useToast();
  const [selectedDate, setSelectedDate] = useState<Date>(startDate);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [isDragging, setIsDragging] = useState(false);
  const [draggedMatch, setDraggedMatch] = useState<any>(null);
  const [scheduledMatches, setScheduledMatches] = useState<any[]>([]);
  const [unscheduledMatches, setUnscheduledMatches] = useState<any[]>([]);
  const [dateRange, setDateRange] = useState<Date[]>([]);
  const dropzonesRef = useRef<{ [key: string]: HTMLDivElement | null }>({});

  // Create date range for the tournament
  useEffect(() => {
    const dates = [];
    let currentDate = startDate;
    while (currentDate <= endDate) {
      dates.push(new Date(currentDate));
      currentDate = addDays(currentDate, 1);
    }
    setDateRange(dates);
  }, [startDate, endDate]);

  // Filter matches for the selected date and category
  useEffect(() => {
    if (!tournament) return;

    const allMatches: any[] = [];
    const scheduledForDate: any[] = [];
    const unscheduled: any[] = [];

    // Collect all matches from all categories
    tournament.categories.forEach((category: any) => {
      if (selectedCategory === "all" || selectedCategory === category.id.toString()) {
        category.matches.forEach((match: any) => {
          const matchWithCategory = { ...match, category };
          allMatches.push(matchWithCategory);
        });
      }
    });

    // Separate scheduled from unscheduled
    allMatches.forEach((match) => {
      if (match.scheduledTime && isSameDay(parseISO(match.scheduledTime), selectedDate)) {
        scheduledForDate.push(match);
      } else if (!match.scheduledTime) {
        unscheduled.push(match);
      }
    });

    setScheduledMatches(scheduledForDate);
    setUnscheduledMatches(unscheduled);
  }, [tournament, selectedDate, selectedCategory]);

  const handleDragStart = (match: any) => {
    setDraggedMatch(match);
    setIsDragging(true);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.currentTarget.classList.contains("dropzone")) {
      e.currentTarget.classList.add("highlight");
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    if (e.currentTarget.classList.contains("dropzone")) {
      e.currentTarget.classList.remove("highlight");
    }
  };

  const handleDrop = (e: React.DragEvent, courtId: number, time: string) => {
    e.preventDefault();
    if (e.currentTarget.classList.contains("dropzone")) {
      e.currentTarget.classList.remove("highlight");
      
      if (draggedMatch) {
        // Create a new scheduled version of the match
        const scheduledTime = new Date(selectedDate);
        const [hours, minutes] = time.split(":");
        scheduledTime.setHours(parseInt(hours, 10));
        scheduledTime.setMinutes(parseInt(minutes, 10));
        
        // Update UI optimistically
        const updatedMatch = { 
          ...draggedMatch, 
          courtId, 
          scheduledTime: scheduledTime.toISOString() 
        };
        
        setScheduledMatches(prev => [...prev, updatedMatch]);
        setUnscheduledMatches(prev => prev.filter(m => m.id !== draggedMatch.id));
        
        // Queue update to the schedule
        scheduleMutation.mutate({
          matchId: draggedMatch.id,
          courtId,
          scheduledTime: scheduledTime.toISOString()
        });
      }
    }
  };

  const scheduleMutation = useMutation({
    mutationFn: async (scheduleData: { matchId: number; courtId: number; scheduledTime: string }) => {
      return await apiRequest("PATCH", `/api/matches/${scheduleData.matchId}`, {
        courtId: scheduleData.courtId,
        scheduledTime: scheduleData.scheduledTime
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/tournaments/${tournament.id}/details`] });
      toast({
        title: "Match scheduled",
        description: "The match has been scheduled successfully."
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error scheduling match",
        description: error.message,
        variant: "destructive"
      });
      // Revert optimistic update
      queryClient.invalidateQueries({ queryKey: [`/api/tournaments/${tournament.id}/details`] });
    }
  });

  const saveScheduleMutation = useMutation({
    mutationFn: async () => {
      const schedules = scheduledMatches.map(match => ({
        matchId: match.id,
        courtId: match.courtId,
        scheduledTime: match.scheduledTime
      }));
      
      return await apiRequest("POST", `/api/tournaments/${tournament.id}/schedule`, { schedules });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/tournaments/${tournament.id}/details`] });
      toast({
        title: "Schedule saved",
        description: "The tournament schedule has been saved successfully."
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error saving schedule",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Generate time slots from 8:00 to 22:00
  const timeSlots = Array.from({ length: 15 }, (_, i) => {
    const hour = i + 8;
    return `${hour.toString().padStart(2, '0')}:00`;
  });

  return (
    <div>
      <div className="bg-white rounded-lg shadow-sm mb-6">
        <div className="p-6 border-b border-neutral-light">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <h2 className="text-lg font-medium text-neutral-dark mb-4 md:mb-0">Tournament Schedule</h2>
            <div className="flex flex-wrap gap-2">
              <Select 
                value={selectedDate.toISOString()} 
                onValueChange={(value) => setSelectedDate(new Date(value))}
              >
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Select date" />
                </SelectTrigger>
                <SelectContent>
                  {dateRange.map((date) => (
                    <SelectItem key={date.toISOString()} value={date.toISOString()}>
                      {format(date, "MMMM d, yyyy")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select 
                value={selectedCategory} 
                onValueChange={setSelectedCategory}
              >
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {tournament.categories.map((category: any) => (
                    <SelectItem key={category.id} value={category.id.toString()}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Button 
                onClick={() => saveScheduleMutation.mutate()}
                disabled={saveScheduleMutation.isPending}
              >
                {saveScheduleMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Schedule
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Calendar Schedule */}
        <div className="overflow-x-auto">
          <div className="grid grid-cols-[70px_repeat(auto-fit,minmax(200px,1fr))] min-w-[800px]">
            {/* Time column */}
            <div className="sticky left-0 bg-white z-10 border-r border-neutral-light">
              <div className="h-12 flex items-center justify-center font-medium text-neutral-dark bg-neutral-lighter">
                Time
              </div>
              {timeSlots.map((slot) => (
                <div key={slot} className="h-24 border-b border-neutral-light flex items-center justify-center text-sm text-neutral-dark bg-white">
                  {slot}
                </div>
              ))}
            </div>

            {/* Courts */}
            {venues.flatMap(venue => 
              venue.courts.map(court => (
                <div key={court.id}>
                  <div className="h-12 flex items-center justify-center font-medium text-neutral-dark bg-neutral-lighter border-b border-neutral-light">
                    {court.name}
                  </div>
                  
                  {timeSlots.map((slot) => {
                    const matchesInSlot = scheduledMatches.filter(
                      match => match.courtId === court.id && 
                      format(parseISO(match.scheduledTime), "HH:mm") === slot
                    );
                    
                    return (
                      <div 
                        key={`${court.id}-${slot}`}
                        ref={el => dropzonesRef.current[`${court.id}-${slot}`] = el}
                        className="h-24 border-b border-neutral-light dropzone"
                        data-court={court.id}
                        data-time={slot}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => handleDrop(e, court.id, slot)}
                      >
                        {matchesInSlot.length > 0 ? (
                          <div className="h-full w-full p-1">
                            {matchesInSlot.map(match => (
                              <div 
                                key={match.id} 
                                className="h-full w-full flex items-center justify-center"
                              >
                                <MatchCard match={match} />
                              </div>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Unscheduled Matches */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-medium text-neutral-dark mb-4">Unscheduled Matches</h3>
        <div className="space-y-2">
          <p className="text-sm text-neutral-dark mb-2">Drag matches to schedule them on the calendar</p>
          
          {unscheduledMatches.length === 0 ? (
            <p className="text-sm text-neutral-dark py-4 text-center">No unscheduled matches found for the selected criteria.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {unscheduledMatches.map(match => (
                <div
                  key={match.id}
                  className="draggable-match bg-gray-100 border border-gray-300 rounded-md p-3 cursor-grab"
                  draggable="true"
                  onDragStart={() => handleDragStart(match)}
                  onDragEnd={handleDragEnd}
                >
                  <div className="flex justify-between">
                    <div>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded 
                        ${match.category.name.toLowerCase().includes('men') ? 'bg-blue-100 text-blue-800' : 
                         match.category.name.toLowerCase().includes('women') ? 'bg-green-100 text-green-800' : 
                         match.category.name.toLowerCase().includes('mixed') ? 'bg-violet-100 text-violet-800' : 
                         'bg-amber-100 text-amber-800'}`}
                      >
                        {match.category.name}
                      </span>
                      <div className="text-sm font-medium text-neutral-dark mt-1">
                        {match.teamA ? match.teamA.name : 'TBD'} vs {match.teamB ? match.teamB.name : 'TBD'}
                      </div>
                      <div className="text-xs text-neutral-dark mt-0.5">
                        {match.round === 'GROUP' ? `Group ${match.groupId ? String.fromCharCode(64 + match.groupId) : ''}` : match.round}
                      </div>
                    </div>
                    <div className="text-xs text-neutral-dark">{match.category.matchDuration} min</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
