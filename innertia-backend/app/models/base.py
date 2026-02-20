"""
SQLAlchemy Base class for Innertia models.
"""

from sqlalchemy.orm import declarative_base

# Base class for all models - must be imported before any model definitions
Base = declarative_base()
