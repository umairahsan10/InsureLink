# Phase 4 API Reference — Notifications, Audit, & Analytics

**Status:** Planned  
**Base URL:** `http://localhost:3001/api/v1`  
**Authentication:** All endpoints require `Bearer <token>`  

---

## 1. Notifications Module

### Get My Notifications
**Endpoint:** `GET /notifications`  
**Query Parameters:**
- `page`: number (default: 1)
- `limit`: number (default: 20)
- `type`: `claim_status` | `policy_update` | `dependent_request` | `messaging_alert` (optional)
- `isRead`: boolean (optional)

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "userId": "uuid",
      "notificationType": "claim_status",
      "title": "Claim Approved",
      "message": "Claim #CLM-2024001 has been approved.",
      "severity": "info",
      "isRead": false,
      "actionUrl": "/claims/uuid",
      "createdAt": "2026-03-24T10:00:00Z"
    }
  ],
  "meta": {
    "total": 5,
    "page": 1,
    "limit": 20,
    "totalPages": 1
  }
}
```

### Get Unread Count
**Endpoint:** `GET /notifications/unread-count`  
**Response:**
```json
{
  "count": 3
}
```

### Mark as Read
**Endpoint:** `PATCH /notifications/:id/read`  
**Response:** `200 OK`

### Mark All as Read
**Endpoint:** `PATCH /notifications/read-all`  
**Response:** `200 OK`

### Delete Notification
**Endpoint:** `DELETE /notifications/:id`  
**Response:** `200 OK`

---

## 2. Audit Module

### Get Audit Logs (Admin Only)
**Endpoint:** `GET /audit/logs`  
**Query Parameters:**
- `page`: number
- `limit`: number
- `entityType`: `Claim` | `Insurer` | `Hospital` | `User` | `Plan`
- `action`: `CREATE` | `UPDATE` | `DELETE`
- `userId`: uuid (filter by who performed the action)
- `startDate`: date string (ISO)
- `endDate`: date string (ISO)

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "entityType": "Claim",
      "entityId": "uuid",
      "action": "UPDATE",
      "changes": {
        "status": { "old": "Pending", "new": "Approved" },
        "approvedAmount": { "old": null, "new": 50000 }
      },
      "actor": { "id": "uuid", "email": "admin@insurelink.com" },
      "timestamp": "2026-03-24T10:00:00Z"
    }
  ],
  "meta": { "total": 50, "page": 1 }
}
```

### Get Entity History
**Endpoint:** `GET /audit/entity/:type/:id`  
**Description:** Get full history of changes for a specific record.  
**Response:** Array of AuditLog entries for that entity.

---

## 3. Analytics Module

### Dashboard Overview
**Endpoint:** `GET /analytics/dashboard`  
**Description:** Returns high-level counters based on user role (Admin/Insurer/Hospital).  
**Response (Admin/Insurer):**
```json
{
  "totalClaims": 150,
  "pendingClaims": 12,
  "approvedClaims": 120,
  "rejectedClaims": 18,
  "totalPayout": 4500000,
  "activeHospitals": 45,
  "activePolicies": 12
}
```

### Financial Analytics
**Endpoint:** `GET /analytics/financial`  
**Response:**
```json
{
  "totalClaimedAmount": 5000000,
  "totalApprovedAmount": 4500000,
  "averageClaimCost": 35000,
  "monthlyPayouts": [
    { "month": "2026-01", "amount": 120000 },
    { "month": "2026-02", "amount": 150000 }
  ]
}
```

### Claims Analytics
**Endpoint:** `GET /analytics/claims`  
**Response:**
```json
{
  "statusBreakdown": { "Pending": 10, "Approved": 80, "Rejected": 10 },
  "dailyTrend": [ ... ],
  "topTreatmentCategories": [
    { "category": "Dental", "count": 40 }
  ]
}
```

### Hospital Performance
**Endpoint:** `GET /analytics/hospitals`  
**Query Parameters:** `city` (optional)  
**Response:**
```json
{
  "topHospitals": [
    { "name": "City Hospital", "claimCount": 50, "approvedAmount": 1200000 }
  ],
  "geographicDistribution": { "Karachi": 30, "Lahore": 20 }
}
```

### Insurer/Plan Analytics
**Endpoint:** `GET /analytics/plans`  
**Response:**
```json
{
  "topPlans": [
    { "name": "Gold Plan", "enrollment": 500, "utilization": "45%" }
  ]
}
```
