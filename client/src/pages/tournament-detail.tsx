import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CategoryCard } from "@/components/category-card";
import { ScheduleCalendar } from "@/components/schedule-calendar";
import { TournamentStandings } from "@/components/tournament-standings";
import { EliminationBracket } from "@/components/elimination-bracket";
import { format, parseISO } from "date-fns";
import { ArrowLeft, Edit, ExternalLink, Share2 } from "lucide-react";

export default function TournamentDetail() {
  const { id } = useParams();
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState("overview");
  const [activeCategoryId, setActiveCategoryId] = useState<number | null>(null);

  const {
    data: tournament,
    isLoading,
    error,
  } = useQuery({
    queryKey: [`/api/tournaments/${id}/details`],
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <Layout>
        <div className="p-4 lg:p-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <Button variant="ghost" size="icon" className="mr-2">
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <Skeleton className="h-8 w-64" />
            </div>
            <div className="flex space-x-2">
              <Skeleton className="h-10 w-20" />
              <Skeleton className="h-10 w-20" />
            </div>
          </div>
          <Skeleton className="h-48 w-full mb-6" />
          <Skeleton className="h-10 w-full mb-6" />
          <Skeleton className="h-64 w-full" />
        </div>
      </Layout>
    );
  }

  if (error || !tournament) {
    return (
      <Layout>
        <div className="p-4 lg:p-8">
          <div className="bg-red-50 p-6 rounded-lg">
            <h2 className="text-lg font-medium text-red-800 mb-2">Error Loading Tournament</h2>
            <p className="text-red-600">{error?.message || "Tournament not found"}</p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => navigate("/")}
            >
              Go Back to Dashboard
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  // Set the first category as active if none is set and categories exist
  if (!activeCategoryId && tournament.categories.length > 0 && activeTab === "categories") {
    setActiveCategoryId(tournament.categories[0].id);
  }

  // Find the active category
  const activeCategory = tournament.categories.find(c => c.id === activeCategoryId);

  return (
    <Layout>
      <div className="p-4 lg:p-8">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <Button 
                variant="ghost" 
                size="icon" 
                className="mr-2 text-neutral-dark hover:text-primary" 
                onClick={() => navigate("/")}
                title="Go back"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <h1 className="text-2xl font-bold text-neutral-dark">{tournament.name}</h1>
            </div>
            <div className="flex space-x-2">
              <Button variant="outline" size="sm" className="hidden md:flex">
                <Edit className="mr-1 h-4 w-4" /> Edit
              </Button>
              <Button variant="outline" size="sm" className="hidden md:flex">
                <Share2 className="mr-1 h-4 w-4" /> Share
              </Button>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-4">
            {tournament.imageUrl ? (
              <img 
                src={tournament.imageUrl} 
                alt={`${tournament.name} banner`} 
                className="w-full h-48 object-cover" 
              />
            ) : (
              <div className="w-full h-48 bg-neutral-lighter flex items-center justify-center">
                <span className="text-neutral-dark">No tournament image</span>
              </div>
            )}
            
            <div className="p-4">
              <div className="flex flex-wrap items-center text-sm text-neutral-dark mb-4">
                <div className="flex items-center mr-4 mb-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span>
                    {format(parseISO(tournament.startDate), "MMM d, yyyy")} - {format(parseISO(tournament.endDate), "MMM d, yyyy")}
                  </span>
                </div>
                {tournament.venues.length > 0 && (
                  <div className="flex items-center mr-4 mb-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span>{tournament.venues[0].name}</span>
                  </div>
                )}
                <div className="flex items-center mr-4 mb-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <span>{tournament.stats.totalTeams} Teams</span>
                </div>
                <div className="flex items-center mr-4 mb-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                  </svg>
                  <span>{tournament.categories.length} Categories</span>
                </div>
                {tournament.externalLink && (
                  <a 
                    href={tournament.externalLink} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary hover:underline mb-2 flex items-center"
                  >
                    <ExternalLink className="h-4 w-4 mr-1" />
                    Tournament website
                  </a>
                )}
              </div>
              
              <p className="text-neutral-dark">
                {tournament.description || "No description available for this tournament."}
              </p>
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b border-neutral-light">
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="w-full"
            >
              <TabsList className="w-full justify-start h-auto bg-transparent p-0">
                <TabsTrigger 
                  value="overview"
                  className="data-[state=active]:border-primary data-[state=active]:text-primary border-b-2 border-transparent py-4 px-1 font-medium text-sm"
                >
                  Overview
                </TabsTrigger>
                <TabsTrigger 
                  value="categories"
                  className="data-[state=active]:border-primary data-[state=active]:text-primary border-b-2 border-transparent py-4 px-1 font-medium text-sm"
                >
                  Categories
                </TabsTrigger>
                <TabsTrigger 
                  value="participants"
                  className="data-[state=active]:border-primary data-[state=active]:text-primary border-b-2 border-transparent py-4 px-1 font-medium text-sm"
                >
                  Participants
                </TabsTrigger>
                <TabsTrigger 
                  value="schedule"
                  className="data-[state=active]:border-primary data-[state=active]:text-primary border-b-2 border-transparent py-4 px-1 font-medium text-sm"
                >
                  Schedule
                </TabsTrigger>
                <TabsTrigger 
                  value="venue"
                  className="data-[state=active]:border-primary data-[state=active]:text-primary border-b-2 border-transparent py-4 px-1 font-medium text-sm"
                >
                  Venue
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>

        {/* Tab Content */}
        <div>
          <TabsContent value="overview" className="space-y-6 mt-0" hidden={activeTab !== "overview"}>
            {/* Tournament Status */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-medium text-neutral-dark mb-4">Tournament Status</h2>
              <div className="flex flex-wrap gap-4">
                <div className="bg-blue-50 rounded-lg p-4 flex-1 min-w-[240px]">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-neutral-dark">Participants</p>
                      <p className="text-2xl font-semibold text-primary">
                        {tournament.stats.totalTeams}
                      </p>
                    </div>
                    <div className="bg-primary bg-opacity-10 p-3 rounded-full">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                  </div>
                </div>
                
                <div className="bg-emerald-50 rounded-lg p-4 flex-1 min-w-[240px]">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-neutral-dark">Matches</p>
                      <p className="text-2xl font-semibold text-secondary">
                        {tournament.stats.completedMatches}/{tournament.stats.totalMatches}
                      </p>
                    </div>
                    <div className="bg-secondary bg-opacity-10 p-3 rounded-full">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                      </svg>
                    </div>
                  </div>
                  <div className="mt-2">
                    <div className="w-full bg-emerald-100 rounded-full h-2">
                      <div 
                        className="bg-secondary h-2 rounded-full" 
                        style={{ 
                          width: tournament.stats.totalMatches 
                            ? `${(tournament.stats.completedMatches / tournament.stats.totalMatches) * 100}%` 
                            : "0%" 
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-violet-50 rounded-lg p-4 flex-1 min-w-[240px]">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-neutral-dark">Days Until Start</p>
                      <p className="text-2xl font-semibold text-violet-500">
                        {Math.max(0, Math.ceil((new Date(tournament.startDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)))}
                      </p>
                    </div>
                    <div className="bg-violet-500 bg-opacity-10 p-3 rounded-full">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-violet-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  </div>
                  <div className="mt-2 text-xs text-neutral-dark">
                    Starting {format(parseISO(tournament.startDate), "MMMM d, yyyy")}
                  </div>
                </div>
              </div>
            </div>

            {/* Categories Overview */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-medium text-neutral-dark">Categories</h2>
                <Button 
                  variant="link" 
                  size="sm"
                  onClick={() => setActiveTab("categories")}
                >
                  View all
                </Button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {tournament.categories.map((category) => (
                  <CategoryCard 
                    key={category.id} 
                    category={category} 
                    onClick={() => {
                      setActiveTab("categories");
                      setActiveCategoryId(category.id);
                    }}
                  />
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="categories" className="mt-0" hidden={activeTab !== "categories"}>
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-medium text-neutral-dark">Categories</h2>
                <Button>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Add Category
                </Button>
              </div>

              {/* Category Tabs */}
              <div className="mb-6">
                <div className="border-b border-neutral-light">
                  <div className="flex space-x-4 overflow-x-auto pb-1">
                    {tournament.categories.map((category) => (
                      <button
                        key={category.id}
                        onClick={() => setActiveCategoryId(category.id)}
                        className={`border-b-2 py-2 px-3 font-medium text-sm focus:outline-none whitespace-nowrap
                          ${category.id === activeCategoryId
                            ? "border-primary text-primary"
                            : "border-transparent text-neutral-dark hover:text-neutral-dark hover:border-neutral-light"
                          }`}
                      >
                        {category.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Category Content */}
                {activeCategory && (
                  <div className="mt-4 space-y-6">
                    {/* Category Info */}
                    <div className="flex flex-col md:flex-row md:justify-between md:items-center p-4 bg-blue-50 rounded-lg">
                      <div className="mb-4 md:mb-0">
                        <h3 className="font-semibold text-neutral-dark">{activeCategory.name}</h3>
                        <p className="text-sm text-neutral-dark">
                          Format: {activeCategory.format === "GROUPS"
                            ? "Groups (Round Robin)"
                            : activeCategory.format === "SINGLE_ELIMINATION"
                              ? "Single Elimination"
                              : "Groups + Single Elimination"
                          }
                        </p>
                        <p className="text-sm text-neutral-dark">Match Duration: {activeCategory.matchDuration} minutes</p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4 mr-1" /> Edit Settings
                        </Button>
                        <Button variant="outline" size="sm" className="text-primary border-primary hover:bg-blue-50">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Generate Matches
                        </Button>
                      </div>
                    </div>

                    {/* Groups */}
                    {(activeCategory.format === "GROUPS" || activeCategory.format === "GROUPS_AND_ELIMINATION") && 
                     activeCategory.groups && activeCategory.groups.length > 0 && (
                      <div>
                        <h3 className="font-medium text-neutral-dark mb-3">Groups</h3>
                        <TournamentStandings groups={activeCategory.groups} />
                      </div>
                    )}

                    {/* Elimination Bracket */}
                    {(activeCategory.format === "SINGLE_ELIMINATION" || activeCategory.format === "GROUPS_AND_ELIMINATION") && (
                      <div>
                        <h3 className="font-medium text-neutral-dark mb-3">Single Elimination Bracket</h3>
                        <EliminationBracket 
                          matches={activeCategory.matches.filter(m => 
                            m.round !== "GROUP"
                          )} 
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="schedule" className="mt-0" hidden={activeTab !== "schedule"}>
            <ScheduleCalendar 
              tournament={tournament}
              venues={tournament.venues}
              startDate={parseISO(tournament.startDate)}
              endDate={parseISO(tournament.endDate)}
            />
          </TabsContent>

          <TabsContent value="participants" className="mt-0" hidden={activeTab !== "participants"}>
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-medium text-neutral-dark mb-4">Participants</h2>
              
              {tournament.categories.length === 0 ? (
                <p className="text-neutral-dark">No categories have been created yet.</p>
              ) : (
                <div className="space-y-6">
                  {tournament.categories.map((category) => (
                    <div key={category.id} className="border border-neutral-light rounded-lg overflow-hidden">
                      <div className="bg-neutral-lighter px-4 py-2 font-medium text-neutral-dark">
                        {category.name} - {category.teams.length} Teams
                      </div>
                      <div className="p-4">
                        {category.teams.length === 0 ? (
                          <p className="text-neutral-dark">No teams registered yet.</p>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {category.teams.map((team) => (
                              <div key={team.id} className="border border-neutral-light rounded-lg p-3">
                                <h4 className="font-medium text-neutral-dark">{team.name}</h4>
                                <div className="text-sm text-neutral-dark mt-1">
                                  <p>Player 1: {team.player1}</p>
                                  <p>Player 2: {team.player2}</p>
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
              
              <Button className="mt-6">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Add Team
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="venue" className="mt-0" hidden={activeTab !== "venue"}>
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-medium text-neutral-dark mb-4">Venues</h2>
              
              {tournament.venues.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-neutral-dark mb-4">No venues have been added yet.</p>
                  <Button>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Add Venue
                  </Button>
                </div>
              ) : (
                <div className="space-y-6">
                  {tournament.venues.map((venue) => (
                    <div key={venue.id} className="border border-neutral-light rounded-lg overflow-hidden">
                      <div className="bg-neutral-lighter px-4 py-2 font-medium text-neutral-dark">
                        {venue.name}
                      </div>
                      <div className="p-4">
                        {venue.address && (
                          <p className="text-neutral-dark mb-3">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 inline mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            {venue.address}
                          </p>
                        )}
                        
                        <h3 className="text-neutral-dark font-medium mb-2">Courts ({venue.courts.length})</h3>
                        
                        {venue.courts.length === 0 ? (
                          <p className="text-neutral-dark">No courts have been added yet.</p>
                        ) : (
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                            {venue.courts.map((court) => (
                              <div key={court.id} className="border border-neutral-light rounded-lg p-2 text-center">
                                <span className="text-sm font-medium">{court.name}</span>
                              </div>
                            ))}
                          </div>
                        )}
                        
                        <Button variant="outline" size="sm" className="mt-4">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                          Add Court
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {tournament.venues.length > 0 && (
                <Button className="mt-6">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Add Another Venue
                </Button>
              )}
            </div>
          </TabsContent>
        </div>
      </div>
    </Layout>
  );
}
