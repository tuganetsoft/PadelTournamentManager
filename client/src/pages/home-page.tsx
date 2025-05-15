import { useQuery } from "@tanstack/react-query";
import { Tournament } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { PlusIcon, TrophyIcon } from "lucide-react";
import { useLocation } from "wouter";
import { TournamentCard } from "@/components/tournament-card";
import { Skeleton } from "@/components/ui/skeleton";

export default function HomePage() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  
  const {
    data: tournaments,
    isLoading,
    error,
  } = useQuery<Tournament[]>({
    queryKey: ["/api/tournaments/user"],
    enabled: !!user,
  });

  return (
    <Layout>
      <div className="p-4 lg:p-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-neutral-dark">Dashboard</h1>
            <p className="text-sm text-neutral-dark mt-1">Manage your padel tournaments</p>
          </div>
          <Button 
            className="mt-4 md:mt-0" 
            onClick={() => navigate("/tournaments/create")}
          >
            <PlusIcon className="mr-2 h-4 w-4" />
            Create Tournament
          </Button>
        </div>

        {/* My Tournaments Section */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-medium text-neutral-dark">My Tournaments</h2>
          </div>

          {isLoading && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="border border-neutral-light rounded-lg p-4">
                  <Skeleton className="h-40 w-full mb-4" />
                  <Skeleton className="h-6 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-1/2 mb-4" />
                  <div className="flex space-x-2">
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {error && (
            <div className="text-center py-8">
              <p className="text-red-500">Error loading tournaments: {error.message}</p>
            </div>
          )}

          {!isLoading && tournaments?.length === 0 && (
            <div className="text-center py-10 border border-dashed border-neutral-light rounded-lg">
              <TrophyIcon className="mx-auto h-12 w-12 text-neutral-light mb-3" />
              <h3 className="text-lg font-medium text-neutral-dark mb-1">No tournaments yet</h3>
              <p className="text-muted-foreground mb-4">Create your first tournament to get started</p>
              <Button onClick={() => navigate("/tournaments/create")}>
                <PlusIcon className="mr-2 h-4 w-4" />
                Create Tournament
              </Button>
            </div>
          )}

          {!isLoading && tournaments && tournaments.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {tournaments.map((tournament) => (
                <TournamentCard key={tournament.id} tournament={tournament} />
              ))}
            </div>
          )}
        </div>

        {/* Quick Stats Section */}
        {tournaments && tournaments.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-medium text-neutral-dark mb-4">Quick Stats</h2>
            <div className="flex flex-wrap gap-4">
              <div className="bg-blue-50 rounded-lg p-4 flex-1 min-w-[240px]">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-neutral-dark">Active Tournaments</p>
                    <p className="text-2xl font-semibold text-primary">{tournaments.length}</p>
                  </div>
                  <div className="bg-primary bg-opacity-10 p-3 rounded-full">
                    <TrophyIcon className="h-5 w-5 text-primary" />
                  </div>
                </div>
              </div>
              
              <div className="bg-emerald-50 rounded-lg p-4 flex-1 min-w-[240px]">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-neutral-dark">Upcoming Tournaments</p>
                    <p className="text-2xl font-semibold text-secondary">
                      {tournaments.filter(t => new Date(t.startDate) > new Date()).length}
                    </p>
                  </div>
                  <div className="bg-secondary bg-opacity-10 p-3 rounded-full">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
