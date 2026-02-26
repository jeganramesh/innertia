# Innertia

<p align="center">
  <img src="https://img.shields.io/badge/Version-1.0.0-blue?style=flat-square" alt="Version" />
  <img src="https://img.shields.io/badge/License-MIT-green?style=flat-square" alt="License" />
  <img src="https://img.shields.io/badge/Python-3.8%2B-yellow?style=flat-square" alt="Python Version" />
  <img src="img.shields.io/badge/React-18%2B-blue?style=flat-square" alt="React Version" />
  <img src="https://img.shields.io/badge/Docker-Ready-blue?style=flat-square" alt="Docker Ready" />
</p>

> A comprehensive full-stack learning and management platform featuring role-based access control for administrators, faculty, and students with tailored dashboards and functionalities.

## 📋 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Technology Stack](#-technology-stack)
- [Architecture](#-architecture)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [Local Development Setup](#local-development-setup)
  - [Docker Setup](#docker-setup)
- [Environment Configuration](#-environment-configuration)
- [API Documentation](#-api-documentation)
- [Database Migrations](#-database-migrations)
- [Testing](#-testing)
- [Deployment](#-deployment)
- [Security](#-security)
- [Contributing](#-contributing)
- [License](#-license)
- [Support](#-support)
- [Acknowledgments](#-acknowledgments)

---

## 📖 Overview

Innertia is a comprehensive educational management platform designed to streamline academic operations through modern web technologies. The platform provides distinct interfaces and functionalities for three key user roles:

- **Administrators**: Full system oversight with user management, analytics, and configuration capabilities
- **Faculty**: Class management, session tracking, student oversight, and AI-powered note generation
- **Students**: Personalized learning experience with session access, notes management, and progress tracking

---

## ✨ Features

### Administrator Features
- **User Management**: Create, update, delete, and bulk import users with role-based assignments
- **Class Management**: Full CRUD operations for academic classes and enrollments
- **Analytics Dashboard**: Comprehensive metrics on system usage, user activity, and performance
- **Audit Logging**: Complete trail of administrative actions for compliance and security
- **System Configuration**: Flexible settings for application behavior and integrations

### Faculty Features
- **Class Management**: Create and manage classes with enrollment tracking
- **Session Tracking**: Monitor and manage academic sessions with real-time updates
- **Student Oversight**: View enrolled students and their progress
- **AI Notes Generation**: Generate intelligent notes from uploaded materials using AI
- **File Upload**: Batch upload and manage educational content

### Student Features
- **Personalized Dashboard**: Role-specific view of enrolled classes and upcoming sessions
- **Session Access**: View and access assigned learning sessions
- **Notes Management**: Access and review AI-generated and personal notes
- **Progress Tracking**: Monitor learning progress across sessions

### System Features
- **Role-Based Access Control (RBAC)**: Secure authentication and authorization
- **RESTful API**: Well-structured API endpoints following best practices
- **Real-time Updates**: WebSocket support for live data synchronization
- **Celery Task Queue**: Asynchronous task processing for background jobs
- **Redis Caching**: Performance optimization through intelligent caching

---

## 🛠 Technology Stack

### Backend
| Technology | Version | Purpose |
|------------|---------|---------|
| Python | 3.8+ | Primary runtime |
| FastAPI | 0.109+ | REST API framework |
| SQLAlchemy | 2.0+ | ORM |
| Alembic | 1.13+ | Database migrations |
| Celery | 5.3+ | Task queue |
| Redis | 7.0+ | Caching & message broker |
| Pydantic | 2.5+ | Data validation |
| Python-Jose | 3.3+ | JWT authentication |
| Passlib | 1.7+ | Password hashing |

### Frontend
| Technology | Version | Purpose |
|------------|---------|---------|
| React | 18+ | UI framework |
| TypeScript | 5.0+ | Type safety |
| Vite | 5.0+ | Build tool |
| Tailwind CSS | 3.4+ | Styling |
| React Router | 6+ | Navigation |
| Zustand | 4.5+ | State management |
| Axios | 1.6+ | HTTP client |
| React Query | 5+ | Server state |

### Database & Infrastructure
| Technology | Purpose |
|------------|---------|
| SQLite | Development database |
| PostgreSQL | Production database (recommended) |
| Docker | Containerization |
| Docker Compose | Multi-container orchestration |
| Nginx | Reverse proxy |

---

## 🏗 Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Client Layer                            │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                   React + TypeScript                    │    │
│  │  ┌──────────┐  ┌──────────┐  ┌────────────────────┐   │    │
│  │  │  Admin   │  │  Faculty  │  │     Student        │   │    │
│  │  │   UI     │  │    UI     │  │        UI          │   │    │
│  │  └──────────┘  └──────────┘  └────────────────────┘   │    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                        API Gateway                              │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │              FastAPI REST + WebSocket                    │    │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────┐  │    │
│  │  │ Accounts │  │  Admin   │  │ Faculty  │  │Student │  │    │
│  │  │   API    │  │   API    │  │   API    │  │  API   │  │    │
│  │  └──────────┘  └──────────┘  └──────────┘  └────────┘  │    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┼───────────────┐
              ▼               ▼               ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│   SQLAlchemy    │ │     Celery      │ │     Redis       │
│     (ORM)       │ │  (Task Queue)   │ │    (Cache)      │
└─────────────────┘ └─────────────────┘ └─────────────────┘
              │               │               │
              ▼               ▼               ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│    Database     │ │  Message Queue  │ │  In-Memory      │
│   (SQLite/PG)   │ │    (Redis)      │ │    Cache        │
└─────────────────┘ └─────────────────┘ └─────────────────┘
```

---

## 📂 Project Structure

```
innertia/
├── .dockerignore              # Docker ignore patterns
├── .env.example               # Environment variables template
├── .gitignore                 # Git ignore patterns
├── docker-compose.yml         # Docker Compose configuration
├── README.md                  # This file
│
├── innertia-backend/          # Backend application
│   ├── alembic.ini            # Alembic configuration
│   ├── Dockerfile             # Backend Docker image
│   ├── requirements.txt       # Python dependencies
│   ├── .env.example           # Backend environment template
│   │
│   ├── alembic/               # Database migrations
│   │   ├── env.py
│   │   └── versions/          # Migration files
│   │
│   ├── app/                   # Application package
│   │   ├── __init__.py
│   │   ├── main.py            # FastAPI application entry
│   │   ├── celery_worker.py   # Celery worker setup
│   │   │
│   │   ├── accounts/          # User authentication & management
│   │   │   ├── models.py
│   │   │   ├── routes.py
│   │   │   ├── schemas.py
│   │   │   ├── utils.py
│   │   │   └── dependencies.py
│   │   │
│   │   ├── admin/             # Admin panel functionality
│   │   │   ├── router.py
│   │   │   ├── schemas.py
│   │   │   └── service.py
│   │   │
│   │   ├── faculty/           # Faculty operations
│   │   │   ├── router.py
│   │   │   └── schemas.py
│   │   │
│   │   ├── student/           # Student operations
│   │   │   ├── router.py
│   │   │   └── schemas.py
│   │   │
│   │   ├── ai_notes/          # AI-powered notes generation
│   │   │   ├── router.py
│   │   │   ├── schemas.py
│   │   │   └── service.py
│   │   │
│   │   ├── core/              # Core utilities
│   │   │   ├── config.py      # Configuration management
│   │   │   ├── database.py    # Database connection
│   │   │   ├── redis.py       # Redis client
│   │   │   └── security.py    # Authentication & authorization
│   │   │
│   │   ├── models/            # SQLAlchemy models
│   │   │   └── models.py
│   │   │
│   │   └── scripts/           # Utility scripts
│   │       ├── create_test_users.py
│   │       └── create_cryptography_class.py
│   │
│   └── tests/                 # Backend tests
│       ├── conftest.py
│       └── test_accounts.py
│
└── innertia-frontend/         # Frontend application
    ├── Dockerfile             # Frontend Docker image
    ├── nginx.conf             # Nginx configuration
    ├── package.json           # Node.js dependencies
    ├── tailwind.config.js     # Tailwind CSS config
    ├── tsconfig.json          # TypeScript config
    ├── vite.config.js         # Vite config
    │
    ├── public/                # Static assets
    │
    └── src/                   # Source code
        ├── main.jsx           # Application entry
        ├── App.jsx            # Root component
        │
        ├── components/        # React components
        │   ├── ai/            # AI-related components
        │   ├── faculty/      # Faculty components
        │   ├── layout/       # Layout components
        │   ├── ui/           # Reusable UI components
        │   └── upload/       # File upload components
        │
        ├── pages/             # Page components
        │   ├── admin/        # Admin pages
        │   ├── faculty/      # Faculty pages
        │   ├── student/      # Student pages
        │   └── Login/        # Authentication pages
        │
        ├── hooks/             # Custom React hooks
        │   ├── useAuth.ts
        │   └── useFacultyData.ts
        │
        ├── services/          # API services
        │   ├── api.ts
        │   ├── auth.ts
        │   ├── adminApi.ts
        │   ├── facultyApi.ts
        │   ├── studentApi.ts
        │   └── websocketService.ts
        │
        ├── stores/            # State management
        │   ├── facultyStore.ts
        │   └── uploadStore.ts
        │
        ├── types/             # TypeScript types
        │   └── index.ts
        │
        └── utils/             # Utility functions
            └── formatters.ts
```

---

## 🚀 Getting Started

### Prerequisites

Ensure you have the following installed on your system:

| Tool | Version | Purpose |
|------|---------|---------|
| Git | 2.0+ | Version control |
| Python | 3.8+ | Backend runtime |
| Node.js | 18+ | Frontend runtime |
| npm | 9+ | Package manager |
| Docker | 24+ | Containerization |
| Docker Compose | 2.24+ | Orchestration |

### Local Development Setup

#### 1. Clone the Repository

```bash
git clone https://github.com/your-org/innertia.git
cd innertia
```

#### 2. Backend Setup

```bash
# Navigate to backend directory
cd innertia-backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Linux/macOS:
source venv/bin/activate

# On Windows:
venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Copy environment variables
cp .env.example .env

# Edit .env with your configuration
# See Environment Configuration section below
```

#### 3. Database Setup

```bash
# Run database migrations
alembic upgrade head

# (Optional) Create test data
python -m app.scripts.create_test_users
```

#### 4. Start Backend Server

```bash
# Development server with auto-reload
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Access API documentation at http://localhost:8000/docs
```

#### 5. Frontend Setup

Open a new terminal:

```bash
# Navigate to frontend directory
cd innertia-frontend

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Start development server
npm run dev

# Access the application at http://localhost:5173
```

### Docker Setup

#### Using Docker Compose (Recommended)

```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

#### Manual Docker Build

```bash
# Build backend image
docker build -t innertia-backend ./innertia-backend

# Build frontend image
docker build -t innertia-frontend ./innertia-frontend

# Run containers
docker run -d -p 8000:8000 --name innertia-backend innertia-backend
docker run -d -p 80:80 --name innertia-frontend innertia-frontend
```

---

## ⚙️ Environment Configuration

### Backend Environment Variables

Create a `.env` file in `innertia-backend/`:

```env
# Application
APP_NAME=Innertia
APP_VERSION=1.0.0
DEBUG=true
SECRET_KEY=your-secret-key-change-in-production

# Database
DATABASE_URL=sqlite:///./innertia.db
# For PostgreSQL: postgresql://user:password@localhost:5432/innertia

# Redis
REDIS_URL=redis://localhost:6379/0

# JWT Authentication
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7
ALGORITHM=HS256

# CORS
CORS_ORIGINS=http://localhost:5173,http://localhost:3000

# Celery
CELERY_BROKER_URL=redis://localhost:6379/1
CELERY_RESULT_BACKEND=redis://localhost:6379/2
```

### Frontend Environment Variables

Create a `.env` file in `innertia-frontend/`:

```env
# API Configuration
VITE_API_URL=http://localhost:8000
VITE_WS_URL=ws://localhost:8000

# Application
VITE_APP_NAME=Innertia
```

---

## 📚 API Documentation

Once the backend is running, access the interactive API documentation:

| Documentation | URL | Description |
|---------------|-----|-------------|
| Swagger UI | http://localhost:8000/docs | Interactive API explorer |
| ReDoc | http://localhost:8000/redoc | Alternative API docs |
| OpenAPI Schema | http://localhost:8000/openapi.json | Raw OpenAPI spec |

### API Endpoints Overview

#### Authentication
- `POST /api/accounts/register` - User registration
- `POST /api/accounts/login` - User login
- `POST /api/accounts/refresh` - Refresh access token
- `POST /api/accounts/logout` - User logout

#### Admin
- `GET /api/admin/users` - List all users
- `POST /api/admin/users` - Create user
- `PUT /api/admin/users/{id}` - Update user
- `DELETE /api/admin/users/{id}` - Delete user
- `POST /api/admin/users/bulk` - Bulk user import
- `GET /api/admin/analytics` - System analytics
- `GET /api/admin/audit-logs` - Audit log entries

#### Faculty
- `GET /api/faculty/classes` - List faculty classes
- `POST /api/faculty/classes` - Create class
- `GET /api/faculty/sessions` - List sessions
- `POST /api/faculty/sessions` - Create session
- `GET /api/faculty/students` - List enrolled students

#### Student
- `GET /api/student/classes` - List enrolled classes
- `GET /api/student/sessions` - List available sessions
- `GET /api/student/notes` - List personal notes

---

## 🗄 Database Migrations

### Creating Migrations

```bash
# Create a new migration
alembic revision --autogenerate -m "description_of_changes"

# Create empty migration
alembic revision -m "description_of_changes"
```

### Running Migrations

```bash
# Upgrade to latest revision
alembic upgrade head

# Upgrade to specific revision
alembic upgrade +2

# Downgrade one revision
alembic downgrade -1

# Show current revision
alembic current
```

### Migration Best Practices

1. Always test migrations in development before production
2. Include both forward and backward migrations
3. Use descriptive migration messages
4. Never modify existing migration files
5. Backup database before running migrations in production

---

## 🧪 Testing

### Backend Tests

```bash
cd innertia-backend

# Run all tests
pytest

# Run with coverage
pytest --cov=app --cov-report=html

# Run specific test file
pytest tests/test_accounts.py

# Run in watch mode
pytest --watch
```

### Frontend Tests

```bash
cd innertia-frontend

# Run all tests
npm test

# Run with coverage
npm test -- --coverage

# Run in watch mode
npm test -- --watch
```

### Linting

```bash
# Backend (Black, Flake8, Isort)
cd innertia-backend
black .
flake8 .
isort .

# Frontend (ESLint)
cd innertia-frontend
npm run lint
npm run lint:fix
```

---

## 🚢 Deployment

### Production Checklist

- [ ] Set `DEBUG=false` in environment
- [ ] Use strong `SECRET_KEY` (generate with `python -c "import secrets; print(secrets.token_hex(32))"`)
- [ ] Configure production database (PostgreSQL recommended)
- [ ] Set up SSL/TLS certificates
- [ ] Configure reverse proxy (Nginx)
- [ ] Set up monitoring and logging
- [ ] Configure backup strategy

### Docker Production Deployment

```bash
# Build production images
docker-compose -f docker-compose.yml build

# Run production services
docker-compose -f docker-compose.yml up -d

# Scale services (optional)
docker-compose up -d --scale backend=3
```

### Manual Production Deployment

#### Backend
```bash
cd innertia-backend

# Set production environment
export DEBUG=false
export DATABASE_URL=postgresql://user:pass@localhost:5432/innertia

# Run with gunicorn
gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker -b 0.0.0.0:8000
```

#### Frontend
```bash
cd innertia-frontend

# Build for production
npm run build

# Serve with Nginx (see nginx.conf)
```

---

## 🔒 Security

### Authentication & Authorization
- JWT-based authentication with access and refresh tokens
- Password hashing using bcrypt via Passlib
- Role-based access control (RBAC)
- Token expiration and refresh mechanisms

### API Security
- CORS configuration for allowed origins
- Rate limiting on authentication endpoints
- Input validation using Pydantic schemas
- SQL injection prevention via SQLAlchemy ORM

### Recommended Security Practices
1. Never commit `.env` files to version control
2. Use HTTPS in production
3. Implement request rate limiting
4. Regular security audits
5. Keep dependencies updated
6. Enable audit logging
7. Implement proper session management

---

## 🤝 Contributing

We welcome contributions! Please follow these steps:

### Contribution Guidelines

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

### Code Style

- **Python**: Follow PEP 8, use Black for formatting
- **JavaScript/TypeScript**: Follow ESLint rules, use Prettier
- **Commit Messages**: Use conventional commits format

### Testing Requirements

- All new features must include tests
- Ensure all tests pass before submitting PR
- Maintain test coverage above 80%

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

```
MIT License

Copyright (c) 2024 Innertia

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

## 💬 Support

### Getting Help

- **Documentation**: Check the `/docs` endpoint in the running application
- **Issue Tracker**: Report bugs and request features via GitHub Issues
- **Discussions**: Use GitHub Discussions for questions

### Reporting Issues

When reporting issues, please include:
1. Version of Innertia
2. Steps to reproduce
3. Expected vs actual behavior
4. Screenshots (if applicable)
5. Environment details

---

## 🙏 Acknowledgments

- [FastAPI](https://fastapi.tiangolo.com/) - The amazing Python web framework
- [React](https://react.dev/) - For the powerful UI library
- [SQLAlchemy](https://www.sqlalchemy.org/) - For the robust ORM
- [Tailwind CSS](https://tailwindcss.com/) - For the utility-first CSS framework
- [All Contributors](https://github.com/your-org/innertia/graphs/contributors) - For their valuable contributions

---

<p align="center">
  Made with ❤️ by the Innertia Team
</p>
