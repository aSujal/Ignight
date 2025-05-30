# Ignight

Ignight is a full-stack React and Node.js application containerized with Docker for easy setup and deployment.

## Quick Setup

1. **Clone the repo:**

   ```bash
   git clone <repo-url>
   cd ignight
```

2. **Build and run the containers:**

   ```bash
   docker-compose up --build
```

3. **Access the application:**

   - Frontend: http://localhost:3000
   - Backend: http://localhost:4000

## Project Structure

- `frontend/`: React frontend application
- `backend/`: Node.js backend application
- `docker-compose.yml`: Docker Compose configuration
- `.env`: Environment variables