# Authentication Contract

**Version:** 1.0  
**Date:** February 14, 2026  
**Status:** DRAFT (awaiting Dev B approval)

---

## Purpose

This document defines the authentication specification that BOTH Dev A and Dev B must follow. This is **locked** once approved - no changes without discussion.

---

## JWT Token Structure

### Payload Fields

```typescript
interface JwtPayload {
  sub: string;              // User ID (UUID)
  email: string;            // User email
  role: UserRole;           // One of: 'patient' | 'corporate' | 'hospital' | 'insurer'
  organizationId?: string;  // Corporate/Hospital/Insurer ID (only for non-patient)
  iat: number;              // Issued at (Unix timestamp)
  exp: number;              // Expires at (Unix timestamp)
}
```

### Example Token Payload

```json
{
  "sub": "550e8400-e29b-41d4-a716-446655440000",
  "email": "john@acmecorp.com",
  "role": "corporate",
  "organizationId": "660e8400-e29b-41d4-a716-446655440001",
  "iat": 1708041600,
  "exp": 1708128000
}
```

### Token Expiry

- **Access Token:** 15 minutes (900 seconds)
- **Refresh Token:** 7 days (604800 seconds)

---

## Role Enum (LOCKED)

```typescript
enum UserRole {
  patient = 'patient',
  corporate = 'corporate',
  hospital = 'hospital',
  insurer = 'insurer'
}
```

**Rules:**
- All lowercase
- Exactly these 4 values
- Stored in database as string

---

## Guard Usage Patterns

### 1. Public Endpoint (No Auth Required)

```typescript
@Public()
@Post('login')
login(@Body() loginDto: LoginDto) {
  // Anyone can access
}
```

### 2. Authenticated Endpoint (Any Role)

```typescript
@Auth()
@Get('profile')
getProfile(@CurrentUser() user: CurrentUserDto) {
  // Must be logged in, any role
}
```

### 3. Role-Restricted Endpoint

```typescript
@Auth()
@Roles('corporate', 'insurer')
@Post('employees')
createEmployee(@Body() dto: CreateEmployeeDto) {
  // Only corporate and insurer users can access
}
```

---

## API Endpoints

### POST /auth/login

**Request:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "corporate",
      "organizationId": "660e8400-e29b-41d4-a716-446655440001"
    }
  },
  "message": "Login successful"
}
```

**Error (401 Unauthorized):**
```json
{
  "success": false,
  "error": {
    "code": "INVALID_CREDENTIALS",
    "message": "Invalid email or password"
  }
}
```

---

### POST /auth/register

**Request:**
```json
{
  "email": "newuser@example.com",
  "password": "SecurePass123",
  "firstName": "Jane",
  "lastName": "Smith",
  "phone": "03001234567",
  "userRole": "patient",
  "dob": "1990-05-15",
  "gender": "Female"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": "770e8400-e29b-41d4-a716-446655440002",
    "email": "newuser@example.com",
    "firstName": "Jane",
    "lastName": "Smith",
    "role": "patient",
    "createdAt": "2026-02-14T10:30:00Z"
  },
  "message": "User registered successfully"
}
```

---

### POST /auth/refresh-token

**Request:**
```json
{
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

---

### GET /auth/me

**Request Headers:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "phone": "03001234567",
    "role": "corporate",
    "organizationId": "660e8400-e29b-41d4-a716-446655440001",
    "dob": "1985-03-20",
    "gender": "Male",
    "createdAt": "2025-12-01T08:00:00Z",
    "lastLoginAt": "2026-02-14T09:30:00Z"
  }
}
```

---

## HTTP Headers

### Authorization Header Format

```
Authorization: Bearer <access_token>
```

**Example:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c
```

---

## Password Rules

### Hashing
- Algorithm: **bcrypt**
- Salt rounds: **10**
- Never store plain text passwords
- Never return password_hash in API responses

### Validation Rules
- Minimum length: 8 characters
- Must contain at least one uppercase letter
- Must contain at least one lowercase letter
- Must contain at least one number
- Optional: Must contain at least one special character

**Regex:**
```regex
^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$
```

---

## Environment Variables

```env
# JWT Configuration
JWT_SECRET=your-super-secret-key-change-in-production
JWT_ACCESS_TOKEN_EXPIRY=15m
JWT_REFRESH_TOKEN_EXPIRY=7d

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/insurelink
```

---

## Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `INVALID_CREDENTIALS` | 401 | Wrong email or password |
| `USER_NOT_FOUND` | 404 | User does not exist |
| `EMAIL_ALREADY_EXISTS` | 400 | Email is taken |
| `INVALID_TOKEN` | 401 | JWT is invalid or expired |
| `UNAUTHORIZED` | 401 | No token provided |
| `FORBIDDEN` | 403 | Valid token but wrong role |
| `WEAK_PASSWORD` | 400 | Password doesn't meet requirements |

---

## CurrentUser Decorator Injection

All protected endpoints can access current user via decorator:

```typescript
@Get('profile')
@Auth()
getProfile(@CurrentUser() user: CurrentUserDto) {
  // user object automatically injected
  console.log(user.id);    // "550e8400-e29b-41d4-a716-446655440000"
  console.log(user.email); // "user@example.com"
  console.log(user.role);  // "corporate"
}
```

**CurrentUserDto Structure:**
```typescript
interface CurrentUserDto {
  id: string;
  email: string;
  role: UserRole;
  organizationId?: string;
}
```

---

## Implementation Checklist

### Dev A Responsibilities
- [ ] Implement JWT strategy
- [ ] Create JwtAuthGuard
- [ ] Create RolesGuard
- [ ] Create @Auth() decorator
- [ ] Create @Roles() decorator
- [ ] Create @CurrentUser() decorator
- [ ] Create @Public() decorator
- [ ] Implement POST /auth/login
- [ ] Implement POST /auth/register
- [ ] Implement POST /auth/refresh-token
- [ ] Implement GET /auth/me
- [ ] Add password hashing with bcrypt
- [ ] Add password validation
- [ ] Test all endpoints

### Dev B Responsibilities
- [ ] Review and approve this contract
- [ ] Use @Auth() and @Roles() decorators on all endpoints
- [ ] Use @CurrentUser() to get logged-in user
- [ ] Never implement custom auth logic
- [ ] Coordinate on any changes to this contract

---

## Notes

1. **Token Storage (Frontend):**
   - Store access_token in memory or localStorage
   - Send in Authorization header on every request
   - Refresh when expired (401 response)

2. **Security:**
   - JWT_SECRET must be strong in production
   - Use HTTPS in production
   - Rotate JWT_SECRET periodically
   - Implement rate limiting on /auth/login

3. **Testing:**
   - Use Postman/Insomnia to test endpoints
   - Store token in environment variable
   - Test all roles (patient, corporate, hospital, insurer)

---

**Approval Status:**
- [ ] Dev A Approved
- [ ] Dev B Approved
- [ ] Locked for Implementation

**Last Updated:** February 14, 2026
