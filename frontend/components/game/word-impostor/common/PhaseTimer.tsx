export function PhaseTimer({ time, readyCount, totalPlayers }: {
    time: number | null | undefined;
    readyCount: number;
    totalPlayers: number;
}) {
    return (
        <div className="text-muted-foreground font-mono">
            <span>Time: {time ?? "N/A"}s</span> | <span>{readyCount}/{totalPlayers} Ready</span>
        </div>
    );
}
