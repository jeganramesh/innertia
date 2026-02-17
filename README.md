# Innertia Placement Shell

A production-ready authentication system for the Innertia Placement Shell platform, featuring JWT-based authentication, role-based access control, and a modern React frontend.

## 🚀 Quick Start

### Prerequisites

- Docker & Docker Compose
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd innertia
   ```

2. **Start all services**
   ```bash
   docker-compose up -d
   ```

3. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - API Documentation: http://localhost:8000/api/docs

### Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| Student | student@innertia.edu | studentpass123 |
| Faculty | faculty@innertia.edu | facultypass123 |
| Admin | admin@innertia.edu | adminpass123 |

> **Note**: You'll need to register users first via the API or create them manually.

---

## 🏗️ Architecture

### Backend (FastAPI)

```
innertia-backend/
├── app/
│   ├── accounts/           # Authentication module
│   │   ├── models.py       # SQLAlchemy models (User, RefreshToken)
│   │   ├── schemas.py      # Pydantic schemas
│   │   ├── utils.py        # Password hashing, JWT tokens
│   │   ├── dependencies.py # Auth dependencies
│   │   └── routes.py       # API endpoints
│   ├── core/
│   │   ├── config.py       # Application settings
│   │   ├── database.py     # Database connection
│   │   ├── redis.py       # Redis client
│   │   └── security.py    # CORS, rate limiting
│   ├── celery_worker.py    # Celery configuration
│   └── main.py            # FastAPI application
├── alembic/                # Database migrations
├── tests/                  # Unit & integration tests
├── Dockerfile
└── requirements.txt
```

### Frontend (React 19 + TypeScript)

```
innertia-frontend/
├── src/
│   ├── pages/Login/        # Login page components
│   ├── services/auth.ts    # Authentication API service
│   ├── hooks/useAuth.ts    # Authentication hook
│   └── App.tsx            # Main application
├── Dockerfile
└── package.json
```

---

## 🔐 Authentication API

### Endpoints

All endpoints are prefixed with `/api/v1/accounts`.

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/register` | Register new user |
| POST | `/login` | Authenticate and get tokens |
| POST | `/refresh` | Refresh access token |
| POST | `/logout` | Logout (blacklist tokens) |
| GET | `/me` | Get current user info |

### Example Usage

#### Register User
```bash
curl -X POST "http://localhost:8000/api/v1/accounts/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "student@innertia.edu",
    "password": "securepassword123",
    "full_name": "John Doe",
    "role": "student"
  }'
```

#### Login
```bash
curl -X POST "http://localhost:8000/api/v1/accounts/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "student@innertia.edu",
    "password": "securepassword123"
  }'
```

Response:
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIs...",
  "token_type": "bearer"
}
```

#### Access Protected Endpoint
```bash
curl -X GET "http://localhost:8000/api/v1/accounts/me" \
  -H "Authorization: Bearer <access_token>"
```

---

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the root directory:

```env
# Backend
SECRET_KEY=your-secret-key-change-in-production
DATABASE_URL=postgresql+asyncpg://innertia:innertia123@postgres:5432/innertia_placement
REDIS_URL=redis://redis:6379/0
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7

# Frontend
VITE_API_URL=http://localhost:8000
```

---

## 🧪 Testing

### Backend Tests

```bash
cd innertia-backend

# Run tests
pytest tests/ -v --cov

# Run with coverage report
pytest tests/ --cov=app --cov-report=html
```

### Frontend Tests

```bash
cd innertia-frontend

# Run tests
npm test

# Run with coverage
npm test -- --coverage
```

---

## 🐳 Docker Services

| Service | Port | Description |
|---------|------|-------------|
| postgres | 5432 | PostgreSQL database |
| redis | 6379 | Redis cache & broker |
| backend | 8000 | FastAPI application |
| frontend | 3000 | React application |
| celery_worker | - | Background task worker |

---

## 📁 Project Structure

```
innertia/
├── docker-compose.yml
├── README.md
├── .env.example
├── innertia-backend/
│   ├── app/
│   ├── alembic/
│   ├── tests/
│   ├── Dockerfile
│   └── requirements.txt
└── innertia-frontend/
    ├── src/
    ├── Dockerfile
    └── package.json
```

---

## 🔒 Security Features

- **JWT Authentication**: Access + Refresh tokens
- **Password Hashing**: bcrypt with salt
- **Token Blacklisting**: Redis-based logout
- **Rate Limiting**: Configurable requests per minute
- **CORS**: Configured for frontend origins
- **Input Validation**: Pydantic schemas
- **Security Headers**: XSS, CSRF protection

---

## 📝 License

MIT License

---

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request
