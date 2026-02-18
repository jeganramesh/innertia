# Innertia

A full-stack application designed as a comprehensive learning and management platform. It features distinct roles for administrators, faculty, and students, each with a tailored dashboard and functionalities.

## Technologies

- **Backend:** Python, FastAPI, SQLAlchemy, Alembic, Celery, Redis
- **Frontend:** React, TypeScript, Vite, Tailwind CSS
- **Database:** SQLite
- **Containerization:** Docker, Docker Compose

## Project Structure

```
/home/jegan/Desktop/innertia/
├───.dockerignore
├───.env.example
├───.gitignore
├───docker-compose.yml
├───README.md
├───.git/
├───innertia-backend/
│   ├───.env.example
│   ├───alembic.ini
│   ├───Dockerfile
│   ├───innertia.db
│   ├───requirements.txt
│   ├───__pycache__/
│   ├───alembic/
│   │   ├───env.py
│   │   └───versions/
│   │       └───001_initial_migration.py
│   ├───app/
│   │   ├───__init__.py
│   │   ├───celery_worker.py
│   │   ├───main.py
│   │   ├───accounts/
│   │   │   ├───__init__.py
│   │   │   ├───dependencies.py
│   │   │   ├───models.py
│   │   │   ├───routes.py
│   │   │   ├───schemas.py
│   │   │   └───utils.py
│   │   ├───admin/
│   │   │   ├───__init__.py
│   │   │   ├───router.py
│   │   │   └───schemas.py
│   │   ├───core/
│   │   │   ├───__init__.py
│   │   │   ├───config.py
│   │   │   ├───database.py
│   │   │   ├───redis.py
│   │   │   └───security.py
│   │   ├───faculty/
│   │   │   ├───__init__.py
│   │   │   ├───router.py
│   │   │   └───schemas.py
│   │   ├───models/
│   │   │   ├───__init__.py
│   │   │   └───models.py
│   │   ├───scripts/
│   │   │   ├───__init__.py
│   │   │   └───create_test_users.py
│   │   └───student/
│   │       ├───__init__.py
│   │       ├───router.py
│   │       └───schemas.py
│   ├───data/
│   └───tests/
│       ├───__init__.py
│       ├───conftest.py
│       └───test_accounts.py
└───innertia-frontend/
    ├───.env.example
    ├───.gitignore
    ├───.kilocodemodes
    ├───Dockerfile
    ├───eslint.config.js
    ├───index.html
    ├───nginx.conf
    ├───package-lock.json
    ├───package.json
    ├───postcss.config.js
    ├───README.md
    ├───tailwind.config.js
    ├───tsconfig.json
    ├───tsconfig.node.json
    ├───vite.config.js
    ├───node_modules/
    ├───public/
    │   └───vite.svg
    └───src/
        ├───App.css
        ├───App.jsx
        ├───App.tsx
        ├───index.css
        ├───main.jsx
        ├───vite-env.d.ts
        ├───assets/
        │   └───react.svg
        ├───components/
        │   ├───faculty/
        │   │   ├───ClassTable.tsx
        │   │   ├───CreateClassForm.tsx
        │   │   ├───RecentSessions.tsx
        │   │   └───UploadZone.tsx
        │   ├───layout/
        │   │   ├───AdminSidebar.tsx
        │   │   ├───FacultySidebar.tsx
        │   │   ├───Header.tsx
        │   │   ├───MainLayout.tsx
        │   │   ├───RoleBasedLayout.tsx
        │   │   ├───Sidebar.tsx
        │   │   └───StudentSidebar.tsx
        │   ├───ui/
        │   │   ├───Badge.tsx
        │   │   ├───Button.tsx
        │   │   ├───Card.tsx
        │   │   ├───Dialog.tsx
        │   │   ├───ErrorState.tsx
        │   │   ├───Input.tsx
        │   │   ├───PageSkeleton.tsx
        │   │   ├───ProgressBar.tsx
        │   │   ├───Skeleton.tsx
        │   │   ├───StatusBadge.tsx
        │   │   ├───Table.tsx
        │   │   └───Toast.tsx
        │   └───upload/
        │       └───FileList.tsx
        ├───hooks/
        │   ├───useAuth.ts
        │   └───useFacultyData.ts
        ├───pages/
        │   ├───AnalyticsPage.tsx
        │   ├───ClassesPage.tsx
        │   ├───SettingsPage.tsx
        │   ├───UploadPage.tsx
        │   ├───admin/
        │   │   ├───AdminAnalyticsPage.tsx
        │   │   ├───AdminDashboard.tsx
        │   │   ├───AdminSettingsPage.tsx
        │   │   ├───ClassesPage.tsx
        │   │   ├───index.ts
        │   │   ├───SessionsPage.tsx
        │   │   ├───types.ts
        │   │   └───UsersPage.tsx
        │   ├───faculty/
        │   │   ├───FacultyClassesPage.tsx
        │   │   ├───FacultyDashboard.tsx
        │   │   ├───FacultySessionPage.tsx
        │   │   ├───index.ts
        │   │   └───types.ts
        │   ├───Login/
        │   │   ├───index.ts
        │   │   ├───LoginForm.tsx
        │   │   └───LoginPage.tsx
        │   └───student/
        │       ├───index.ts
        │       ├───StudentDashboard.tsx
        │       ├───StudentNotesPage.tsx
        │       ├───StudentSessionPage.tsx
        │       └───types.ts
        ├───services/
        │   ├───api.ts
        │   ├───auth.ts
        │   ├───mockData.ts
        │   └───websocketService.ts
        ├───stores/
        │   ├───facultyStore.ts
        │   └───uploadStore.ts
        ├───types/
        │   └───index.ts
        └───utils/
            └───formatters.ts
```

## Getting Started

To get a local copy up and running, follow these simple steps.

### Prerequisites

- Git
- Python 3.8+
- Node.js & npm
- Docker (optional)

### Backend Setup

1.  Navigate to the backend directory:
    ```sh
    cd innertia-backend
    ```
2.  Create and activate a virtual environment:
    ```sh
    python -m venv venv
    source venv/bin/activate
    ```
3.  Install the required packages:
    ```sh
    pip install -r requirements.txt
    ```
4.  Set up your environment variables by copying the example file:
    ```sh
    cp .env.example .env
    ```
    *Update `.env` with your configuration (e.g., database URL, secret keys).*
5.  Run database migrations:
    ```sh
    alembic upgrade head
    ```
6.  Start the development server:
    ```sh
    uvicorn app.main:app --reload
    ```

### Frontend Setup

1.  Navigate to the frontend directory:
    ```sh
    cd innertia-frontend
    ```
2.  Install NPM packages:
    ```sh
    npm install
    ```
3.  Set up your environment variables by copying the example file:
    ```sh
    cp .env.example .env
    ```
    *Update `.env` with your API endpoint.*
4.  Start the development server:
    ```sh
    npm run dev
    ```