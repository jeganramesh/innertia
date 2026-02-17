"""
Tests for authentication endpoints.
"""

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_health_check(client: AsyncClient):
    """Test health check endpoint."""
    response = await client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["service"] == "Innertia Placement Shell"


@pytest.mark.asyncio
async def test_register_user(client: AsyncClient, sample_user_data: dict):
    """Test user registration."""
    response = await client.post("/api/v1/accounts/register", json=sample_user_data)
    assert response.status_code == 201
    data = response.json()
    assert data["email"] == sample_user_data["email"]
    assert data["full_name"] == sample_user_data["full_name"]
    assert data["role"] == sample_user_data["role"]
    assert "id" in data
    assert "password_hash" not in data


@pytest.mark.asyncio
async def test_register_duplicate_email(client: AsyncClient, sample_user_data: dict):
    """Test registration with duplicate email."""
    # Register first user
    await client.post("/api/v1/accounts/register", json=sample_user_data)
    
    # Try to register with same email
    response = await client.post("/api/v1/accounts/register", json=sample_user_data)
    assert response.status_code == 409
    data = response.json()
    assert "already exists" in data["detail"]


@pytest.mark.asyncio
async def test_register_invalid_role(client: AsyncClient):
    """Test registration with invalid role."""
    data = {
        "email": "test@example.com",
        "password": "testpassword123",
        "role": "invalid_role"
    }
    response = await client.post("/api/v1/accounts/register", json=data)
    assert response.status_code == 400
    data = response.json()
    assert "Invalid role" in data["detail"]


@pytest.mark.asyncio
async def test_login_success(client: AsyncClient, sample_user_data: dict, sample_login_data: dict):
    """Test successful login."""
    # Register user first
    await client.post("/api/v1/accounts/register", json=sample_user_data)
    
    # Login
    response = await client.post("/api/v1/accounts/login", json=sample_login_data)
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert "refresh_token" in data
    assert data["token_type"] == "bearer"


@pytest.mark.asyncio
async def test_login_invalid_credentials(client: AsyncClient, sample_user_data: dict, sample_invalid_login_data: dict):
    """Test login with invalid credentials."""
    # Register user first
    await client.post("/api/v1/accounts/register", json=sample_user_data)
    
    # Try login with wrong password
    response = await client.post("/api/v1/accounts/login", json=sample_invalid_login_data)
    assert response.status_code == 401
    data = response.json()
    assert "Invalid email or password" in data["detail"]


@pytest.mark.asyncio
async def test_login_nonexistent_user(client: AsyncClient):
    """Test login with nonexistent user."""
    data = {
        "email": "nonexistent@example.com",
        "password": "testpassword123"
    }
    response = await client.post("/api/v1/accounts/login", json=data)
    assert response.status_code == 401
    data = response.json()
    assert "Invalid email or password" in data["detail"]


@pytest.mark.asyncio
async def test_get_current_user(client: AsyncClient, sample_user_data: dict, sample_login_data: dict):
    """Test getting current user info."""
    # Register and login
    await client.post("/api/v1/accounts/register", json=sample_user_data)
    login_response = await client.post("/api/v1/accounts/login", json=sample_login_data)
    tokens = login_response.json()
    
    # Get current user
    response = await client.get(
        "/api/v1/accounts/me",
        headers={"Authorization": f"Bearer {tokens['access_token']}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == sample_user_data["email"]
    assert data["full_name"] == sample_user_data["full_name"]


@pytest.mark.asyncio
async def test_get_current_user_without_token(client: AsyncClient):
    """Test getting current user without token."""
    response = await client.get("/api/v1/accounts/me")
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_get_current_user_with_invalid_token(client: AsyncClient):
    """Test getting current user with invalid token."""
    response = await client.get(
        "/api/v1/accounts/me",
        headers={"Authorization": "Bearer invalid_token"}
    )
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_refresh_token(client: AsyncClient, sample_user_data: dict, sample_login_data: dict):
    """Test token refresh."""
    # Register and login
    await client.post("/api/v1/accounts/register", json=sample_user_data)
    login_response = await client.post("/api/v1/accounts/login", json=sample_login_data)
    tokens = login_response.json()
    
    # Refresh token
    refresh_data = {"refresh_token": tokens["refresh_token"]}
    response = await client.post("/api/v1/accounts/refresh", json=refresh_data)
    assert response.status_code == 200
    new_tokens = response.json()
    assert "access_token" in new_tokens
    assert "refresh_token" in new_tokens
    assert new_tokens["access_token"] != tokens["access_token"]


@pytest.mark.asyncio
async def test_logout(client: AsyncClient, sample_user_data: dict, sample_login_data: dict):
    """Test logout."""
    # Register and login
    await client.post("/api/v1/accounts/register", json=sample_user_data)
    login_response = await client.post("/api/v1/accounts/login", json=sample_login_data)
    tokens = login_response.json()
    
    # Logout
    response = await client.post(
        "/api/v1/accounts/logout",
        headers={"Authorization": f"Bearer {tokens['access_token']}"}
    )
    assert response.status_code == 204
    
    # Try to access protected endpoint with old token
    response = await client.get(
        "/api/v1/accounts/me",
        headers={"Authorization": f"Bearer {tokens['access_token']}"}
    )
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_validation_error_empty_email(client: AsyncClient):
    """Test validation error for empty email."""
    data = {
        "email": "",
        "password": "testpassword123"
    }
    response = await client.post("/api/v1/accounts/login", json=data)
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_validation_error_invalid_email_format(client: AsyncClient):
    """Test validation error for invalid email format."""
    data = {
        "email": "invalid-email",
        "password": "testpassword123"
    }
    response = await client.post("/api/v1/accounts/login", json=data)
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_validation_error_short_password(client: AsyncClient):
    """Test validation error for short password."""
    data = {
        "email": "test@example.com",
        "password": "short"
    }
    response = await client.post("/api/v1/accounts/register", json=data)
    assert response.status_code == 422
