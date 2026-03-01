"""
Tests for college management and admin enforcement.
"""

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_create_college_as_admin(client: AsyncClient):
    """Test creating a college as platform admin."""
    # First, register and login as admin
    admin_data = {
        "email": "admin@example.com",
        "password": "adminpassword123",
        "name": "Admin User",
        "role": "admin"
    }
    await client.post("/api/v1/accounts/register", json=admin_data)
    login_response = await client.post("/api/v1/accounts/login", json={
        "email": "admin@example.com",
        "password": "adminpassword123"
    })
    tokens = login_response.json()
    admin_token = tokens["access_token"]
    
    # Create college
    college_data = {
        "name": "Test College",
        "code": "TEST",
        "domain": "test.edu"
    }
    response = await client.post(
        "/api/v1/platform/admin/colleges",
        json=college_data,
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "Test College"
    assert data["code"] == "TEST"
    assert data["is_active"] == True


@pytest.mark.asyncio
async def test_create_college_duplicate_code(client: AsyncClient):
    """Test creating a college with duplicate code."""
    # First, register and login as admin
    admin_data = {
        "email": "admin@example.com",
        "password": "adminpassword123",
        "name": "Admin User",
        "role": "admin"
    }
    await client.post("/api/v1/accounts/register", json=admin_data)
    login_response = await client.post("/api/v1/accounts/login", json={
        "email": "admin@example.com",
        "password": "adminpassword123"
    })
    tokens = login_response.json()
    admin_token = tokens["access_token"]
    
    # Create first college
    college_data = {
        "name": "Test College",
        "code": "TEST"
    }
    await client.post(
        "/api/v1/platform/admin/colleges",
        json=college_data,
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    
    # Try to create duplicate
    response = await client.post(
        "/api/v1/platform/admin/colleges",
        json=college_data,
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert response.status_code == 409


@pytest.mark.asyncio
async def test_toggle_college_status(client: AsyncClient):
    """Test toggling college active status."""
    # First, register and login as admin
    admin_data = {
        "email": "admin@example.com",
        "password": "adminpassword123",
        "name": "Admin User",
        "role": "admin"
    }
    await client.post("/api/v1/accounts/register", json=admin_data)
    login_response = await client.post("/api/v1/accounts/login", json={
        "email": "admin@example.com",
        "password": "adminpassword123"
    })
    tokens = login_response.json()
    admin_token = tokens["access_token"]
    
    # Create college
    college_data = {
        "name": "Test College",
        "code": "TEST"
    }
    create_response = await client.post(
        "/api/v1/platform/admin/colleges",
        json=college_data,
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    college_id = create_response.json()["id"]
    
    # Deactivate college
    response = await client.patch(
        f"/api/v1/platform/admin/colleges/{college_id}/toggle",
        json={"is_active": False},
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert response.status_code == 200
    assert response.json()["is_active"] == False
    
    # Reactivate college
    response = await client.patch(
        f"/api/v1/platform/admin/colleges/{college_id}/toggle",
        json={"is_active": True},
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert response.status_code == 200
    assert response.json()["is_active"] == True


@pytest.mark.asyncio
async def test_login_blocked_for_inactive_college(client: AsyncClient):
    """Test that users cannot login to inactive college."""
    # First, register and login as admin
    admin_data = {
        "email": "admin@example.com",
        "password": "adminpassword123",
        "name": "Admin User",
        "role": "admin"
    }
    await client.post("/api/v1/accounts/register", json=admin_data)
    login_response = await client.post("/api/v1/accounts/login", json={
        "email": "admin@example.com",
        "password": "adminpassword123"
    })
    tokens = login_response.json()
    admin_token = tokens["access_token"]
    
    # Create college
    college_data = {
        "name": "Test College",
        "code": "TEST"
    }
    create_response = await client.post(
        "/api/v1/platform/admin/colleges",
        json=college_data,
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    college_id = create_response.json()["id"]
    
    # Register a college admin user
    college_admin_data = {
        "email": "collegeadmin@test.edu",
        "password": "password123",
        "name": "College Admin",
        "role": "staff"  # Initially staff, will be promoted
    }
    await client.post("/api/v1/accounts/register", json=college_admin_data)
    
    # Update user to be college admin and assign to college
    user_response = await client.get(
        "/api/v1/platform/admin/users",
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    users = user_response.json()["items"]
    college_admin_user = next((u for u in users if u["email"] == "collegeadmin@test.edu"), None)
    
    # Assign user to college and make them college admin
    await client.patch(
        f"/api/v1/admin/users/{college_admin_user['id']}",
        params={"role": "college_admin", "college_id": college_id},
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    
    # Deactivate college
    await client.patch(
        f"/api/v1/platform/admin/colleges/{college_id}/toggle",
        json={"is_active": False},
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    
    # Try to login as college admin
    login_response = await client.post("/api/v1/accounts/login", json={
        "email": "collegeadmin@test.edu",
        "password": "password123"
    })
    assert login_response.status_code == 403
    assert "inactive" in login_response.json()["detail"].lower()


@pytest.mark.asyncio
async def test_admin_can_remove_last_college_admin(client: AsyncClient):
    """Test that admin can remove the last college admin (admin can do anything)."""
    # First, register and login as admin
    admin_data = {
        "email": "admin@example.com",
        "password": "adminpassword123",
        "name": "Admin User",
        "role": "admin"
    }
    await client.post("/api/v1/accounts/register", json=admin_data)
    login_response = await client.post("/api/v1/accounts/login", json={
        "email": "admin@example.com",
        "password": "adminpassword123"
    })
    tokens = login_response.json()
    admin_token = tokens["access_token"]
    
    # Create college
    college_data = {
        "name": "Test College",
        "code": "TEST"
    }
    create_response = await client.post(
        "/api/v1/platform/admin/colleges",
        json=college_data,
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    college_id = create_response.json()["id"]
    
    # Register a college admin user
    college_admin_data = {
        "email": "collegeadmin@test.edu",
        "password": "password123",
        "name": "College Admin",
        "role": "staff"
    }
    await client.post("/api/v1/accounts/register", json=college_admin_data)
    
    # Get user ID
    user_response = await client.get(
        "/api/v1/platform/admin/users",
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    users = user_response.json()["items"]
    college_admin_user = next((u for u in users if u["email"] == "collegeadmin@test.edu"), None)
    
    # Make user college admin
    await client.patch(
        f"/api/v1/admin/users/{college_admin_user['id']}",
        params={"role": "college_admin", "college_id": college_id},
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    
    # Admin can demote the last college admin (no restriction for admin)
    response = await client.patch(
        f"/api/v1/admin/users/{college_admin_user['id']}",
        params={"role": "staff"},
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert response.status_code == 200


@pytest.mark.asyncio
async def test_can_remove_non_last_college_admin(client: AsyncClient):
    """Test that removing a non-last college admin works."""
    # First, register and login as admin
    admin_data = {
        "email": "admin@example.com",
        "password": "adminpassword123",
        "name": "Admin User",
        "role": "admin"
    }
    await client.post("/api/v1/accounts/register", json=admin_data)
    login_response = await client.post("/api/v1/accounts/login", json={
        "email": "admin@example.com",
        "password": "adminpassword123"
    })
    tokens = login_response.json()
    admin_token = tokens["access_token"]
    
    # Create college
    college_data = {
        "name": "Test College",
        "code": "TEST"
    }
    create_response = await client.post(
        "/api/v1/platform/admin/colleges",
        json=college_data,
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    college_id = create_response.json()["id"]
    
    # Register two college admin users
    admin1_data = {
        "email": "admin1@test.edu",
        "password": "password123",
        "name": "College Admin 1",
        "role": "staff"
    }
    admin2_data = {
        "email": "admin2@test.edu",
        "password": "password123",
        "name": "College Admin 2",
        "role": "staff"
    }
    await client.post("/api/v1/accounts/register", json=admin1_data)
    await client.post("/api/v1/accounts/register", json=admin2_data)
    
    # Get user IDs
    user_response = await client.get(
        "/api/v1/platform/admin/users",
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    users = user_response.json()["items"]
    admin1 = next((u for u in users if u["email"] == "admin1@test.edu"), None)
    admin2 = next((u for u in users if u["email"] == "admin2@test.edu"), None)
    
    # Make both users college admins
    await client.patch(
        f"/api/v1/admin/users/{admin1['id']}",
        params={"role": "college_admin", "college_id": college_id},
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    await client.patch(
        f"/api/v1/admin/users/{admin2['id']}",
        params={"role": "college_admin", "college_id": college_id},
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    
    # Try to demote one admin (should work - there's another admin)
    response = await client.patch(
        f"/api/v1/admin/users/{admin1['id']}",
        params={"role": "staff"},
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert response.status_code == 200


@pytest.mark.asyncio
async def test_prevent_deactivate_college_without_admin(client: AsyncClient):
    """Test that deactivating a college with users but no admin is prevented."""
    # First, register and login as admin
    admin_data = {
        "email": "admin@example.com",
        "password": "adminpassword123",
        "name": "Admin User",
        "role": "admin"
    }
    await client.post("/api/v1/accounts/register", json=admin_data)
    login_response = await client.post("/api/v1/accounts/login", json={
        "email": "admin@example.com",
        "password": "adminpassword123"
    })
    tokens = login_response.json()
    admin_token = tokens["access_token"]
    
    # Create college
    college_data = {
        "name": "Test College",
        "code": "TEST"
    }
    create_response = await client.post(
        "/api/v1/platform/admin/colleges",
        json=college_data,
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    college_id = create_response.json()["id"]
    
    # Register a student user in the college
    student_data = {
        "email": "student@test.edu",
        "password": "password123",
        "name": "Student User",
        "role": "student"
    }
    await client.post("/api/v1/accounts/register", json=student_data)
    
    # Get user ID and assign to college
    user_response = await client.get(
        "/api/v1/platform/admin/users",
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    users = user_response.json()["items"]
    student = next((u for u in users if u["email"] == "student@test.edu"), None)
    
    # Assign student to college
    await client.patch(
        f"/api/v1/admin/users/{student['id']}",
        params={"college_id": college_id},
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    
    # Try to deactivate college (should fail - has users but no admin)
    response = await client.patch(
        f"/api/v1/platform/admin/colleges/{college_id}/toggle",
        json={"is_active": False},
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert response.status_code == 400
    assert "no college admin" in response.json()["detail"].lower()


@pytest.mark.asyncio
async def test_get_current_user_includes_college_status(client: AsyncClient):
    """Test that /accounts/me includes college_is_active."""
    # First, register and login as admin
    admin_data = {
        "email": "admin@example.com",
        "password": "adminpassword123",
        "name": "Admin User",
        "role": "admin"
    }
    await client.post("/api/v1/accounts/register", json=admin_data)
    login_response = await client.post("/api/v1/accounts/login", json={
        "email": "admin@example.com",
        "password": "adminpassword123"
    })
    tokens = login_response.json()
    admin_token = tokens["access_token"]
    
    # Get current user
    response = await client.get(
        "/api/v1/accounts/me",
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert response.status_code == 200
    data = response.json()
    # Platform admin has no college
    assert "college_is_active" in data
    assert data["college_is_active"] is None
