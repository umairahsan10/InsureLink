# InsureLink Backend API Testing

This folder contains Postman collections for testing the InsureLink backend APIs.

## Files

- `InsureLink-Backend-APIs.postman_collection.json` - Complete API collection for all modules

## Import Instructions

1. Open Postman
2. Click **Import** button (top left)
3. Select the `InsureLink-Backend-APIs.postman_collection.json` file
4. The collection will be imported with all endpoints organized by module

## Collection Structure

The collection includes the following modules:

### 1. **Auth**
- Login endpoint to obtain JWT token

### 2. **Corporates** (6 endpoints)
- Create Corporate (Admin only)
- Get Corporate by ID
- List Corporates (with filters)
- Update Corporate
- Update Corporate Status
- Get Corporate Stats

### 3. **Employees** (8 endpoints)
- Create Employee
- Get Employee by ID
- List Employees (with filters)
- Update Employee
- Delete Employee
- Get Employee Coverage
- Validate Bulk Import
- Commit Bulk Import

### 4. **Dependents** (7 endpoints)
- Create Dependent
- Get Dependent by ID
- List Dependents (with filters)
- Update Dependent
- Approve Dependent (Corporate only)
- Reject Dependent (Corporate only)
- Update Dependent Status

### 5. **Patients** (6 endpoints)
- Get My Patient Profile
- List Patients (Hospital/Insurer only)
- Get Patient by ID
- Get Patient Coverage (eligibility check)
- Get Patient Claims
- Get Patient Visits

## Setup

### 1. Configure Variables

After importing, set the collection variables:

- **base_url**: `http://localhost:3001/api` (or your server URL)
- **access_token**: Leave empty initially (will be set after login)

### 2. Authentication Flow

1. **Login First**: Execute the `Auth > Login` request with valid credentials
2. **Copy Token**: From the response, copy the `accessToken` value
3. **Set Variable**: In Postman, go to the collection variables and paste the token into `access_token`

Alternatively, you can use a test script to auto-set the token:

```javascript
// Add this to the "Tests" tab of the Login request
pm.test("Save token", function () {
    var jsonData = pm.response.json();
    pm.collectionVariables.set("access_token", jsonData.accessToken);
});
```

### 3. Replace Placeholder IDs

Many requests include placeholder values like `<corporate-id>`, `<employee-id>`, etc. Replace these with actual IDs from your database or from previous API responses.

## Example Workflow

### Creating a Complete Corporate Setup

1. **Login as Admin**
   - `POST /auth/login`
   - Save the token

2. **Create Corporate**
   - `POST /corporates`
   - Update `insurerId` with valid insurer ID
   - Save the returned `id`

3. **Create Employee**
   - `POST /employees`
   - Use the corporate ID from step 2
   - Update `planId` with valid plan ID
   - Save the employee `id`

4. **Create Dependent**
   - `POST /dependents`
   - Use the employee ID from step 3
   - Status will be "Pending"

5. **Approve Dependent** *(Login as Corporate first)*
   - `PATCH /dependents/:id/approve`
   - Status changes to "Approved"

6. **Check Patient Coverage**
   - `GET /patients/:id/employee/coverage`
   - Verify eligibility

### Bulk Import Workflow

1. **Validate Bulk Import**
   - `POST /employees/bulk-import/:corporateId/validate`
   - Upload employee data
   - Review validation errors
   - Save the `importToken`

2. **Commit Bulk Import**
   - `POST /employees/bulk-import/:corporateId/commit`
   - Use the token from step 1
   - Choose mode: `skip_invalid`, `all_or_nothing`, or `cancel`

## Role-Based Access Control

Different endpoints require different user roles:

| Role | Access |
|------|--------|
| **admin** | All corporates endpoints, create/update/delete employees |
| **corporate** | Own corporate data, manage employees, approve/reject dependents |
| **insurer** | List corporates (own), list patients, view coverage |
| **hospital** | List patients, view coverage, view visits |
| **patient** | Own employee/dependent records only |

## Testing Tips

1. **Use Environment Variables**: Store frequently used IDs as environment variables
2. **Pre-request Scripts**: Use scripts to generate dynamic data (e.g., unique emails)
3. **Test Scripts**: Validate responses and extract data for subsequent requests
4. **Folders**: Organize requests by workflow (e.g., "Employee Onboarding Flow")

## Common Query Parameters

### Pagination
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20)

### Filters
- **Corporates**: `status`, `city`, `insurerId`, `search`
- **Employees**: `status`, `corporateId`, `search`
- **Dependents**: `status`, `employeeId`
- **Patients**: `corporateId`, `patientType`, `search`

## Response Formats

All responses follow a consistent structure:

### Single Resource
```json
{
  "id": "uuid",
  "field1": "value",
  ...
}
```

### Paginated List
```json
{
  "items": [...],
  "total": 100,
  "page": 1,
  "limit": 20
}
```

### Error Response
```json
{
  "code": "ERROR_CODE",
  "message": "Human-readable error message",
  "statusCode": 400
}
```

## Status Codes

- `200`: Success
- `201`: Created
- `400`: Bad Request (validation failed)
- `401`: Unauthorized (invalid/missing token)
- `403`: Forbidden (insufficient permissions)
- `404`: Not Found
- `500`: Internal Server Error

## Support

For issues or questions, refer to the main project documentation in `/docs`.
