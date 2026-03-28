# Dependent Backend-Frontend Integration Test Guide

## Overview

The dependent addition feature has been fully integrated with the backend API. The frontend now makes actual API calls instead of using localStorage.

## What Was Changed

### 1. **Frontend API Layer** (`client/src/lib/api/dependents.ts`)

```typescript
// NEW: Added create method
async create(data: CreateDependentInput): Promise<Dependent> {
  const res = await apiFetch<Dependent>(`${BASE}`, {
    method: "POST",
    body: JSON.stringify(data),
  });
  return res.data;
}
```

### 2. **AddDependentModal Component** (`client/src/components/patient/AddDependentModal.tsx`)

- **Removed**: localStorage operations (`addDependentRequest`, `generateDependentId`)
- **Added**: API call to `dependentsApi.create()`
- **Improvement**: Splits full name into firstName and lastName
- **Error handling**: Proper try-catch with user feedback

## Testing the Integration

### Test Case 1: Add a Valid Dependent

**Prerequisites:**

- Backend running on `http://localhost:3001`
- User logged in as a patient/employee
- Browser DevTools Network tab open

**Steps:**

1. Navigate to Patient Profile page
2. Click "Add Dependent" button
3. Fill in the form:
   - Full Name: "John Smith"
   - Relationship: "Spouse"
   - Date of Birth: "1990-05-15"
   - Gender: "Male"
   - CNIC: "12345-6789012-3"
   - Phone: "03001234567" (optional)
4. Click Next through all steps
5. Review and Submit

**Expected Results:**

- ✅ Network tab shows POST request to `/api/v1/dependents`
- ✅ Request includes: `{employeeId, firstName: "John", lastName: "Smith", relationship, dateOfBirth, gender, cnic}`
- ✅ Response status: 201
- ✅ Modal closes
- ✅ Success alert appears
- ✅ Dependent list reloads
- ✅ New dependent appears with status "Pending" (yellow badge)
- ✅ Console shows no JavaScript errors

### Test Case 2: Validation Errors

**Steps:**

1. Try to submit with empty name
2. Try to submit with spouse under 18 years old
3. Try to submit with invalid CNIC format (not XXX-XXXXXXX-X)

**Expected Results:**

- ✅ Form shows validation errors before submission
- ✅ Next button disabled if current step has errors
- ✅ Errors highlighted in red

### Test Case 3: Network Error Handling

**Steps:**

1. Disconnect backend (stop the server)
2. Try to add a dependent
3. Fill form completely and submit

**Expected Results:**

- ✅ Request fails and shows error alert
- ✅ Modal stays open (user can retry)
- ✅ Console shows error message
- ✅ Form data persists in sessionStorage

### Test Case 4: Successful Reload

**Steps:**

1. Add a dependent successfully
2. Modal closes and dependents list updates
3. Refresh the page manually (F5)

**Expected Results:**

- ✅ Dependent persists in Database
- ✅ Dependent list still shows the newly added dependent
- ✅ Status is still "Pending"

## API Request/Response Examples

### Request

```json
POST /api/v1/dependents
Content-Type: application/json
Authorization: Bearer {accessToken}

{
  "employeeId": "emp_123",
  "firstName": "John",
  "lastName": "Smith",
  "relationship": "Spouse",
  "dateOfBirth": "1990-05-15",
  "gender": "Male",
  "cnic": "12345-6789012-3",
  "phoneNumber": "03001234567"
}
```

### Response (201 Created)

```json
{
  "id": "dep_xyz",
  "employeeId": "emp_123",
  "corporateId": "corp_123",
  "firstName": "John",
  "lastName": "Smith",
  "relationship": "Spouse",
  "dateOfBirth": "1990-05-15",
  "gender": "Male",
  "cnic": "12345-6789012-3",
  "phoneNumber": "03001234567",
  "status": "Pending",
  "requestDate": "2026-03-28T10:30:00Z",
  "createdAt": "2026-03-28T10:30:00Z",
  "updatedAt": "2026-03-28T10:30:00Z"
}
```

## Debugging Tips

### Check Network Request

```javascript
// Open browser DevTools Console and look for POST requests to /api/v1/dependents
// Check request headers for Authorization token
// Check response status code and body
```

### Check Local Storage

```javascript
// In Browser Console:
localStorage.getItem("insurelink_dependents"); // Should return null or empty array
sessionStorage.getItem(`dependent_form_${employeeId}`); // Form backup
```

### Enable Network Logging

```typescript
// In the apiFetch function, requests and responses are logged automatically
// Check console for any fetch errors or validation messages
```

## Troubleshooting

**Problem**: Request fails with 401 Unauthorized

- **Solution**: User token expired. Login again or refresh the page.

**Problem**: Request fails with 400 Bad Request

- **Solution**: Check form validation. Name might not be split correctly, or DTO fields don't match.

**Problem**: Modal doesn't close after successful submission

- **Solution**: Check if `onSuccess` callback is being called. Verify `handleAddDependentSuccess` is wired correctly.

**Problem**: Dependents list doesn't update

- **Solution**: Check if `dependentsApi.list()` is being called in the success callback.

**Problem**: TypeScript errors about missing fields

- **Solution**: Ensure backend response matches the `Dependent` interface in `dependents.ts`.

## Database Verification

After successfully adding a dependent, verify in the database:

```sql
-- Check if dependent was created
SELECT * FROM "Dependent"
WHERE "employeeId" = 'emp_123'
AND "firstName" = 'John';

-- Should return 1 row with status = 'Pending'
```

## Summary Checklist

- ✅ Backend POST endpoint exists at `/api/v1/dependents`
- ✅ Frontend API method `dependentsApi.create()` implemented
- ✅ AddDependentModal calls the API instead of localStorage
- ✅ Form validation prevents invalid submissions
- ✅ Name splitting: "Full Name" → firstName, lastName
- ✅ Error handling and user feedback
- ✅ Dependents list reloads after successful submission
- ✅ No TypeScript compilation errors
- ✅ Environment configured for API communication (localhost:3001)
