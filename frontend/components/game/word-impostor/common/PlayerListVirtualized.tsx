// this component optimizes rendering of the player cards by not rendreing ones that are not visible ( pretty cool )
'use client';

import { FixedSizeGrid as Grid } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';
import PlayerClueList from './PlayerClueList';
import { GameState } from '@/lib/types';

interface PlayerListVirtualizedProps {
  game: GameState;
}

export default function PlayerListVirtualized({ game }: PlayerListVirtualizedProps) {
  const players = game.players;
  if (!players) return null;

  return (
    <div className="w-full h-[60vh]">
      <AutoSizer>
        {({ height, width }) => {
          let columnCount = 1;
          if (width >= 1024) columnCount = 4;
          else if (width >= 768) columnCount = 3;
          else if (width >= 640) columnCount = 2;

          const rowCount = Math.ceil(players.length / columnCount);
          const itemHeight = 160;
          const itemWidth = columnCount === 1 ? width : width / columnCount;

          return (
            <Grid
              columnCount={columnCount}
              columnWidth={itemWidth}
              height={height}
              rowCount={rowCount}
              rowHeight={itemHeight}
              width={width}
            >
              {({ rowIndex, columnIndex, style }) => {
                const index = rowIndex * columnCount + columnIndex;
                if (index >= players.length) return null;

                const player = players[index];
                const clues = game.clues.filter((c) => c.playerId === player.id);

                return (
                  <div style={style} className="p-2">
                    <PlayerClueList player={player} playerClues={clues} />
                  </div>
                );
              }}
            </Grid>
          );
        }}
      </AutoSizer>
    </div>
  );
}
