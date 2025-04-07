# Todo Application

A full-stack todo application built with Node.js, Express, PostgreSQL, Vue.js, and TypeScript.

## Tech Stack

- **Frontend**: Vue.js 3, TypeScript, Pinia
- **Backend**: Node.js, Express, TypeScript
- **Database**: PostgreSQL
- **Authentication**: Firebase
- **Containerization**: Docker

## Prerequisites

- Node.js (v16 or higher)
- npm (v7 or higher)
- Docker and Docker Compose (for Docker setup)
- PostgreSQL (for local development)

## Project Structure

```
monorepo/
├── packages/
│   ├── frontend/         # Vue.js frontend application
│   └── backend/          # Express backend application
└── docker-compose.yml    # Docker configuration
```

## Running the Application

### Option 1: Using Docker (Recommended)

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd monorepo
   ```

2. Start the application using Docker Compose:
   ```bash
   docker-compose up
   ```

   This will start:
   - Frontend at http://localhost:5173
   - Backend at http://localhost:4000
   - PostgreSQL database at localhost:5432

3. To stop the application:
   ```bash
   docker-compose down
   ```

### Option 2: Local Development (npm)

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd monorepo
   ```

2. Set up the database:
   - Create a PostgreSQL database named `todo_app`
   - Update the database credentials in `packages/backend/.env` if needed

3. Install dependencies:
   ```bash
   # Install backend dependencies
   cd packages/backend
   npm install

   # Install frontend dependencies
   cd ../frontend
   npm install
   ```

4. Start the backend server:
   ```bash
   cd packages/backend
   npm run dev
   ```

5. In a new terminal, start the frontend development server:
   ```bash
   cd packages/frontend
   npm run dev
   ```

   The application will be available at:
   - Frontend: http://localhost:5173
   - Backend: http://localhost:4000

## Environment Variables

### Backend (.env)
```
NODE_ENV=development
PORT=4000
HOST=0.0.0.0
POSTGRES_USER=user
POSTGRES_PASSWORD=password
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=todo_app
```

### Frontend (.env)
```
VITE_API_URL=/api
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/verify` - Verify authentication token

### Tasks
- `GET /api/tasks` - Get all tasks
- `POST /api/tasks` - Create a new task
- `PUT /api/tasks/:id` - Update a task
- `POST /api/tasks/:id/share` - Share a task with another user

## Development

### Running Tests
```bash
# Backend tests
cd packages/backend
npm test

# Frontend tests
cd packages/frontend
npm test
```

### Database Migrations
```bash
cd packages/backend
npm run migrate
```

## Troubleshooting

### Common Issues

1. **Database Connection Issues**
   - Ensure PostgreSQL is running
   - Check database credentials in `.env` file
   - For Docker: Ensure the database container is healthy

2. **Frontend-Backend Communication**
   - For Docker: Ensure all services are in the same network
   - For local: Check if the backend is running on port 4000

3. **Port Conflicts**
   - If ports 5173 or 4000 are in use, modify the port mappings in `docker-compose.yml` or update the environment variables

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details. 