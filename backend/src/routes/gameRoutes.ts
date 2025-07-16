import express, { Request, Response } from 'express';
import gameService from '../services/GameService';

const router = express.Router();

// GET /api/games - Get all active games
router.get('/', (req: Request, res: Response) => {
  try {
    const games = gameService.getAllGames();
    res.json({ success: true, data: games });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/games/:code - Get specific game by code
router.get('/:code', (req: Request, res: Response) => {
  try {
    const game = gameService.getGame(req.params.code);
    if (!game) {
      return res.status(404).json({ success: false, error: 'Game not found' });
    }
    res.json({ success: true, data: game.toJSON() });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE /api/games/:code - Delete a game (admin/host only)
router.delete('/:code', (req: Request, res: Response) => {
  try {
    const deleted = gameService.deleteGame(req.params.code);
    if (!deleted) {
      return res.status(404).json({ success: false, error: 'Game not found' });
    }
    res.json({ success: true, message: 'Game deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
