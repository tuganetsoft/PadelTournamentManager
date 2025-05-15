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
import { format } from "date-fns";
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
  if (!activeCategoryId && tournament.categories?.length > 0 && activeTab === "categories") {
    setActiveCategoryId(tournament.categories[0].id);
  }

  // Find the active category
  const activeCategory = tournament.categories?.find(c => c.id === activeCategoryId);

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
                    {format(new Date(tournament.startDate), "MMM d, yyyy")} - {format(new Date(tournament.endDate), "MMM d, yyyy")}
                  </span>
                </div>
                {tournament.venues?.length > 0 && (
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
                  <span>{tournament.stats?.totalTeams || 0} Teams</span>
                </div>
                <div className="flex items-center mr-4 mb-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                  </svg>
                  <span>{tournament.categories?.length || 0} Categories</span>
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
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="border-b border-neutral-light mb-6">
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
          </div>

          <TabsContent value="overview" className="space-y-6 mt-0">
            {/* Tournament Status */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-medium text-neutral-dark mb-4">Tournament Status</h2>
              <div className="flex flex-wrap gap-4">
                <div className="bg-blue-50 rounded-lg p-4 flex-1 min-w-[240px]">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-neutral-dark">Participants</p>
                      <p className="text-2xl font-semibold text-primary">
                        {tournament.stats?.totalTeams || 0}
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
                        {tournament.stats?.completedMatches || 0}/{tournament.stats?.totalMatches || 0}
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
                          width: tournament.stats?.totalMatches 
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
                    Starting {format(new Date(tournament.startDate), "MMMM d, yyyy")}
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
                {tournament.categories?.map((category) => (
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

          <TabsContent value="categories" className="mt-0">
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-medium text-neutral-dark">Categories</h2>
                <Button>
                  Add Category
                </Button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {tournament.categories?.map((category) => (
                  <CategoryCard 
                    key={category.id} 
                    category={category} 
                    onClick={() => setActiveCategoryId(category.id)}
                  />
                ))}
              </div>
            </div>
            
            {/* Selected Category Details */}
            {activeCategory && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-medium text-neutral-dark">{activeCategory.name}</h2>
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm">
                      Add Teams
                    </Button>
                    <Button variant="outline" size="sm">
                      Generate Matches
                    </Button>
                  </div>
                </div>
                
                {activeCategory.format === "ROUND_ROBIN" || activeCategory.format === "HYBRID" ? (
                  <div className="mb-6">
                    <h3 className="text-md font-medium text-neutral-dark mb-3">Standings</h3>
                    <TournamentStandings groups={activeCategory.groups || []} />
                  </div>
                ) : null}
                
                {activeCategory.format === "SINGLE_ELIMINATION" || activeCategory.format === "HYBRID" ? (
                  <div>
                    <h3 className="text-md font-medium text-neutral-dark mb-3">Bracket</h3>
                    <EliminationBracket 
                      matches={activeCategory.matches?.filter(m => m.round !== "GROUP") || []} 
                    />
                  </div>
                ) : null}
              </div>
            )}
          </TabsContent>

          <TabsContent value="schedule" className="mt-0">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <ScheduleCalendar 
                tournament={tournament}
                venues={tournament.venues || []}
                startDate={new Date(tournament.startDate)}
                endDate={new Date(tournament.endDate)}
              />
            </div>
          </TabsContent>

          <TabsContent value="participants" className="mt-0">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-medium text-neutral-dark">Participants</h2>
                <Button>
                  Add Teams
                </Button>
              </div>
              
              <div className="space-y-6">
                {tournament.categories?.map((category) => (
                  <div key={category.id} className="space-y-3">
                    <h3 className="text-md font-medium text-neutral-dark">{category.name}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {category.teams?.map((team) => (
                        <div 
                          key={team.id} 
                          className="bg-neutral-50 rounded-lg p-4 border border-neutral-200"
                        >
                          <div className="font-medium mb-1">{team.name}</div>
                          <div className="text-sm text-neutral-dark">
                            {team.player1} {team.player2 ? `/ ${team.player2}` : ""}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="venue" className="mt-0">
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-medium text-neutral-dark">Venues</h2>
                <Button>
                  Add Venue
                </Button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {tournament.venues?.map((venue) => (
                  <div 
                    key={venue.id} 
                    className="bg-neutral-50 rounded-lg p-6 border border-neutral-200"
                  >
                    <h3 className="text-lg font-medium text-neutral-dark mb-2">{venue.name}</h3>
                    {venue.address && (
                      <div className="text-sm text-neutral-dark mb-4 flex items-start">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span>{venue.address}</span>
                      </div>
                    )}
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-neutral-dark mb-2">Courts</h4>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {venue.courts?.map((court) => (
                          <div 
                            key={court.id} 
                            className="bg-white rounded p-2 text-sm border border-neutral-200"
                          >
                            {court.name}
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="flex justify-end space-x-2">
                      <Button variant="outline" size="sm">
                        Add Courts
                      </Button>
                      <Button variant="outline" size="sm">
                        Edit
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Map Placeholder */}
            {tournament.venues?.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-medium text-neutral-dark mb-4">Location</h3>
                <div className="bg-neutral-100 h-[400px] rounded-lg flex items-center justify-center text-neutral-dark">
                  Map placeholder - would integrate with Google Maps or similar service
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}