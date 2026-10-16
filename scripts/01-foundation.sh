#!/usr/bin/env bash
set -Eeuo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

echo "==> Creating HZ Retail POS foundation..."

# --------------------------------------------------
# Root configuration
# --------------------------------------------------

cat > .gitignore <<'EOF'
node_modules/
dist/
coverage/
.env
.env.*
!.env.example
*.log
.DS_Store
.vscode/
.idea/
EOF

cat > .env.example <<'EOF'
NODE_ENV=development
PORT=5000
CLIENT_URL=http://localhost:5173
MONGODB_URI=mongodb://127.0.0.1:27017/hz_retail_pos?replicaSet=rs0
EOF

cat > README.md <<'EOF'
# HZ Retail POS

A portfolio-focused retail point-of-sale application built with
React, Vite, Node.js, Express, and MongoDB.

## Architecture

- frontend/: React and Vite application
- backend/: Express API
- tests/: automated tests
- docs/: architecture, API, and deployment documentation
- docker-compose.yml: local MongoDB development service

## Development

Requirements:
- Node.js 22 or a compatible supported LTS release
- npm
- Docker Engine and Docker Compose
- Git

1. Copy `.env.example` to `backend/.env`.
2. Start MongoDB with `docker compose up -d`.
3. Install frontend dependencies with `cd frontend && npm install`.
4. Install backend dependencies with `cd backend && npm install`.
5. Start each application using its `npm run dev` command.

The demo will use synthetic data and simulated payments.
Never use real customer payment information or commit secrets.

## API health check

GET /api/v1/health
EOF

# --------------------------------------------------
# Frontend: React + Vite
# --------------------------------------------------

cat > frontend/package.json <<'EOF'
{
  "name": "hz-retail-pos-frontend",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "lucide-react": "^0.468.0",
    "react": "^18.3.1",
    "react-dom": "^18.3.1"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.3.4",
    "vite": "^6.0.5"
  }
}
EOF

cat > frontend/index.html <<'EOF'
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta
      name="description"
      content="HZ Retail POS — practical retail operations and point of sale."
    />
    <meta name="theme-color" content="#F7F7F2" />
    <title>HZ Retail POS</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
EOF

cat > frontend/vite.config.js <<'EOF'
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: '127.0.0.1',
    port: 5173,
    strictPort: true
  }
});
EOF

cat > frontend/src/main.jsx <<'EOF'
import React from 'react';
import { createRoot } from 'react-dom/client';
import './styles/global.css';

function App() {
  return (
    <main className="foundation">
      <div className="brand-mark" aria-hidden="true">HZ</div>
      <p className="eyebrow">RETAIL OPERATIONS</p>
      <h1>HZ Retail POS</h1>
      <p className="intro">
        Your retail workspace is being prepared.
      </p>
      <div className="foundation-status">
        <span className="status-dot" />
        Application foundation initialized
      </div>
    </main>
  );
}

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
EOF

mkdir -p frontend/src/styles

cat > frontend/src/styles/global.css <<'EOF'
:root {
  font-family: Inter, ui-sans-serif, system-ui, -apple-system,
    BlinkMacSystemFont, "Segoe UI", sans-serif;
  color: #252A27;
  background: #F7F7F2;
  font-synthesis: none;
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  font-optical-sizing: auto;
  font-size: 14px;
  font-weight: 400;
}

* {
  box-sizing: border-box;
}

body {
  min-width: 320px;
  min-height: 100vh;
  margin: 0;
}

button, input, select, textarea {
  font: inherit;
}

button {
  cursor: pointer;
}

:focus-visible {
  outline: 3px solid #6C987B;
  outline-offset: 3px;
}

.foundation {
  width: min(100% - 32px, 620px);
  margin: 15vh auto 0;
}

.brand-mark {
  display: grid;
  width: 48px;
  height: 48px;
  place-items: center;
  border-radius: 10px;
  background: #244C3A;
  color: #FFFFFF;
  font-weight: 700;
  letter-spacing: -0.04em;
}

.eyebrow {
  margin: 32px 0 8px;
  color: #66716A;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.12em;
}

h1 {
  margin: 0;
  font-size: clamp(28px, 5vw, 40px);
  letter-spacing: -0.04em;
  font-weight: 650;
}

