import { GAME_PHASES } from "@/lib/enum";
import { GameState } from "@/lib/types";
import { ResultsPhase } from "./phases/ResultsPhase";
import { WaitingRoom } from "./phases/WaitingRoom";
import WordShow from "./phases/WordShow";
import { DiscussionPhase } from "./phases/DiscussionPhase";
import { VotingPhase } from "./phases/VotingPhase";

interface WordImpostorGameProps {
  game: GameState;
  submitClue: (clue: string) => void;
  submitVote: (playerId: string) => void;
  resetGame: () => void;
  startGame: () => void;
  hostEndWordShow: () => void;
  hostEndDiscussion: () => void;
  hostEndVoting: () => void;
  readyUp: () => void;
  addBotToGame: () => void;
  removePlayer: (playerId: string) => void;
}

export function WordImpostorGame(props: WordImpostorGameProps) {
  const {game} = props;

  switch (game.phase) {
    case GAME_PHASES.WAITING:
      return <WaitingRoom game={game} startGame={props.startGame} addBotToGame={props.addBotToGame} removePlayer={props.removePlayer} />
    case GAME_PHASES.WORD_SHOW:
      return <WordShow game={game} readyUp={props.readyUp} hostEndWordShow={props.hostEndWordShow}/>;
    case GAME_PHASES.DISCUSSION:
      return <DiscussionPhase game={game} readyUp={props.readyUp} hostEndDiscussion={props.hostEndDiscussion} submitClue={props.submitClue}/>;
    case GAME_PHASES.VOTING:
      return <VotingPhase game={game} voteForPlayer={props.submitVote} hostEndVoting={props.hostEndVoting}/>;
    case GAME_PHASES.RESULTS:
      return <ResultsPhase game={game} resetGame={props.resetGame}/>;
    default:
      return <div className="text-center text-muted-foreground mt-10">Unknown game phase.</div>;
  }
}
