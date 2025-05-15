import { useMemo } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";

type Match = {
  id: number;
  round: string;
  teamAId: number;
  teamBId: number;
  winner?: number;
  teamA?: {
    id: number;
    name: string;
  };
  teamB?: {
    id: number;
    name: string;
  };
  scoreA?: string;
  scoreB?: string;
};

type EliminationBracketProps = {
  matches: Match[];
};

export function EliminationBracket({ matches }: EliminationBracketProps) {
  // Group matches by round
  const roundsObj = useMemo(() => {
    const rounds: { [key: string]: Match[] } = {};
    const roundPriority: { [key: string]: number } = {
      "ROUND_OF_32": 1,
      "ROUND_OF_16": 2,
      "QUARTER": 3,
      "SEMI": 4,
      "FINAL": 5,
    };

    // Group matches by round
    matches.forEach(match => {
      if (!rounds[match.round]) {
        rounds[match.round] = [];
      }
      rounds[match.round].push(match);
    });

    // Sort rounds by priority
    return Object.keys(rounds)
      .sort((a, b) => roundPriority[a] - roundPriority[b])
      .reduce((obj: { [key: string]: Match[] }, key) => {
        obj[key] = rounds[key];
        return obj;
      }, {});
  }, [matches]);

  // No matches to display
  if (matches.length === 0) {
    return (
      <div className="text-center p-8 border border-dashed rounded-md">
        <p className="text-neutral-dark">No elimination matches have been generated yet.</p>
      </div>
    );
  }

  const roundTitles: { [key: string]: string } = {
    "ROUND_OF_32": "Round of 32",
    "ROUND_OF_16": "Round of 16",
    "QUARTER": "Quarterfinals",
    "SEMI": "Semifinals",
    "FINAL": "Final",
  };

  return (
    <ScrollArea className="w-full border border-neutral-light rounded-lg p-4 bg-white">
      <div className="flex min-w-[900px] space-x-8 pb-4">
        {Object.entries(roundsObj).map(([round, roundMatches], roundIndex) => (
          <div key={round} className="flex flex-col">
            <p className="text-sm font-medium text-neutral-dark text-center mb-4">
              {roundTitles[round] || round}
            </p>
            
            <div className="flex flex-col justify-around space-y-4">
              {roundMatches.map((match, matchIndex) => {
                const matchSpacing = Math.pow(2, Object.keys(roundsObj).length - roundIndex - 1) * 2;
                
                return (
                  <div 
                    key={match.id} 
                    className="border border-neutral-light rounded p-3 w-64"
                    style={{
                      marginTop: matchIndex > 0 ? `${matchSpacing * 1.5}rem` : 0
                    }}
                  >
                    <div className={`flex justify-between items-center mb-2 ${match.winner === match.teamAId ? 'font-medium text-primary' : ''}`}>
                      <span className="text-sm">
                        {match.teamA?.name || (match.teamAId ? `Team ID: ${match.teamAId}` : 'TBD')}
                      </span>
                      <span className="text-sm">
                        {match.scoreA || '-'}
                      </span>
                    </div>
                    <div className="w-full border-t border-neutral-light my-2"></div>
                    <div className={`flex justify-between items-center ${match.winner === match.teamBId ? 'font-medium text-primary' : ''}`}>
                      <span className="text-sm">
                        {match.teamB?.name || (match.teamBId ? `Team ID: ${match.teamBId}` : 'TBD')}
                      </span>
                      <span className="text-sm">
                        {match.scoreB || '-'}
                      </span>
                    </div>
                    {match.winner && (
                      <div className="mt-2 pt-2 border-t border-neutral-light text-xs text-right text-neutral-dark">
                        Winner: {match.winner === match.teamAId ? match.teamA?.name : match.teamB?.name}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {/* Champion (only if final round has a winner) */}
        {roundsObj["FINAL"] && roundsObj["FINAL"][0]?.winner && (
          <div className="flex flex-col">
            <p className="text-sm font-medium text-neutral-dark text-center mb-4">Champion</p>
            
            <div className="border-2 border-primary rounded p-3 w-64 bg-blue-50">
              <div className="flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-primary mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
                <span className="text-sm font-medium text-primary">
                  {roundsObj["FINAL"][0].winner === roundsObj["FINAL"][0].teamAId 
                    ? roundsObj["FINAL"][0].teamA?.name 
                    : roundsObj["FINAL"][0].teamB?.name}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </ScrollArea>
  );
}