.intro {
  margin-top: 12px;
  color: #66716A;
  font-size: 15px;
  line-height: 1.7;
}

.foundation-status {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  margin-top: 24px;
  padding: 12px 14px;
  border: 1px solid #DADDD5;
  border-radius: 8px;
  background: #FFFFFF;
  color: #252A27;
  font-size: 13px;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #244C3A;
}
EOF

# --------------------------------------------------
# Backend: Express + Mongoose
# --------------------------------------------------

cat > backend/package.json <<'EOF'
{
  "name": "hz-retail-pos-backend",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "node --watch src/server.js",
    "start": "node src/server.js",
    "check": "node --check src/server.js && node --check src/app.js"
  },
  "dependencies": {
    "cors": "^2.8.5",
    "dotenv": "^16.4.7",
    "express": "^4.21.2",
    "helmet": "^8.0.0",
    "mongoose": "^8.9.5"
  }
}
EOF

cat > backend/.env.example <<'EOF'
NODE_ENV=development
PORT=5000
CLIENT_URL=http://localhost:5173
MONGODB_URI=mongodb://127.0.0.1:27017/hz_retail_pos?replicaSet=rs0
EOF

cat > backend/src/config/database.js <<'EOF'
import mongoose from 'mongoose';

export async function connectDatabase() {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error('MONGODB_URI is not configured.');
  }

  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 5000
  });

  console.log('MongoDB connected.');
}
EOF

cat > backend/src/app.js <<'EOF'
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';

const app = express();

app.disable('x-powered-by');
app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173'
}));
app.use(express.json({ limit: '100kb' }));

app.get('/api/v1/health', (_req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'hz-retail-pos-api',
    timestamp: new Date().toISOString()
  });
});

app.use((_req, res) => {
  res.status(404).json({
    error: {
      code: 'NOT_FOUND',
      message: 'The requested resource was not found.'
    }
  });
});

app.use((err, _req, res, _next) => {
  console.error(err);

  res.status(err.status || 500).json({
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected server error occurred.'
    }
  });
});

export default app;
EOF

cat > backend/src/server.js <<'EOF'
import 'dotenv/config';
import app from './app.js';
import { connectDatabase } from './config/database.js';

const port = Number(process.env.PORT) || 5000;

try {
  await connectDatabase();

  const server = app.listen(port, '127.0.0.1', () => {
    console.log(`HZ Retail POS API listening on port ${port}`);
  });

  async function shutdown(signal) {
    console.log(`${signal} received. Shutting down...`);

    server.close(async () => {
      const mongoose = await import('mongoose');
      await mongoose.default.disconnect();
      process.exit(0);
    });

    setTimeout(() => process.exit(1), 10000).unref();
  }

  process.once('SIGINT', () => shutdown('SIGINT'));
  process.once('SIGTERM', () => shutdown('SIGTERM'));
} catch (error) {
  console.error('Application startup failed:', error.message);
  process.exit(1);
}
EOF

# --------------------------------------------------
# Local MongoDB replica set
# Required later for atomic sale/inventory transactions
# --------------------------------------------------

cat > docker-compose.yml <<'EOF'
services:
  mongo:
    image: mongo:8
    container_name: hz-retail-pos-mongo
    command: ["mongod", "--replSet", "rs0", "--bind_ip_all"]
    restart: unless-stopped
    ports:
      - "127.0.0.1:27017:27017"
    volumes:
      - pos_mongodb_data:/data/db
    healthcheck:
      test:
        - CMD-SHELL
        - >-
          mongosh --quiet --eval
          "try { rs.status().ok } catch(e) { rs.initiate({_id:'rs0',members:[{_id:0,host:'localhost:27017'}]}).ok }"
          | grep -q 1
      interval: 5s
      timeout: 10s
      retries: 15
      start_period: 10s

volumes:
  pos_mongodb_data:
EOF

# --------------------------------------------------
# Ignore secrets and create local environment file
# --------------------------------------------------

if [[ ! -f backend/.env ]]; then
  cp backend/.env.example backend/.env
  echo "Created backend/.env from its example."
else
  echo "Preserved existing backend/.env."
fi

echo
echo "==> Foundation files created."
echo "Next: install dependencies and validate the setup."
