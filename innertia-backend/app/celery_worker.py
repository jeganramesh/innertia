"""
Celery worker configuration for background tasks.
"""

from celery import Celery
from app.core.config import settings


# Create Celery app
celery_app = Celery(
    "innertia",
    broker=settings.REDIS_URL,
    backend=settings.REDIS_URL
)

# Celery configuration
celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    task_time_limit=30 * 60,  # 30 minutes
    worker_prefetch_multiplier=1,
    worker_concurrency=4,
)


@celery_app.task(bind=True, ignore_result=True)
def send_verification_email(self, user_id: str, email: str, token: str):
    """
    Send verification email to user.
    
    This is a placeholder task for email verification functionality.
    In production, integrate with an email service like SendGrid, AWS SES, etc.
    
    Args:
        user_id: User's UUID
        email: User's email address
        token: Email verification token
    """
    # Placeholder: In production, implement actual email sending
    print(f"Sending verification email to {email}")
    print(f"Verification token: {token}")
    
    # Example email sending logic:
    # subject = "Verify your Innertia Placement Shell account"
    # body = f"""
    #     Welcome to Innertia Placement Shell!
    #     
    #     Please click the following link to verify your email:
    #     http://localhost:3000/verify-email?token={token}
    # """
    # send_email(email, subject, body)
    
    return True


@celery_app.task(bind=True, ignore_result=True)
def send_password_reset_email(self, user_id: str, email: str, token: str):
    """
    Send password reset email to user.
    
    Args:
        user_id: User's UUID
        email: User's email address
        token: Password reset token
    """
    print(f"Sending password reset email to {email}")
    print(f"Reset token: {token}")
    
    return True


@celery_app.task(bind=True)
def send_welcome_email(self, user_id: str, email: str, full_name: str):
    """
    Send welcome email to new user.
    
    Args:
        user_id: User's UUID
        email: User's email address
        full_name: User's full name
    """
    print(f"Sending welcome email to {email}")
    print(f"Welcome {full_name}!")
    
    return True
