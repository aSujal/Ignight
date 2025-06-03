//irrelevant for now

const express = require("express");
const router = express.Router();
const gameService = require("../services/GameService");

// GET /api/games - Get all active games
router.get("/", (req, res) => {
  try {
    const games = gameService.getAllGames();
    res.json({ success: true, data: games });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/games/:code - Get specific game by code
router.get("/:code", (req, res) => {
  try {
    const game = gameService.getGame(req.params.code);
    if (!game) {
      return res.status(404).json({ success: false, error: "Game not found" });
    }
    res.json({ success: true, data: game.toJSON() });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE /api/games/:code - Delete a game (admin/host only)
router.delete("/:code", (req, res) => {
  try {
    const deleted = gameService.deleteGame(req.params.code);
    if (!deleted) {
      return res.status(404).json({ success: false, error: "Game not found" });
    }
    res.json({ success: true, message: "Game deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;