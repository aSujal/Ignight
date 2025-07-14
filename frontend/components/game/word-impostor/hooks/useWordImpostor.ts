import { GameState, Player, Vote } from "@/lib/types";

export function useWordImpostor(game: GameState, playerId: string) {
    const currentPlayer = game.players.find((p) => p.id === playerId);
    const isHost = Boolean(currentPlayer?.isHost);
    const isImpostor = game.isImpostor ?? false;

    const hasSubmittedClue = game.clues?.some((c) => c.playerId === playerId) ?? false;
    const isReady = game.readyPlayers?.includes(playerId) ?? false;

    const totalHuman = game.players.filter((p) => !p.isBot).length;

    const voted = game.votes?.some((v: Vote) => v.voterId === playerId) ?? false;

    const voteFor =
        voted && game.votes
        ? game.votes.find((v: Vote) => v.voterId === playerId)?.votedForPlayerId ?? null
        : null;

    return {
        currentPlayer,
        isHost,
        isImpostor,
        hasSubmittedClue,
        isReady,
        totalHuman,
        voted,
        voteFor,
    };
}
