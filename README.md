# HZ Retail POS

A full-stack retail Point of Sale (POS) application built with **React, Vite, Node.js, Express, and MongoDB**. This project demonstrates application development, Docker containerization, reverse-proxy configuration, persistent database storage, and automated CI validation.

## Features

- User authentication and administration
- Product and category management
- Inventory management and stock movement tracking
- Sales and returns workflows
- Reports and business settings
- REST API with a health endpoint
- Docker Compose environment
- GitHub Actions CI pipeline for validation and Docker builds

> **Note:** Payment processing is simulated. Do not use this project to process real payments or store real payment-card information.

## Technology Stack

| Component | Technology |
|---|---|
| Frontend | React, Vite, JavaScript, CSS |
| Backend | Node.js, Express |
| Database | MongoDB, Mongoose |
| Session storage | Express Session, connect-mongo |
| Password hashing | bcryptjs |
| Web server | Nginx |
| Containerization | Docker, Docker Compose |
| Continuous integration | GitHub Actions |

## Architecture

```text
Browser
   |
   v
React frontend served by Nginx
   |
   | /api/ requests
   v
Express REST API
   |
   v
MongoDB
```

Docker Compose runs the frontend, backend, and MongoDB as separate services. Nginx serves the frontend and proxies API requests to the backend. MongoDB uses a named Docker volume for persistent storage.

## Repository Structure

- `.github/workflows/ci.yml` — CI pipeline
- `backend/src/` — API configuration, controllers, models, routes, middleware, and validators
- `backend/scripts/` — administrative setup utilities
- `backend/Dockerfile` — backend container image
- `frontend/src/` — React application
- `frontend/Dockerfile` — frontend build and Nginx image
- `frontend/nginx.conf` — reverse-proxy and frontend routing configuration
- `docker-compose.yml` — local multi-container environment
- `scripts/` — project setup and verification scripts

## Prerequisites

For Docker deployment:

- Docker Engine
- Docker Compose v2
- OpenSSL

For local development:

- Node.js 22
- npm
- Git
- A reachable MongoDB instance

## Quick Start: Docker Compose

### 1. Clone the repository

```bash
git clone https://github.com/hzdevops52/POS_System.git
cd POS_System
```

### 2. Configure the environment

Create the local backend environment file:

```bash
cp backend/.env.example backend/.env
```

Generate a strong session secret:

```bash
openssl rand -hex 32
```

Edit `backend/.env` and replace the `SESSION_SECRET` placeholder with the generated value. Never commit this file or share its contents.

### 3. Build and start the application

```bash
docker compose up -d --build
```

Check service status:

```bash
docker compose ps
```

View logs:

```bash
docker compose logs --tail=100
```

### 4. Access the application

- **Frontend:** http://localhost:8082
- **API health check:** http://localhost:8082/api/v1/health

Check the API using:

```bash
curl -fsS http://localhost:8082/api/v1/health
```

Create the initial administrator using the project's administrator-creation script after configuring the database connection and installing backend dependencies. The script prompts for the password without displaying it and refuses to create another administrator if one already exists.

### 5. Stop the application

```bash
docker compose down
```

This stops and removes the Compose containers while preserving the named MongoDB volume. Avoid `docker compose down -v` unless you intentionally want to delete the stored database volume.

## Local Development

Configure the backend environment variables, including `MONGODB_URI` and `SESSION_SECRET`, for a MongoDB instance reachable from your host.

Install dependencies from the repository root:

```bash
npm ci --prefix backend
npm ci --prefix frontend
```

Start the backend in one terminal:

```bash
cd backend
npm run dev
```

Start the frontend in a second terminal:

```bash
cd frontend
npm run dev
```

Use the frontend URL printed by Vite and ensure `CLIENT_URL` matches the frontend origin.

## Continuous Integration

The GitHub Actions workflow at `.github/workflows/ci.yml` runs on pushes, pull requests, and manual dispatch.

It performs the following steps:

1. Checks out the repository.
2. Sets up Node.js 22.
3. Installs backend dependencies with `npm ci`.
4. Checks backend JavaScript syntax.
5. Installs frontend dependencies with `npm ci`.
6. Builds the frontend for production.
7. Builds the backend Docker image.
8. Builds the frontend Docker image.

The workflow validates and builds the application. It does not publish images or deploy to a server.

## Useful Commands

| Task | Command |
|---|---|
| Check backend syntax | `npm run check --prefix backend` |
| Build frontend | `npm run build --prefix frontend` |
| Validate Compose configuration | `docker compose config -q` |
| Build and start services | `docker compose up -d --build` |
| Inspect services | `docker compose ps` |
| View logs | `docker compose logs --tail=100` |
| Stop services | `docker compose down` |

## Security Considerations

- Never commit `.env` files, passwords, session secrets, or production credentials.
- Generate a unique session secret for each environment.
- Use synthetic data for demonstrations.
- Do not store real payment-card information in the application.
- Restrict access to the application and database when deploying beyond a local machine.
- Review authentication, authorization, TLS, backups, monitoring, and dependency updates before production use.

## Validation Scope

The development environment has passed the backend syntax check, frontend production build, Docker image builds, and Docker Compose configuration validation.

These checks do not prove that every end-to-end retail workflow has passed. Sales, returns, inventory consistency, authentication, and other critical workflows should receive dedicated integration and end-to-end testing before production use.

## Project Purpose

This repository demonstrates full-stack application packaging, Docker Compose orchestration, environment-based configuration, persistent database storage, Nginx reverse proxying, and CI validation with GitHub Actions.

**Repository:** [hzdevops52/POS_System](https://github.com/hzdevops52/POS_System)
