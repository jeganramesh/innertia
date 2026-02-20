"""
Script to create test users for development/testing purposes.
Creates student, faculty, and admin users with predefined credentials.

Usage:
    python -m app.scripts.create_test_users
    Or: python innertia-backend/app/scripts/create_test_users.py
"""

import asyncio
import sys
from pathlib import Path

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import AsyncSessionLocal, engine, Base
from app.models.models import User
from app.accounts.utils import hash_password


# Test user credentials
TEST_USERS = [
    {
        "email": "student@test.com",
        "password": "student123",
        "name": "Test Student",
        "role": "student",
        "is_active": True,
        "is_verified": True,
    },
    {
        "email": "faculty@test.com",
        "password": "faculty123",
        "name": "Test Faculty",
        "role": "faculty",
        "is_active": True,
        "is_verified": True,
    },
    {
        "email": "admin@test.com",
        "password": "admin123",
        "name": "Test Admin",
        "role": "admin",
        "is_active": True,
        "is_verified": True,
    },
    # Additional demo users for frontend mock data
    {
        "email": "admin@innertia.com",
        "password": "admin123",
        "name": "System Admin",
        "role": "admin",
        "is_active": True,
        "is_verified": True,
    },
    {
        "email": "prof.johnson@innertia.com",
        "password": "faculty123",
        "name": "Dr. Sarah Johnson",
        "role": "faculty",
        "is_active": True,
        "is_verified": True,
    },
    {
        "email": "jane.doe@student.innertia.com",
        "password": "student123",
        "name": "Jane Doe",
        "role": "student",
        "is_active": True,
        "is_verified": True,
    },
    {
        "email": "mark.smith@student.innertia.com",
        "password": "student123",
        "name": "Mark Smith",
        "role": "student",
        "is_active": False,
        "is_verified": True,
    },
]


async def create_test_users() -> None:
    """Create test users in the database."""
    print("=" * 60)
    print("Creating Test Users")
    print("=" * 60)
    
    async with AsyncSessionLocal() as session:
        for user_data in TEST_USERS:
            # Check if user already exists
            result = await session.execute(
                select(User).where(User.email == user_data["email"])
            )
            existing_user = result.scalar_one_or_none()
            
            if existing_user:
                print(f"\n[SKIP] User already exists: {user_data['email']}")
                print(f"       Role: {existing_user.role}")
                print(f"       ID: {existing_user.id}")
                continue
            
            # Create new user
            user = User(
                email=user_data["email"],
                password_hash=hash_password(user_data["password"]),
                name=user_data["name"],
                role=user_data["role"],
                is_active=user_data["is_active"],
                is_verified=user_data["is_verified"],
            )
            
            session.add(user)
            await session.flush()  # Flush to get the ID
            
            print(f"\n[CREATED] {user_data['role'].upper()} User:")
            print(f"          Email: {user.email}")
            print(f"          Password: {user_data['password']}")
            print(f"          Name: {user.name}")
            print(f"          ID: {user.id}")
        
        await session.commit()
    
    print("\n" + "=" * 60)
    print("Test Users Summary")
    print("=" * 60)
    print("\nCredentials for testing:")
    print("-" * 40)
    print("| Role    | Email             | Password    |")
    print("-" * 40)
    print("| student | student@test.com  | student123  |")
    print("| faculty | faculty@test.com  | faculty123  |")
    print("| admin   | admin@test.com    | admin123    |")
    print("-" * 40)
    print("\nAll users are active and verified by default.")


async def main() -> None:
    """Main entry point."""
    try:
        await create_test_users()
        print("\n[DONE] Test users created successfully!")
    except Exception as e:
        print(f"\n[ERROR] Failed to create test users: {e}")
        raise
    finally:
        await engine.dispose()


if __name__ == "__main__":
    asyncio.run(main())
