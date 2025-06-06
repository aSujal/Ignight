import { useState } from "react";
import Image from "next/image"; // Import Next.js Image component
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useGameSocket } from "@/hooks/useGameSocket";
import { usePersistentPlayerId } from "@/hooks/useLocalStorage";
import { GAME_PHASES } from "@/lib/enum"; // This should now have the new phase names if enums.js was updated on frontend
import { GameState, Player } from "@/lib/types"; // Ensure Player type is imported if needed for type guards

export function WordImpostorGame({ game }: { game: GameState }) {
  const [clue, setClue] = useState("");
  // Destructure all necessary functions from useGameSocket, including new ones for phase refactor
  const {
    submitClue,
    submitVote,
    resetGame,
    startGame, // Assuming startGame is still used to initiate the game by host from WAITING
    hostSkipWordShow,
    hostEndDiscussion,
    hostEndVoting,
    readyUp
  } = useGameSocket();

  console.log("Current Game State:", game); // More descriptive log
  const [persistentPlayerId] = usePersistentPlayerId();

  const currentPlayer = game?.players.find((p) => p.id === persistentPlayerId);
  const isHost = currentPlayer?.isHost;

  const handleSubmitClue = () => {
    if (clue.trim()) {
      submitClue(clue.trim());
      setClue("");
    }
  };

  // Helper to get current player object
  // Note: currentPlayer was already defined above, removing duplicate.
  // const currentPlayer = game?.players.find((p: Player) => p.id === persistentPlayerId);


  // WAITING Phase UI
  if (game?.phase === GAME_PHASES.WAITING) {
    return (
      <Card className="w-full max-w-md mx-auto bg-card/90 backdrop-blur-lg border-border shadow-2xl rounded-xl">
        <CardHeader className="text-center pt-8 pb-4">
          <CardTitle className="text-4xl font-extrabold text-primary-foreground tracking-tight">
            Game Lobby
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div className="p-5 bg-muted/70 rounded-lg text-center shadow-inner">
            <p className="text-base text-muted-foreground mb-1">Share this code to invite players:</p>
            <p className="text-5xl font-mono tracking-widest text-accent-foreground py-3 bg-background rounded-lg shadow-md select-all">
              {game.code}
            </p>
          </div>
          {/* PlayerList component would ideally be rendered by the parent page structure */}
          {/* For now, we assume it's handled elsewhere or not part of this specific component's direct render in WAITING phase */}
          {isHost && ( // isHost is defined from currentPlayer above
            <Button
              onClick={() => startGame()}
              className="w-full bg-gradient-to-r from-primary to-primary/80 text-primary-foreground hover:from-primary/80 hover:to-primary text-lg py-7 rounded-lg shadow-xl transition-all hover:scale-105 hover:shadow-2xl focus:ring-4 focus:ring-primary/50"
              disabled={game.players.length < (game.type === 'word-impostor' ? 3 : 2)} // Example: min 3 players for word-impostor
            >
              {game.players.length < (game.type === 'word-impostor' ? 3 : 2)
                ? `Need ${ (game.type === 'word-impostor' ? 3 : 2) - game.players.length} more player(s)`
                : "🚀 Launch Game!"}
            </Button>
          )}
          {!isHost && (
            <p className="text-center text-muted-foreground pt-4">Waiting for the host to start the game...</p>
          )}
        </CardContent>
      </Card>
    );
  }

  // WORD_SHOW Phase UI
  if (game?.phase === GAME_PHASES.WORD_SHOW && game?.gameData) {
    return (
      <Card className="w-full max-w-lg mx-auto bg-card/90 backdrop-blur-lg border-border shadow-2xl rounded-xl text-center">
        <CardHeader className="pt-8 pb-2">
          <CardTitle className="text-2xl font-semibold text-muted-foreground">Your Identity & Word</CardTitle>
        </CardHeader>
        <CardContent className="p-8 space-y-6 min-h-[300px] flex flex-col justify-center items-center">
          <div
            className={`text-6xl font-extrabold tracking-tight p-8 rounded-xl shadow-2xl transition-all duration-300 ease-in-out w-full ${
              game.gameData.isImpostor
                ? "bg-gradient-to-br from-destructive via-destructive/90 to-red-700 text-destructive-foreground animate-pulse-slow"
                : "bg-gradient-to-br from-primary via-primary/90 to-blue-700 text-primary-foreground" // Assuming primary is blueish
            }`}
          >
            {game.gameData.isImpostor ? "🤫 YOU ARE THE IMPOSTOR 🤫" : game.gameData.word}
          </div>
          {!game.gameData.isImpostor && (
             <p className="text-2xl text-muted-foreground font-medium pt-2">Hint: <span className="text-accent-foreground">{game.gameData.hint}</span></p>
          )}
          {game.gameData.isImpostor && (
             <p className="text-xl text-destructive-foreground/80 font-medium pt-2">Blend in. Don't reveal yourself!</p>
          )}
          {/* Timer Display (Placeholder - to be implemented if timer data is available) */}
          {/* {game.timerRemaining !== undefined && <p className="text-accent-foreground text-4xl font-mono mt-4 animate-pulse">{game.timerRemaining}s</p>} */}
          {isHost && ( // isHost is defined from currentPlayer
            <Button
              onClick={() => hostSkipWordShow()}
              variant="ghost"
              size="sm"
              className="mt-8 text-sm text-muted-foreground hover:text-accent-foreground opacity-90 hover:opacity-100 transition-opacity"
            >
              Skip Reveal
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  // DISCUSSION Phase UI
  if (game?.phase === GAME_PHASES.DISCUSSION) {
    const hasSubmittedClue = !!game.clues?.find(c => c.playerId === persistentPlayerId);
    // Player can ready if they have submitted a clue, or if they are the imposter
    // (assuming imposter does not submit a clue in the same way).
    // This might need game.gameData.isImpostor if available here, or a check on currentPlayer.
    const isImpostor = game.gameData?.isImpostor; // Check if this data is reliably present in DISCUSSION
    const canPlayerReady = hasSubmittedClue || isImpostor;

    return (
      <Card className="w-full max-w-2xl mx-auto bg-card/90 backdrop-blur-lg border-border shadow-2xl rounded-xl">
        <CardHeader className="text-center border-b border-border/50 pb-4 pt-6">
          <CardTitle className="text-4xl font-extrabold text-primary-foreground tracking-tight">Discussion</CardTitle>
          <div className="mt-3 text-lg text-accent-foreground font-mono">
            {/* Placeholder for Timer & Ready Count */}
            <span>Time: {game.timerRemaining ?? 'N/A'}s</span> | <span>{game.readyPlayers?.length || 0}/{game.players.filter(p => !p.isBot).length} Ready</span>
          </div>
          <p className="text-muted-foreground pt-2 text-base">
            {isImpostor ? "You are the Impostor. Blend in with a misleading clue if you dare, or stay silent." : "Submit your unique one-word clue, then discuss to find the impostor."}
          </p>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          {/* Clue Submission Area */}
          {!hasSubmittedClue && !isImpostor && (
            <div className="flex gap-3 items-stretch p-1 bg-muted/30 rounded-lg shadow">
              <Input
                placeholder="Enter your one-word clue..."
                value={clue}
                onChange={(e) => setClue(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSubmitClue()}
                className="flex-grow bg-input text-foreground placeholder:text-muted-foreground rounded-md text-base p-5 h-auto shadow-inner"
                disabled={hasSubmittedClue || isImpostor}
              />
              <Button
                onClick={handleSubmitClue}
                disabled={!clue.trim() || hasSubmittedClue || isImpostor}
                className="bg-primary text-primary-foreground hover:bg-primary/90 px-8 py-3 text-base rounded-md shadow-lg transition-transform hover:scale-105"
              >
                Submit Clue
              </Button>
            </div>
          )}
          {(hasSubmittedClue || isImpostor) && (
             <div className="text-center p-4 bg-secondary/70 rounded-lg shadow-md">
                <p className="text-secondary-foreground font-medium text-base">
                  {isImpostor ? "You are the Impostor. Observe the clues and prepare to defend yourself." : "Your clue is submitted! Discuss with other players."}
                </p>
             </div>
          )}

          {/* Submitted Clues List */}
          {game.clues && game.clues.length > 0 && (
            <div className="space-y-3 pt-4">
              <h3 className="text-2xl font-semibold text-primary-foreground mb-3 text-center tracking-tight">Submitted Clues</h3>
              <div className="max-h-72 overflow-y-auto space-y-3 p-2 rounded-lg bg-background/50 custom-scrollbar shadow-inner">
                {game.clues.map(({ playerId: pId, playerName, clue: submittedClue }) => {
                  const cluePlayer = game.players.find(p => p.id === pId);
                  return (
                    <div
                      key={pId}
                      className="flex items-center justify-between p-4 bg-muted/80 rounded-lg shadow-md hover:shadow-lg transition-all duration-150 ease-in-out"
                    >
                      <div className="flex items-center gap-3">
                        {cluePlayer && (
                          <Image
                            src={cluePlayer.avatarUrl}
                            alt={`${playerName}'s avatar`}
                            width={40}
                            height={40}
                            className="rounded-full border-2 border-primary/60 shadow-sm"
                          />
                        )}
                        <span className="font-semibold text-foreground text-lg">{playerName}:</span>
                      </div>
                      <span className="font-bold text-2xl text-accent-foreground break-all text-right tracking-wide">{submittedClue}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Action Buttons: Ready Up & Host Controls */}
          <div className="flex flex-col sm:flex-row gap-4 pt-6">
            <Button
              onClick={() => readyUp()}
              disabled={!canPlayerReady || !!game.readyPlayers?.includes(persistentPlayerId ?? '')}
              className="flex-1 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white text-lg py-6 rounded-lg shadow-lg transition-all hover:scale-105 focus:ring-4 focus:ring-green-500/50 disabled:opacity-70"
            >
              {!!game.readyPlayers?.includes(persistentPlayerId ?? '') ? "✔️ Ready!" : "Ready to Vote"}
            </Button>
            {isHost && (
              <Button
                onClick={() => hostEndDiscussion()}
                variant="outline"
                className="flex-1 border-accent text-accent-foreground hover:bg-accent/20 hover:border-accent/70 text-lg py-6 rounded-lg shadow-lg transition-all hover:scale-105 focus:ring-4 focus:ring-accent/50"
              >
                End Discussion
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  // VOTING Phase UI
  if (game?.phase === GAME_PHASES.VOTING) {
    const hasVoted = !!game.votes?.find(v => 'voterId' in v && v.voterId === persistentPlayerId);

    return (
      <Card className="w-full max-w-lg mx-auto bg-card/90 backdrop-blur-lg border-border shadow-2xl rounded-xl">
        <CardHeader className="text-center border-b border-border/50 pb-4 pt-6">
          <CardTitle className="text-4xl font-extrabold text-primary-foreground tracking-tight">Vote Now!</CardTitle>
          {/* Timer & Ready Count (Placeholder) */}
          <div className="mt-3 text-lg text-accent-foreground font-mono">
            <span>Time: {game.timerRemaining ?? 'N/A'}s</span> | <span>{game.readyPlayers?.length || 0}/{game.players.filter(p=>!p.isBot).length} Ready</span>
          </div>
          <p className="text-muted-foreground pt-2 text-base">Select the player you suspect is the Impostor.</p>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {game?.players.filter(p => p.isConnected).map((player) => ( // Only show connected players for voting
              <Button
                key={player.id}
                variant="outline"
                className={`w-full justify-start gap-3 text-lg p-8 rounded-lg shadow-md transition-all duration-150 ease-in-out focus:ring-4 focus:ring-offset-2 focus:ring-offset-background disabled:opacity-60 disabled:cursor-not-allowed
                            hover:shadow-xl hover:scale-105
                            ${hasVoted && game.votes?.find(v => v.voterId === persistentPlayerId)?.votedForPlayerId === player.id
                              ? 'ring-4 ring-primary ring-offset-background shadow-2xl scale-105 border-primary/80'
                              : 'border-muted/70 hover:border-accent'}
                            ${player.id === persistentPlayerId ? 'opacity-50 cursor-not-allowed' : ''}
                          `}
                onClick={() => submitVote(player.id)}
                disabled={player.id === persistentPlayerId || !player.isConnected || hasVoted}
              >
                <Image
                  src={player.avatarUrl}
                  alt={`${player.name}'s avatar`}
                  width={40}
                  height={40}
                  className="rounded-full border-2 border-muted shadow-sm"
                />
                <span className="font-semibold text-base">{player.name}</span>
                {/* {player.id === persistentPlayerId && <span className="text-xs text-muted-foreground ml-1">(You)</span>} */}
              </Button>
            ))}
          </div>
           {/* Action Buttons: Ready Up & Host Controls */}
          <div className="flex flex-col sm:flex-row gap-4 pt-6">
            <Button
              onClick={() => readyUp()}
              disabled={!hasVoted || !!game.readyPlayers?.includes(persistentPlayerId ?? '')}
              className="flex-1 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white text-lg py-6 rounded-lg shadow-lg transition-all hover:scale-105 focus:ring-4 focus:ring-green-500/50 disabled:opacity-70"
            >
              {!!game.readyPlayers?.includes(persistentPlayerId ?? '') ? "✔️ Ready!" : "Ready for Results"}
            </Button>
            {isHost && (
              <Button
                onClick={() => hostEndVoting()}
                variant="outline"
                className="flex-1 border-accent text-accent-foreground hover:bg-accent/20 hover:border-accent/70 text-lg py-6 rounded-lg shadow-lg transition-all hover:scale-105 focus:ring-4 focus:ring-accent/50"
              >
                End Voting
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  // RESULTS Phase UI
  if (game?.phase === GAME_PHASES.RESULTS && game?.results) {
    const impostorPlayer = game?.players.find(p => p.id === game.results.impostorId);
    const mostVotedPlayer = game?.players.find(p => p.id === game.results.mostVotedId);

    return (
      <Card className="w-full max-w-xl mx-auto bg-card/90 backdrop-blur-lg border-border shadow-2xl rounded-xl text-center">
        <CardHeader className="pt-8 pb-4 border-b border-border/50">
          <CardTitle className="text-5xl font-extrabold tracking-tight
            bg-clip-text text-transparent bg-gradient-to-r
            from-primary via-accent-foreground to-secondary-foreground">
            Game Over!
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-8">
          <div
            className={`p-6 rounded-xl shadow-xl text-3xl font-bold transition-all duration-500 ease-in-out transform hover:scale-105
              ${game.results.impostorCaught
                ? "bg-gradient-to-br from-green-500 via-green-600 to-teal-500 text-white"
                : "bg-gradient-to-br from-red-500 via-red-600 to-rose-700 text-white"
              }`}
          >
            {game.results.impostorCaught ? "🎉 IMPOSTOR CAUGHT! 🎉" : "💀 IMPOSTOR ESCAPED! 💀"}
            <p className="text-lg font-normal mt-1 opacity-90">
              {game.results.impostorCaught ? "The crewmates win!" : "The impostor wins!"}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left pt-4">
            <div className="p-5 bg-muted/70 rounded-xl shadow-lg">
              <h4 className="text-xl font-semibold text-accent-foreground mb-3 border-b border-border/50 pb-2">The Impostor Was:</h4>
              {impostorPlayer ? (
                <div className="flex items-center gap-3">
                  <Image src={impostorPlayer.avatarUrl} alt={`${impostorPlayer.name}'s avatar`} width={48} height={48} className="rounded-full border-3 border-destructive shadow-md" />
                  <span className="text-2xl font-bold text-foreground tracking-wide">{impostorPlayer.name}</span>
                </div>
              ) : (
                 <p className="text-muted-foreground">Error: Impostor details not found.</p>
              )}
            </div>

            <div className="p-5 bg-muted/70 rounded-xl shadow-lg">
              <h4 className="text-xl font-semibold text-accent-foreground mb-3 border-b border-border/50 pb-2">Most Voted Player:</h4>
              {mostVotedPlayer ? (
                <div className="flex items-center gap-3">
                  <Image src={mostVotedPlayer.avatarUrl} alt={`${mostVotedPlayer.name}'s avatar`} width={48} height={48} className="rounded-full border-3 border-primary shadow-md" />
                  <span className="text-2xl font-bold text-foreground tracking-wide">{mostVotedPlayer.name}</span>
                </div>
              ) : (
                <p className="text-muted-foreground italic">No single player was decisively voted out.</p>
              )}
            </div>
          </div>

          {/* Detailed vote breakdown (optional) - Could be a collapsible section */}
          {/* Consider adding a display of who voted for whom if desired */}

          {isHost && (
            <Button
              onClick={resetGame}
              className="w-full mt-8 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground hover:from-primary/80 hover:to-primary text-xl py-7 rounded-lg shadow-xl transition-all hover:scale-105 hover:shadow-2xl focus:ring-4 focus:ring-primary/50"
            >
              ✨ Play Again ✨
            </Button>
          )}
          {!isHost && (
             <p className="text-center text-muted-foreground pt-6">Waiting for the host to start a new game...</p>
          )}
        </CardContent>
      </Card>
    );
  }

  // Fallback for unknown or loading phase
  return (
    <div className="text-center py-20">
      <svg className="mx-auto h-12 w-12 text-muted-foreground animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      <p className="mt-4 text-lg text-muted-foreground">Loading Game...</p>
    </div>
  );
}
