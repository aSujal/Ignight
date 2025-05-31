# Ignight

Ignight is a full-stack React and Node.js application containerized with Docker for easy setup and deployment.
Play with your friends in real-time through creative and social deduction games — like identifying the imposter based on hidden word or question mismatches.

## 🌟 Features

- Word Imposter: Everyone gets the same word except the imposter. Say related words without revealing too much!
- Question Imposter: Most get the same question; one doesn’t. Guess who!
- Guess the Sound: Choose a genre, listen to AI-generated music snippets, and guess the song!
- Would You Rather: Fun, tough choices with friends.
- Real-time multiplayer
- Join via game codes
- Round-based mechanics
- WebSocket real-time backend

## Quick Setup

1. **Clone and run the app locally with Docker:**

   ```bash
   git clone <repository-url>
   cd ignight
   docker-compose up --build
   ```

2. **Access the application:**
   - Frontend: [http://localhost:3000](http://localhost:3000)
   - Backend: [http://localhost:4000](http://localhost:4000)

## Project Structure

- `frontend/`: React frontend application
- `backend/`: Node.js backend application
- `docker-compose.yml`: Docker Compose configuration
- `.env`: Environment variables