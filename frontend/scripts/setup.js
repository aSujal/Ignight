// Simple setup script to initialize the Socket.io server
const { exec } = require("child_process")

console.log("🚀 Starting GameHub multiplayer server...")

// Start the Next.js development server
const nextProcess = exec("npm run dev", (error, stdout, stderr) => {
  if (error) {
    console.error(`Error: ${error}`)
    return
  }
  console.log(stdout)
})

// Initialize the Socket.io server by making a request to the API
setTimeout(() => {
  console.log("📡 Initializing WebSocket server...")

  fetch("http://localhost:3000/api/socket", { method: "POST" })
    .then(() => {
      console.log("✅ WebSocket server initialized!")
      console.log("🎮 GameHub is ready! Open http://localhost:3000")
    })
    .catch((error) => {
      console.error("❌ Failed to initialize WebSocket server:", error)
      console.log("💡 Try refreshing the page after the server starts")
    })
}, 3000)

// Handle process termination
process.on("SIGINT", () => {
  console.log("\n🛑 Shutting down servers...")
  nextProcess.kill()
  process.exit()
})
