# Authorization Module Overview

This document describes the architecture and usage of the authorization layer in the CodeHustle platform. It covers the standalone **Auth Service** and the integrated **Business Backend** that enforces role-based access control (RBAC) using JWT tokens.

## 1. Auth Service (Dedicated)

- **Responsibilities**:
  - User registration, login, logout, password reset
  - JWT access token issuance (RS256) and refresh tokens
  - Role management (assign/remove roles)
  - Exposes JWKS endpoint for token validation
  - `/api/v1/auth/*` endpoints for auth flows
  - `/api/v1/.well-known/jwks.json` serves public keys
  - `/api/v1/me` returns user profile and roles

- **Token payload (`AccessClaims`)**:
  ```json
  {
    "sub": "<user-id>",
    "email": "<user-email>",
    "sid": "<session-id>",
    "roles": ["student","lecturer","admin","exec_worker"],
    "iss": "<issuer>",
    "aud": ["<audience>"],
    "iat": <issued-at>,
    "exp": <expires-at>
  }
  ```

## 2. Business Backend (Integrated)

- **Responsibilities**:
  - Course, assignment/problem, and submission management
  - Delegates all authentication to the Auth Service
  - Enforces RBAC using user roles from JWT
  - Defines service routes under `/api/v1/*`
  - Serves its own Swagger UI at `/swagger/index.html`

- **Middleware**:
  1. **CORS** (`CORSMiddleware`) – sets standard CORS headers
  2. **Auth Proxy** (`AuthMiddleware`) –
     - For each request, extracts the `Authorization: Bearer <token>` header
     - **Proxies** a GET to `http://localhost:8080/api/v1/me`
     - Validates the response and decodes `{id, email, roles}` into a typed context
  3. **RequireRole** (`RequireRole("role1","role2"...)`) –
     - Reads `Roles` from the stored user context
     - Returns HTTP 403 if none of the allowed roles match

- **Protected Endpoints Example**:
  ```go
  // Only student, lecturer or admin can list courses
  api.GET("/courses", RequireRole("student","lecturer","admin"), ListCourses)

  // Only lecturers and admins can list problems
  api.GET("/problems", RequireRole("lecturer","admin"), ListProblems)

  // Students and staff can view their submissions
  api.GET("/submissions", RequireRole("student","lecturer","admin"), ListSubmissions)
  ```

## 3. Role Definitions

| Role         | Description                                             |
|--------------|---------------------------------------------------------|
| **student**  | Can view enrolled courses, see published assignments, submit code, view own submissions |
| **lecturer** | All student permissions + create/manage courses & assignments, view course submissions |
| **admin**    | Full system-wide access (user/role management, all data) |
| **exec_worker** | Machine role for grading service; no direct user-facing API access |

## 4. Workflow

1. **User logs in** via Auth Service → receives JWT + refresh token cookie.
2. **Client** sends `Authorization: Bearer <jwt>` to Business Backend.
3. **AuthMiddleware** proxies to Auth Service `/me` to authenticate and load roles.
4. **RequireRole** enforces route-level RBAC.
5. **Handlers** implement business logic (courses, problems, submissions).

## 5. Testing & Documentation

- **Unit Tests**:
  - Auth service: tests for handlers and token flows
  - Business backend: tests for `CORSMiddleware`, `RequireRole`, and handler stubs

- **Swagger/OpenAPI**:
  - Auth Service: exposed at `http://localhost:8080/swagger/index.html`
  - Business Backend: exposed at `http://localhost:8081/swagger/index.html`
  - Each handler and middleware is annotated for auto-generated documentation

## 6. Next Steps

- Implement detailed **service** and **repository** layers for each domain (courses, problems, submissions).
- Expand **integration tests** across Auth Service and Business Backend using real HTTP requests.
- Harden performance by **caching** JWKS or `/me` responses where appropriate.

---
*This document captures the current authorization design. Modify and extend as the platform evolves.* 