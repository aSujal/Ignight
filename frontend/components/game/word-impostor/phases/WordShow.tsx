import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GameState } from "@/lib/types";
import { usePersistentPlayerId } from "@/hooks/useLocalStorage";
import { useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { fadeInUp, slideInFromLeft, staggerContainer } from "@/app/animations";

interface WordShowProps {
  game: GameState;
  readyUp: () => void;
  hostEndWordShow: () => void;
}

export default function WordShow({
  game,
  readyUp,
  hostEndWordShow,
}: WordShowProps) {
  const [persistentPlayerId] = usePersistentPlayerId();

  const currentPlayer = useMemo(
    () => game.players.find((p) => p.id === persistentPlayerId),
    [game.players, persistentPlayerId]
  );

  const isCurrentPlayerImpostor = game.isImpostor ?? false;
  const isHost = currentPlayer?.isHost ?? false;
  const isPlayerReady = game.readyPlayers?.includes(persistentPlayerId ?? "");
  const totalHumanPlayers = game.players.filter((p) => !p.isBot).length;

  if (!game?.gameData) return null;
  const playerAvatars = (
    <motion.div
      className="flex md:flex-col md:gap-6 gap-4 justify-center md:justify-start"
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
    >
      {game.players.map((p) => {
        const isReady = game.readyPlayers?.includes(p.id);
        return (
          <motion.div
            key={p.id}
            variants={fadeInUp}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            className={`relative w-16 h-16 rounded-full overflow-hidden cursor-default
              border-4
              ${
                isReady
                  ? "border-green-500 shadow-[0_0_8px_2px_rgba(34,197,94,0.6)]"
                  : "border-gray-400 shadow-none"
              }
            `}
            title={p.name}
          >
            <img
              src={p.avatarUrl}
              alt={p.name}
              className="w-full h-full object-cover"
              draggable={false}
            />
          </motion.div>
        );
      })}
    </motion.div>
  );

  return (
    <div className="flex justify-center">
      <motion.div
        variants={slideInFromLeft}
        initial="hidden"
        animate="visible"
        className="w-full max-w-4xl md:flex md:items-start md:gap-8"
      >
        <Card className="bg-card/90 backdrop-blur-lg border-border shadow-2xl rounded-xl text-center w-full">
          <CardHeader>
            <motion.div variants={fadeInUp}>
              <CardTitle className="text-2xl font-semibold text-muted-foreground">
                Your Identity & Word
              </CardTitle>
              <div className="mt-2 text-base text-accent-foreground">
                <span>
                  {game.readyPlayers?.length || 0} / {game.players?.length}{" "}
                  Players Ready
                </span>
              </div>
            </motion.div>
          </CardHeader>

          <CardContent className="px-8 space-y-6 flex flex-col justify-center items-center min-h-[350px]">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{
                delay: 0.05,
                type: "spring",
                stiffness: 200,
                damping: 15,
              }}
              className={`text-xl sm:text-2xl md:text-3xl lg:text-4xl font-extrabold tracking-tight p-8 rounded-xl shadow-2xl transition-all duration-150 ease-in-out w-full ${
                isCurrentPlayerImpostor
                  ? "bg-gradient-to-br from-destructive via-destructive/90 to-red-700 text-destructive-foreground animate-pulse-slow"
                  : "bg-gradient-to-br from-primary via-primary/90 to-blue-700 text-primary-foreground"
              }`}
            >
              {isCurrentPlayerImpostor
                ? "🤫 YOU ARE THE IMPOSTOR 🤫"
                : game.gameData.word}
            </motion.div>
            <AnimatePresence>
              {isCurrentPlayerImpostor && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: 0.5 }}
                  className="space-y-4"
                >
                  <p className="text-2xl text-muted-foreground font-medium">
                    Hint:{" "}
                    <span className="text-accent-foreground">
                      {game.gameData.hint}
                    </span>
                  </p>
                  <p className="text-xl text-red-400/80 font-medium">
                    Blend in. Don't reveal yourself!
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Avatars on small screens */}
            <div className="block md:hidden w-full mt-6">{playerAvatars}</div>

            <motion.div 
                className="w-full space-y-3 mt-6"
                variants={fadeInUp}
                initial="hidden"
                animate="visible"
                transition={{ delay: 0.7 }}
              >
              <Button
                onClick={readyUp}
                disabled={isPlayerReady}
                className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white text-lg py-6 rounded-lg shadow-lg transition-all hover:scale-105 focus:ring-4 focus:ring-green-500/50 disabled:opacity-70"
              >
                {isPlayerReady ? "✔️ Ready" : "I'm Ready!"}
              </Button>

              {isHost && (
                <Button
                  onClick={hostEndWordShow}
                  variant="ghost"
                  size="sm"
                  className="w-full text-sm text-muted-foreground hover:text-accent-foreground opacity-90 hover:opacity-100 transition-opacity"
                >
                  Skip Phase for All
                </Button>
              )}
            </motion.div>
          </CardContent>
        </Card>

        {/* Avatars on medium+ screens */}
        <div className="hidden md:flex md:flex-col md:pt-8">
          {playerAvatars}
        </div>
      </motion.div>
    </div>
  );
}
