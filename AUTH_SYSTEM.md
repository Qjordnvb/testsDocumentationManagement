# Authentication & Authorization System

**Version:** 1.0.0
**Last Updated:** 2025-11-22
**Status:** ✅ Backend Complete - Ready for Frontend Integration

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [User Roles & Permissions](#user-roles--permissions)
4. [Setup Instructions](#setup-instructions)
5. [API Endpoints](#api-endpoints)
6. [Usage Examples](#usage-examples)
7. [Security Best Practices](#security-best-practices)
8. [Frontend Integration Guide](#frontend-integration-guide)

---

## Overview

This system implements a complete **role-based authentication and authorization** (RBAC) system for the QA Documentation Automation platform using:

- **JWT (JSON Web Tokens)** for stateless authentication
- **bcrypt** for secure password hashing
- **FastAPI dependency injection** for role-based access control
- **SQLAlchemy ORM** for user data persistence

### Key Features

✅ Secure password hashing with bcrypt
✅ JWT token-based authentication (24-hour expiration)
✅ Role-based access control (RBAC)
✅ Four user roles: ADMIN, QA, DEV, MANAGER
✅ User CRUD operations
✅ Follows existing project architecture patterns
✅ Complete API documentation

---

## Architecture

### Backend Structure

```
backend/
├── api/
│   ├── endpoints/
│   │   ├── auth.py          # Authentication endpoints (login, logout, me)
│   │   └── users.py         # User management CRUD
│   ├── dependencies.py      # Auth utilities (JWT, bcrypt, role checks)
│   └── routes2.py           # Router registration
│
├── database/
│   └── models.py            # UserDB SQLAlchemy model
│
├── models/
│   └── user.py              # Pydantic models (User, DTOs, Role enum)
│
└── config.py                # Settings (SECRET_KEY configuration)

Scripts:
├── add_users_table.py       # Migration: Add users table
├── seed_admin_user.py       # Seed: Create initial admin user
└── setup_auth.sh            # Automated setup script
```

### Design Patterns Applied

Following the user's requirements, this implementation strictly follows these principles:

- **Abstraction:** Generic `require_role()` factory for flexible permission checks
- **Encapsulation:** Auth logic isolated in `dependencies.py`
- **Modularity:** Separate modules for auth endpoints, user management, and utilities
- **Separation of Concerns:** Clear separation between authentication, authorization, and user management
- **DRY:** Reusable `hash_password()`, `verify_password()`, `create_access_token()`, `decode_token()` functions
- **KISS:** Simple JWT implementation, straightforward role checks
- **YAGNI:** Only implemented what's needed for login to work
- **Testability:** All functions are pure, dependency-injected, easily testable

---

## User Roles & Permissions

### Role Hierarchy

```
ADMIN > MANAGER > QA / DEV
```

### Role Definitions

#### 🔴 ADMIN
**Full system access - Super administrator**

**Permissions:**
- ✅ Create, read, update, delete users
- ✅ Manage all projects, user stories, test cases, bugs
- ✅ Access all features and data
- ✅ Change user roles and permissions
- ✅ View system statistics and reports

**Use Cases:**
- System administrators
- Initial setup and configuration
- User account management
- Critical operations

---

#### 🟢 QA (Quality Assurance)
**Main testing workflow user**

**Permissions:**
- ✅ Create and manage projects
- ✅ Upload user stories (Excel/CSV)
- ✅ Generate test cases with AI
- ✅ Execute test cases
- ✅ Create and manage bug reports
- ✅ Generate test plans and reports
- ❌ Cannot manage users
- ❌ Cannot change roles

**Use Cases:**
- QA engineers
- Test case creation and execution
- Bug reporting
- Documentation generation

---

#### 🔵 DEV (Developer)
**Bug verification and fixing**

**Permissions:**
- ✅ View projects and user stories
- ✅ View test cases
- ✅ View and update assigned bugs
- ✅ Mark bugs as fixed
- ❌ Cannot create test cases
- ❌ Cannot create projects
- ❌ Cannot manage users

**Use Cases:**
- Software developers
- Bug fixing and verification
- Viewing test coverage
- Understanding requirements

---

#### 🟡 MANAGER
**Metrics, reports, and oversight**

**Permissions:**
- ✅ View all projects, user stories, test cases, bugs
- ✅ View user list and details
- ✅ Access statistics and metrics
- ✅ Generate reports
- ✅ View test execution history
- ❌ Cannot create or modify data
- ❌ Cannot manage users (create/update/delete)

**Use Cases:**
- Project managers
- Team leads
- Stakeholders
- Reporting and metrics tracking

---

## Setup Instructions

### Option 1: Automated Setup (Recommended)

```bash
# Run the setup script
./setup_auth.sh

# Follow the prompts
# Script will:
# 1. Install dependencies
# 2. Create .env file if needed
# 3. Add users table to database
# 4. Create initial admin user
```

### Option 2: Manual Setup

#### Step 1: Install Dependencies

```bash
pip install -r requirements.txt
```

New dependencies added:
- `bcrypt==4.1.2` - Password hashing
- `PyJWT==2.8.0` - JWT token generation/validation

#### Step 2: Configure Environment

```bash
# Copy .env.example to .env
cp .env.example .env

# Generate a secure SECRET_KEY
python -c "import secrets; print(secrets.token_urlsafe(32))"

# Edit .env and set:
SECRET_KEY=your_generated_secret_key_here
GEMINI_API_KEY=your_gemini_api_key
```

**⚠️ IMPORTANT:** The `SECRET_KEY` is used to sign JWT tokens. Keep it secret!

#### Step 3: Run Database Migration

```bash
# Add users table to existing database
python add_users_table.py
```

This script safely adds the `users` table without affecting existing data.

#### Step 4: Create Initial Admin User

```bash
# Create default admin user
python seed_admin_user.py
```

**Default Admin Credentials:**
- Email: `admin@qa-system.com`
- Password: `admin123`
- Role: `ADMIN`

**🚨 SECURITY WARNING:** Change this password immediately after first login!

#### Step 5: Start the Server

```bash
cd backend
python main.py
```

Server will start at: `http://localhost:8000`

---

## API Endpoints

### Base URL
```
http://localhost:8000/api/v1
```

### Authentication Endpoints

#### `POST /auth/login`
**Login and obtain JWT token**

**Request:**
```json
{
  "email": "admin@qa-system.com",
  "password": "admin123"
}
```

**Response (200 OK):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "user": {
    "id": "USR-001",
    "email": "admin@qa-system.com",
    "full_name": "System Administrator",
    "role": "ADMIN",
    "is_active": true
  }
}
```

**Errors:**
- `401 Unauthorized` - Invalid credentials
- `403 Forbidden` - User is inactive

---

#### `GET /auth/me`
**Get current authenticated user info**

**Headers:**
```
Authorization: Bearer {access_token}
```

**Response (200 OK):**
```json
{
  "id": "USR-001",
  "email": "admin@qa-system.com",
  "full_name": "System Administrator",
  "role": "ADMIN",
  "is_active": true,
  "created_at": "2025-11-22T10:00:00",
  "last_login": "2025-11-22T12:30:00"
}
```

**Errors:**
- `401 Unauthorized` - Invalid or expired token

---

#### `POST /auth/logout`
**User logout**

**Headers:**
```
Authorization: Bearer {access_token}
```

**Response (200 OK):**
```json
{
  "message": "Logout exitoso"
}
```

**Note:** With JWT, logout is primarily client-side (remove token). This endpoint is provided for consistency.

---

### User Management Endpoints

#### `GET /users`
**List all users**

**Required Role:** `ADMIN` or `MANAGER`

**Headers:**
```
Authorization: Bearer {access_token}
```

**Response (200 OK):**
```json
[
  {
    "id": "USR-001",
    "email": "admin@qa-system.com",
    "full_name": "System Administrator",
    "role": "ADMIN",
    "is_active": true,
    "created_at": "2025-11-22T10:00:00",
    "last_login": "2025-11-22T12:30:00"
  },
  {
    "id": "USR-002",
    "email": "qa@example.com",
    "full_name": "QA Engineer",
    "role": "QA",
    "is_active": true,
    "created_at": "2025-11-22T11:00:00",
    "last_login": null
  }
]
```

**Errors:**
- `401 Unauthorized` - Not authenticated
- `403 Forbidden` - Insufficient permissions

---

#### `GET /users/{user_id}`
**Get specific user by ID**

**Required Role:** `ADMIN` or `MANAGER`

**Response:** Same as single user object above

---

#### `POST /users`
**Create new user**

**Required Role:** `ADMIN` only

**Request:**
```json
{
  "email": "qa@example.com",
  "password": "secure_password_123",
  "full_name": "QA Engineer",
  "role": "QA"
}
```

**Response (201 Created):**
```json
{
  "id": "USR-002",
  "email": "qa@example.com",
  "full_name": "QA Engineer",
  "role": "QA",
  "is_active": true,
  "created_at": "2025-11-22T12:00:00",
  "created_by": "USR-001"
}
```

**Errors:**
- `400 Bad Request` - Email already exists
- `403 Forbidden` - Not an ADMIN

---

#### `PUT /users/{user_id}`
**Update user**

**Required Role:** `ADMIN` only

**Request (all fields optional):**
```json
{
  "email": "newemail@example.com",
  "password": "new_password_456",
  "full_name": "Updated Name",
  "role": "MANAGER",
  "is_active": false
}
```

**Response (200 OK):** Updated user object

**Errors:**
- `400 Bad Request` - Email already in use
- `404 Not Found` - User doesn't exist

---

#### `DELETE /users/{user_id}`
**Delete user**

**Required Role:** `ADMIN` only

**Response (200 OK):**
```json
{
  "message": "Usuario USR-002 eliminado exitosamente",
  "deleted_id": "USR-002"
}
```

**Errors:**
- `400 Bad Request` - Cannot delete yourself
- `404 Not Found` - User doesn't exist

---

## Usage Examples

### Example 1: User Login Flow

```python
import requests

# 1. Login
response = requests.post(
    "http://localhost:8000/api/v1/auth/login",
    json={
        "email": "admin@qa-system.com",
        "password": "admin123"
    }
)
data = response.json()
token = data["access_token"]

# 2. Use token for authenticated requests
headers = {"Authorization": f"Bearer {token}"}

# Get current user info
me = requests.get(
    "http://localhost:8000/api/v1/auth/me",
    headers=headers
).json()
print(f"Logged in as: {me['full_name']} ({me['role']})")

# List all users (requires ADMIN or MANAGER role)
users = requests.get(
    "http://localhost:8000/api/v1/users",
    headers=headers
).json()
print(f"Total users: {len(users)}")
```

### Example 2: Create QA User (ADMIN only)

```python
import requests

# Login as admin
login = requests.post(
    "http://localhost:8000/api/v1/auth/login",
    json={"email": "admin@qa-system.com", "password": "admin123"}
).json()
token = login["access_token"]
headers = {"Authorization": f"Bearer {token}"}

# Create QA user
new_user = requests.post(
    "http://localhost:8000/api/v1/users",
    headers=headers,
    json={
        "email": "qa.engineer@company.com",
        "password": "QA_password_2025!",
        "full_name": "Jane Doe",
        "role": "QA"
    }
).json()

print(f"Created user: {new_user['id']} - {new_user['email']}")
```

### Example 3: Change Password

```python
import requests

# Login
login = requests.post(
    "http://localhost:8000/api/v1/auth/login",
    json={"email": "admin@qa-system.com", "password": "admin123"}
).json()
token = login["access_token"]
user_id = login["user"]["id"]
headers = {"Authorization": f"Bearer {token}"}

# Change password
requests.put(
    f"http://localhost:8000/api/v1/users/{user_id}",
    headers=headers,
    json={"password": "new_secure_password_2025!"}
)
print("Password changed successfully")
```

---

## Security Best Practices

### Password Security

✅ **DO:**
- Use bcrypt for password hashing (already implemented)
- Enforce minimum password length (8+ characters recommended)
- Require password changes after first login
- Use strong, unique passwords

❌ **DON'T:**
- Store passwords in plain text
- Reuse passwords across systems
- Share passwords via email/chat
- Use default passwords in production

### JWT Token Security

✅ **DO:**
- Store tokens securely (httpOnly cookies or secure storage)
- Include `Authorization: Bearer {token}` header in requests
- Handle token expiration gracefully (24-hour expiration)
- Clear tokens on logout

❌ **DON'T:**
- Store tokens in localStorage (XSS vulnerable)
- Share tokens between users
- Expose tokens in URLs or logs
- Use the same SECRET_KEY across environments

### SECRET_KEY Security

🔐 **CRITICAL:**
- Generate unique SECRET_KEY per environment
- Never commit SECRET_KEY to version control
- Use environment variables (.env file)
- Rotate SECRET_KEY periodically

**Generate secure SECRET_KEY:**
```bash
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

### Role-Based Access

✅ **Best Practices:**
- Follow principle of least privilege
- Assign only necessary roles to users
- Regularly audit user permissions
- Disable inactive users instead of deleting (audit trail)

---

## Frontend Integration Guide

### Step 1: Create Auth Context

```typescript
// frontend/src/app/providers/AuthContext.tsx

import { createContext, useContext, useState, useEffect } from 'react';

interface User {
  id: string;
  email: string;
  full_name: string;
  role: 'ADMIN' | 'QA' | 'DEV' | 'MANAGER';
  is_active: boolean;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  hasRole: (...roles: string[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    // Load token from secure storage on mount
    const storedToken = sessionStorage.getItem('auth_token');
    const storedUser = sessionStorage.getItem('auth_user');

    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const login = async (email: string, password: string) => {
    const response = await fetch('/api/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      throw new Error('Login failed');
    }

    const data = await response.json();

    setToken(data.access_token);
    setUser(data.user);

    sessionStorage.setItem('auth_token', data.access_token);
    sessionStorage.setItem('auth_user', JSON.stringify(data.user));
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    sessionStorage.removeItem('auth_token');
    sessionStorage.removeItem('auth_user');
  };

  const hasRole = (...roles: string[]) => {
    return user ? roles.includes(user.role) : false;
  };

  return (
    <AuthContext.Provider value={{
      user,
      token,
      login,
      logout,
      isAuthenticated: !!token && !!user,
      hasRole,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
```

### Step 2: Create Login Page

```typescript
// frontend/src/pages/LoginPage/index.tsx

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/app/providers/AuthContext';

export const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      navigate('/'); // Redirect to ProjectsListPage
    } catch (err) {
      setError('Email o contraseña incorrectos');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow">
        <h2 className="text-3xl font-bold text-center">QA System Login</h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>

          {error && (
            <div className="text-red-600 text-sm">{error}</div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  );
};
```

### Step 3: Protected Routes

```typescript
// frontend/src/app/components/ProtectedRoute.tsx

import { Navigate } from 'react-router-dom';
import { useAuth } from '@/app/providers/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRoles?: string[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRoles,
}) => {
  const { isAuthenticated, hasRole } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRoles && !hasRole(...requiredRoles)) {
    return <Navigate to="/forbidden" replace />;
  }

  return <>{children}</>;
};
```

### Step 4: Update API Calls

```typescript
// frontend/src/shared/api/apiClient.ts

import { useAuth } from '@/app/providers/AuthContext';

export const createAuthenticatedClient = () => {
  const { token } = useAuth();

  return {
    get: async (url: string) => {
      const response = await fetch(`/api/v1${url}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error('Request failed');
      return response.json();
    },

    post: async (url: string, data: any) => {
      const response = await fetch(`/api/v1${url}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Request failed');
      return response.json();
    },

    // ... put, delete methods
  };
};
```

### Step 5: Update App Routes

```typescript
// frontend/src/app/App.tsx

import { AuthProvider } from '@/app/providers/AuthContext';
import { ProtectedRoute } from '@/app/components/ProtectedRoute';
import { LoginPage } from '@/pages/LoginPage';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<LoginPage />} />

          {/* Protected routes */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <ProjectsListPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/projects/:projectId/*"
            element={
              <ProtectedRoute requiredRoles={['ADMIN', 'QA', 'MANAGER']}>
                <ProjectRoutes />
              </ProtectedRoute>
            }
          />

          {/* Admin-only routes */}
          <Route
            path="/admin/users"
            element={
              <ProtectedRoute requiredRoles={['ADMIN']}>
                <UsersManagementPage />
              </ProtectedRoute>
            }
          />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
```

---

## Testing the Backend

### Test Authentication

```bash
# 1. Login
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@qa-system.com","password":"admin123"}'

# Response includes access_token - copy it for next requests

# 2. Get current user
curl -X GET http://localhost:8000/api/v1/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

# 3. List users (ADMIN/MANAGER only)
curl -X GET http://localhost:8000/api/v1/users \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Test User Management

```bash
# Create user (ADMIN only)
curl -X POST http://localhost:8000/api/v1/users \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "email":"qa@example.com",
    "password":"qa_password_123",
    "full_name":"QA Engineer",
    "role":"QA"
  }'

# Update user (ADMIN only)
curl -X PUT http://localhost:8000/api/v1/users/USR-002 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{"password":"new_password_456"}'

# Delete user (ADMIN only)
curl -X DELETE http://localhost:8000/api/v1/users/USR-002 \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## Troubleshooting

### Issue: "SECRET_KEY not found"

**Solution:**
```bash
# Generate SECRET_KEY
python -c "import secrets; print(secrets.token_urlsafe(32))"

# Add to .env file
echo "SECRET_KEY=your_generated_key" >> .env
```

### Issue: "bcrypt or PyJWT not found"

**Solution:**
```bash
pip install bcrypt==4.1.2 PyJWT==2.8.0
```

### Issue: "Table users does not exist"

**Solution:**
```bash
python add_users_table.py
```

### Issue: "Admin user already exists"

This is expected if you run `seed_admin_user.py` multiple times. The script prevents duplicate users.

To reset:
```python
# Delete all users (CAREFUL!)
from backend.database.db import SessionLocal
from backend.database.models import UserDB

db = SessionLocal()
db.query(UserDB).delete()
db.commit()

# Then run seed again
python seed_admin_user.py
```

---

## Next Steps

### Backend ✅ COMPLETED
- [x] UserDB model
- [x] Pydantic models (User, DTOs, Role enum)
- [x] Auth dependencies (JWT, bcrypt, role checks)
- [x] Authentication endpoints (/auth/login, /auth/me, /auth/logout)
- [x] User management endpoints (CRUD)
- [x] Database migration script
- [x] Admin user seed script
- [x] Configuration (SECRET_KEY)
- [x] Documentation

### Frontend ⏳ TODO
- [ ] Create AuthContext
- [ ] Create LoginPage
- [ ] Create ProtectedRoute component
- [ ] Update App.tsx with auth routes
- [ ] Update API client to include Authorization header
- [ ] Create UsersManagementPage (for ADMIN)
- [ ] Add role-based UI components
- [ ] Add logout functionality
- [ ] Handle token expiration and refresh

### Future Enhancements 🚀
- [ ] Token refresh mechanism
- [ ] Password reset via email
- [ ] Two-factor authentication (2FA)
- [ ] User activity logging
- [ ] Session management (revoke tokens)
- [ ] OAuth integration (Google, GitHub)
- [ ] Rate limiting on login attempts
- [ ] Account lockout after failed attempts

---

## Support

For questions or issues:
1. Check this documentation
2. Review CLAUDE.md for project architecture
3. Check backend logs for error details
4. Verify .env configuration

---

**Version History:**
- v1.0.0 (2025-11-22): Initial implementation - Backend complete
