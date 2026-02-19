"""
Script to create a mock "cryptography" class for testing the AI Notes Generator.
This script creates a test class associated with the faculty user.

Usage:
    python -m app.scripts.create_cryptography_class
    Or: python innertia-backend/app/scripts/create_cryptography_class.py
"""

import asyncio
import sys
from pathlib import Path

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from sqlalchemy import select

from app.core.database import AsyncSessionLocal, engine
from app.models.models import User, Class


async def create_cryptography_class() -> None:
    """Create the cryptography class for testing AI Notes Generator."""
    print("=" * 60)
    print("Creating Cryptography Class")
    print("=" * 60)
    
    async with AsyncSessionLocal() as session:
        # Find the faculty user
        result = await session.execute(
            select(User).where(User.role == "faculty").limit(1)
        )
        faculty = result.scalar_one_or_none()
        
        if not faculty:
            print("\n[ERROR] No faculty user found!")
            print("Please run the create_test_users.py script first.")
            return
        
        print(f"\n[INFO] Using faculty: {faculty.name} ({faculty.email})")
        print(f"       Faculty ID: {faculty.id}")
        
        # Check if cryptography class already exists
        result = await session.execute(
            select(Class).where(Class.name == "cryptography")
        )
        existing_class = result.scalar_one_or_none()
        
        if existing_class:
            print(f"\n[INFO] Cryptography class already exists!")
            print(f"       Class ID: {existing_class.id}")
            print(f"       Faculty ID: {existing_class.faculty_id}")
            print(f"       Description: {existing_class.description}")
            return
        
        # Create the cryptography class
        cryptography_class = Class(
            name="cryptography",
            description="An introduction to cryptography covering symmetric and asymmetric encryption, hash functions, digital signatures, and cryptographic protocols. This course explores the mathematical foundations of cryptographic algorithms and their practical applications in securing communications and data.",
            faculty_id=faculty.id,
            is_active=True,
        )
        
        session.add(cryptography_class)
        await session.flush()
        
        print(f"\n[CREATED] Cryptography Class:")
        print(f"          Name: {cryptography_class.name}")
        print(f"          Description: {cryptography_class.description}")
        print(f"          ID: {cryptography_class.id}")
        print(f"          Faculty ID: {cryptography_class.faculty_id}")
        
        await session.commit()
    
    print("\n" + "=" * 60)
    print("Cryptography Class Summary")
    print("=" * 60)
    print("\nThe 'cryptography' class has been created successfully!")
    print("It is now available in the AI Notes Generator dropdown.")
    print("\nTest with faculty credentials:")
    print("  Email: faculty@test.com")
    print("  Password: faculty123")


async def main() -> None:
    """Main entry point."""
    try:
        await create_cryptography_class()
        print("\n[DONE] Cryptography class created successfully!")
    except Exception as e:
        print(f"\n[ERROR] Failed to create cryptography class: {e}")
        raise
    finally:
        await engine.dispose()


if __name__ == "__main__":
    asyncio.run(main())
