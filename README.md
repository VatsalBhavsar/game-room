# Game Room

Minimal, real-time quiz and typing games powered by Socket.IO. Rooms live in server memory only — if the server restarts, rooms are lost.

## Local development

1) Install dependencies:
```
npm install
```

2) Run client + server together:
```
npm run dev:all
```

Client runs on `http://localhost:5173` and the websocket server runs on `http://localhost:3001`.

## Environment variables

Frontend (Vite):
- `VITE_WS_URL` — websocket server URL (example: `http://localhost:3001`)

Server:
- `PORT` — defaults to `3001`
- `CORS_ORIGIN` — comma-separated list of allowed origins (example: `http://localhost:5173,https://your-vercel-app.vercel.app`)

## Deployment

Frontend:
- Deploy to Vercel
- Set `VITE_WS_URL` to your deployed websocket server URL

Backend:
- Deploy `server/index.js` to Render, Railway, or Fly.io
- Set `CORS_ORIGIN` to include your Vercel domain

## Notes

- No authentication
- No database or persistent storage
- Room state is ephemeral and stored in server memory only
