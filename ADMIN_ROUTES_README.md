# Admin Routes README

This document is for the frontend developer building the `PLATFORM_ADMIN` views.

Base URL:

```text
/api
```

Role required for all admin routes in this file:

```text
PLATFORM_ADMIN
```

## Auth Flow

### 1. Login

Endpoint:

```http
POST /api/auth/login
```

Request body:

```json
{
  "email": "admin@example.com",
  "password": "your-password"
}
```

Success response:

```json
{
  "status": 200,
  "message": "Login successful",
  "data": {
    "accessToken": "jwt-access-token",
    "refreshToken": "jwt-refresh-token"
  }
}
```

### 2. Use protected routes

Send this header on every protected request:

```http
Authorization: Bearer <accessToken>
```

### 3. Refresh token

Endpoint:

```http
POST /api/auth/refresh
```

Request body:

```json
{
  "refreshToken": "jwt-refresh-token"
}
```

Success response:

```json
{
  "status": 200,
  "message": "Token refreshed successfully",
  "data": {
    "accessToken": "new-jwt-access-token",
    "refreshToken": "new-jwt-refresh-token"
  }
}
```

### 4. Update password

Endpoint:

```http
POST /api/auth/update
```

Admin can update self or another user.

Example self update:

```json
{
  "newPassword": "new-password"
}
```

Example update another user:

```json
{
  "userId": "uuid",
  "newPassword": "new-password"
}
```

Success response:

```json
{
  "status": 200,
  "message": "Password updated successfully"
}
```

### 5. Logout

Endpoint:

```http
GET /api/auth/logout
```

Success response:

```json
{
  "status": 200,
  "message": "Logged out successfully"
}
```

## Session Rules

- Protected routes require a valid bearer token.
- The backend expires inactive authenticated sessions after about `20 minutes`.
- Treat `401` as unauthenticated.
- Treat `403` as access denied or suspended account.
- Success payloads are inside `response.data.data`.

## Base Success Response Format

```json
{
  "status": 200,
  "message": "Some message",
  "data": {}
}
```

## 1. Dashboard

### GET `/api/admin/dashboard`

Purpose:

- Returns platform-wide dashboard data
- Can be filtered by selected hospitals
- Can be filtered by named month periods

Query params:

- `months` optional:
  - `this_month`
  - `last_month`
  - `last_two_months`
  - `last_three_months`
  - `last_6_months`
  - `last_12_months`
- `hospitals` optional comma-separated hospital ids

Examples:

```http
GET /api/admin/dashboard
GET /api/admin/dashboard?months=this_month
GET /api/admin/dashboard?months=last_6_months
GET /api/admin/dashboard?hospitals=hospital-uuid-1,hospital-uuid-2
GET /api/admin/dashboard?months=last_12_months&hospitals=hospital-uuid-1,hospital-uuid-2
```

Expected response:

```json
{
  "status": 200,
  "message": "Admin dashboard data retrieved successfully",
  "data": {
    "filters": {
      "months": 6,
      "period": "last_6_months",
      "hospitals": ["hospital-uuid-1", "hospital-uuid-2"],
      "hospital_scope": "selected"
    },
    "summary": {
      "total_hospitals": 2,
      "active_hospitals": 2,
      "total_platform_revenue": 1250000,
      "total_agents_across_hospitals": 48,
      "total_transactions_made_by_agents": 320
    },
    "revenueTrend": [
      {
        "month_key": "2026-04",
        "month_label": "Apr 2026",
        "revenue": 180000,
        "transaction_count": 42
      }
    ],
    "transactionCountByPaymentMethod": [
      {
        "payment_type": "cash",
        "transaction_count": 150,
        "revenue": 540000
      }
    ],
    "hospitalsByRevenueGenerated": [
      {
        "hospital_id": "uuid",
        "hospital_name": "General Hospital",
        "revenue": 320000,
        "transaction_count": 75
      }
    ],
    "highestPerformingHospitals": [
      {
        "hospital_id": "uuid",
        "hospital_name": "General Hospital",
        "revenue": 320000,
        "transaction_count": 75,
        "agent_count": 8,
        "status": "active"
      }
    ]
  }
}
```

Frontend notes:

- Default is all hospitals when `hospitals` is not sent.
- Use `filters.period` and `filters.hospital_scope` to show active selections on the UI.

## 2. System Logs

### GET `/api/admin/system-logs`

Purpose:

- Returns auth and system-level logs
- Supports filtering by date, hospital, and role

Query params:

- `start_date` optional `YYYY-MM-DD`
- `end_date` optional `YYYY-MM-DD`
- `hospital_id` optional
- `role` optional: `PLATFORM_ADMIN` | `FO` | `AGENT`
- `page` optional
- `limit` optional

Example:

```http
GET /api/admin/system-logs
GET /api/admin/system-logs?hospital_id=hospital-uuid
GET /api/admin/system-logs?role=FO
GET /api/admin/system-logs?start_date=2026-04-01&end_date=2026-04-24&hospital_id=hospital-uuid&role=AGENT
```

Expected response:

```json
{
  "status": 200,
  "message": "System logs retrieved successfully",
  "data": {
    "filters": {
      "start_date": "2026-04-01",
      "end_date": "2026-04-24",
      "hospital_id": "hospital-uuid",
      "role": "AGENT",
      "page": 1,
      "limit": 20
    },
    "pagination": {
      "current_page": 1,
      "total_pages": 2,
      "total_logs": 24,
      "has_next": true,
      "has_previous": false,
      "logs_per_page": 20
    },
    "logs": [
      {
        "log_id": "uuid",
        "hospital": {
          "hospital_id": "hospital-uuid",
          "hospital_name": "General Hospital"
        },
        "username": "John Doe",
        "email": "john@example.com",
        "role": "AGENT",
        "event": "auth.login",
        "status": "failed",
        "failed_reason": "invalid_password",
        "user": {
          "user_id": "uuid",
          "name": "John Doe",
          "email": "john@example.com",
          "role": "AGENT"
        },
        "metadata": {
          "reason": "invalid_password",
          "hospital_id": "hospital-uuid"
        },
        "created_at": "2026-04-24T10:30:00.000Z"
      }
    ]
  }
}
```

Frontend notes:

- Put hospital first in table display, then username, email, role, event, status.
- Show `failed_reason` only when `status` is `failed`.
- Default filter is all hospitals and all roles.

## 3. Hospitals

### GET `/api/admin/hospitals`

Query params:

- `search`
- `hospital_name`
- `hospital_code`
- `hospital_status`: `active` | `suspended`
- `sort`: `newest` | `oldest`

Expected response:

```json
{
  "status": 200,
  "message": "Hospitals retrieved successfully",
  "data": {
    "summary": {
      "total_hospitals": 12,
      "suspended_hospitals": 2,
      "total_platform_revenue": 8400000
    },
    "filters": {
      "search": null,
      "hospital_name": null,
      "hospital_code": null,
      "hospital_status": null,
      "sort": "newest"
    },
    "hospitals": [
      {
        "hospital_id": "uuid",
        "hospital_name": "General Hospital",
        "hospital_code": "GH-001",
        "revenue_type": "automatic",
        "hospital_email": "info@general.com",
        "phone": "08012345678",
        "agents": 10,
        "fos": 2,
        "transaction_count": 320,
        "total_revenue": 2500000,
        "status": "active"
      }
    ]
  }
}
```

### GET `/api/admin/reports/options`

Purpose:

- Returns hospital dropdown options
- Returns supported report types for the second dropdown

Expected response:

```json
{
  "status": 200,
  "message": "Admin report options retrieved successfully",
  "data": {
    "hospitals": [
      {
        "hospital_id": "uuid",
        "hospital_name": "General Hospital",
        "hospital_code": "GH-001",
        "revenue_type": "automatic",
        "status": "active"
      }
    ],
    "report_types": [
      {
        "key": "revenue",
        "label": "Revenue Report",
        "endpoint": "/api/admin/hospitals/:id/reports"
      },
      {
        "key": "patient",
        "label": "Patient Report",
        "endpoint": "/api/admin/hospitals/:id/report/patient"
      },
      {
        "key": "department",
        "label": "Department Report",
        "endpoint": "/api/admin/hospitals/:id/report/department"
      },
      {
        "key": "agent",
        "label": "Agent Report",
        "endpoint": "/api/admin/hospitals/:id/report/agent"
      }
    ]
  }
}
```

### POST `/api/admin/hospitals`

Body:

```json
{
  "name": "General Hospital",
  "logo_url": "https://example.com/logo.png",
  "address": "123 Hospital Road",
  "contact_email": "info@example.com",
  "contact_phone": "08012345678",
  "revenue_type": "automatic"
}
```

Expected response:

```json
{
  "status": 201,
  "message": "Hospital created successfully",
  "data": {
    "id": "uuid",
    "name": "General Hospital",
    "hospital_code": "GH-001",
    "logo_url": "https://example.com/logo.png",
    "address": "123 Hospital Road",
    "contact_email": "info@example.com",
    "contact_phone": "08012345678",
    "revenue_type": "automatic",
    "is_active": true
  }
}
```

### PUT `/api/admin/hospitals/:id`

Body accepts any of:

```json
{
  "name": "Updated Hospital Name",
  "logo_url": "https://example.com/new-logo.png",
  "address": "New Address",
  "contact_email": "new@example.com",
  "contact_phone": "08099999999",
  "status": "active",
  "revenue_type": "manual"
}
```

Expected response:

```json
{
  "status": 200,
  "message": "Hospital updated successfully",
  "data": {
    "id": "uuid",
    "name": "Updated Hospital Name",
    "hospital_code": "GH-001",
    "revenue_type": "manual",
    "is_active": true
  }
}
```

### GET `/api/admin/hospitals/:id/overview`

Expected response:

```json
{
  "status": 200,
  "message": "Hospital overview retrieved successfully",
  "data": {
    "hospital": {
      "hospital_id": "uuid",
      "hospital_name": "General Hospital",
      "hospital_code": "GH-001",
      "revenue_type": "automatic",
      "hospital_email": "info@general.com",
      "hospital_phone": "08012345678",
      "address": "123 Hospital Road",
      "status": "active"
    },
    "overview": {
      "total_revenue": 2500000,
      "total_transactions": 320,
      "total_agents": 10,
      "total_departments": 6,
      "pending_receipt_reprint": 3
    },
    "revenue_trend": [
      {
        "date": "2026-04-24",
        "revenue": 45000
      }
    ]
  }
}
```

## 4. Hospital Transactions

### GET `/api/admin/hospitals/:id/transactions`

Purpose:

- Returns a hospital transactions table
- Supports FO-like filtering
- Supports CSV export

Query params:

- `start_date`
- `end_date`
- `payment_method`: `cash` | `transfer` | `pos`
- `patient_id`
- `department`
- `agent`
- `search`
- `page`
- `limit`
- `export=csv`

Example:

```http
GET /api/admin/hospitals/:id/transactions
GET /api/admin/hospitals/:id/transactions?patient_id=10234
GET /api/admin/hospitals/:id/transactions?payment_method=cash&department=Laboratory
GET /api/admin/hospitals/:id/transactions?export=csv
```

Expected JSON response:

```json
{
  "status": 200,
  "message": "Hospital transactions retrieved successfully",
  "data": {
    "hospital_id": "uuid",
    "filters": {
      "start_date": "2026-04-01",
      "end_date": "2026-04-24",
      "payment_method": "cash",
      "patient_id": "10234",
      "department": "Laboratory",
      "agent": "John Doe",
      "search": "RCPT-00",
      "page": 1,
      "limit": 15,
      "export": null
    },
    "summary": {
      "total_revenue": 185000,
      "transaction_count": 2
    },
    "pagination": {
      "current_page": 1,
      "total_pages": 1,
      "total_transactions": 2,
      "has_next": false,
      "has_previous": false,
      "transactions_per_page": 15
    },
    "transactions": [
      {
        "transaction_id": "uuid",
        "date_time": "2026-04-24T10:15:22.000Z",
        "receipt_id": "RCPT-000245",
        "patient_id": "10234",
        "patient_name": "Amina Yusuf",
        "department": "Laboratory",
        "income_head": "Test Fee",
        "bill_name": "Malaria Test",
        "payment_method": "cash",
        "amount": 25000,
        "agent": "John Doe"
      }
    ]
  }
}
```

Frontend notes:

- Use `pagination.has_next` and `pagination.has_previous` for the next and previous buttons.
- When `export=csv`, response is a file, not JSON.

## 5. Admin Reports Per Hospital

### GET `/api/admin/hospitals/:id/reports`

Revenue report for a selected hospital.

Query params:

- `start_date`
- `end_date`
- `departments`
- `income_heads`
- `agents`
- `payment_method`
- `page`
- `limit`
- `export=csv`
- `print=true`

Expected response shape:

```json
{
  "status": 200,
  "message": "Hospital revenue report retrieved successfully",
  "data": {
    "hospital_id": "uuid",
    "filters": {
      "start_date": "2026-04-01",
      "end_date": "2026-04-24",
      "departments": ["dep-uuid"],
      "income_heads": ["income-head-uuid"],
      "agents": ["agent-uuid"],
      "payment_method": "cash",
      "page": 1,
      "limit": 15,
      "export": null
    },
    "pagination": {
      "current_page": 1,
      "total_pages": 2,
      "total_transactions": 20,
      "has_next": true,
      "has_previous": false,
      "transactions_per_page": 15
    },
    "transactions": [
      {
        "transaction_id": "uuid",
        "date_time": "2026-04-24T10:15:22.000Z",
        "receipt_id": "RCPT-000245",
        "patient_id": "10234",
        "patient_name": "Amina Yusuf",
        "department": "Laboratory",
        "income_head": "Test Fee",
        "bill_name": "Malaria Test",
        "payment_method": "cash",
        "amount": 25000,
        "agent": "John Doe"
      }
    ]
  }
}
```

### GET `/api/admin/hospitals/:id/report/patient`

Query params:

- `patient_id`
- `start_date`
- `end_date`
- `export=csv`
- `print=true`

Expected response shape:

```json
{
  "status": 200,
  "message": "Hospital patient report retrieved successfully",
  "data": {
    "hospital_id": "uuid",
    "hospital_name": "General Hospital",
    "hospital_code": "GH-001",
    "filters": {
      "patient_id": "10234",
      "start_date": "2026-04-01",
      "end_date": "2026-04-24",
      "show_all": false
    },
    "summary": {
      "transaction_count": 2,
      "total_bill_amount": 185000
    },
    "report": [
      {
        "patient_id": "10234",
        "patient_name": "Amina Yusuf",
        "department": "Laboratory",
        "income_head": "Test Fee",
        "bill_name": "Malaria Test",
        "amount": 25000,
        "agent_name": "John Doe",
        "date_time": "2026-04-24T10:15:22.000Z"
      }
    ]
  }
}
```

### GET `/api/admin/hospitals/:id/report/department`

Query params:

- `department`
- `start_date`
- `end_date`
- `export=csv`
- `print=true`

Behavior:

- If `department` is not sent, response returns a grouped `report` array for all departments.
- If `department` is sent, response returns `summary` plus `transactions` for that department.

Expected all-departments shape:

```json
{
  "status": 200,
  "message": "Hospital department report retrieved successfully",
  "data": {
    "hospital_id": "uuid",
    "hospital_name": "General Hospital",
    "hospital_code": "GH-001",
    "filters": {
      "department": null,
      "start_date": null,
      "end_date": null,
      "show_all": true
    },
    "summary": {
      "total_count": 120,
      "total_amount": 920000,
      "departments_count": 6
    },
    "report": [
      {
        "department": "Laboratory",
        "count": 48,
        "amount": 360000
      }
    ]
  }
}
```

Expected single-department shape:

```json
{
  "status": 200,
  "message": "Hospital department report retrieved successfully",
  "data": {
    "hospital_id": "uuid",
    "hospital_name": "General Hospital",
    "hospital_code": "GH-001",
    "filters": {
      "department": "Laboratory",
      "start_date": "2026-04-01",
      "end_date": "2026-04-24",
      "show_all": false
    },
    "summary": {
      "department": "Laboratory",
      "count": 48,
      "amount": 360000
    },
    "transactions": [
      {
        "transaction_id": "uuid",
        "date_time": "2026-04-24T10:15:22.000Z",
        "receipt_id": "RCPT-000245",
        "patient_id": "10234",
        "patient_name": "Amina Yusuf",
        "department": "Laboratory",
        "income_head": "Test Fee",
        "bill_name": "Malaria Test",
        "payment_method": "cash",
        "amount": 25000,
        "agent": "John Doe"
      }
    ]
  }
}
```

### GET `/api/admin/hospitals/:id/report/agent`

Query params:

- `agent_id`
- `start_date`
- `end_date`
- `export=csv`
- `print=true`

Behavior:

- If `agent_id` is not sent, response returns grouped `report` for all agents.
- If `agent_id` is sent, response returns a selected-agent `summary` and `transactions`.

Expected all-agents shape:

```json
{
  "status": 200,
  "message": "Hospital agent report retrieved successfully",
  "data": {
    "hospital_id": "uuid",
    "hospital_name": "General Hospital",
    "hospital_code": "GH-001",
    "filters": {
      "agent_id": null,
      "start_date": null,
      "end_date": null,
      "show_all": true
    },
    "summary": {
      "total_count": 120,
      "total_amount": 920000,
      "agents_count": 10
    },
    "report": [
      {
        "agent_id": "agent-uuid",
        "agent": "John Doe",
        "count": 14,
        "amount": 130000
      }
    ]
  }
}
```

Expected single-agent shape:

```json
{
  "status": 200,
  "message": "Hospital agent report retrieved successfully",
  "data": {
    "hospital_id": "uuid",
    "hospital_name": "General Hospital",
    "hospital_code": "GH-001",
    "filters": {
      "agent_id": "agent-uuid",
      "start_date": "2026-04-01",
      "end_date": "2026-04-24",
      "show_all": false
    },
    "summary": {
      "agent_id": "agent-uuid",
      "agent": "John Doe",
      "count": 14,
      "amount": 130000
    },
    "transactions": [
      {
        "transaction_id": "uuid",
        "date_time": "2026-04-24T10:15:22.000Z",
        "receipt_id": "RCPT-000245",
        "patient_id": "10234",
        "patient_name": "Amina Yusuf",
        "department": "Laboratory",
        "income_head": "Test Fee",
        "bill_name": "Malaria Test",
        "payment_method": "cash",
        "amount": 25000,
        "agent": "John Doe"
      }
    ]
  }
}
```

Recommended frontend flow:

1. Call `GET /api/admin/reports/options`
2. Let admin choose hospital
3. Let admin choose report type
4. Call the matching report endpoint for the selected hospital

## 6. Hospital Activity Logs

### GET `/api/admin/hospitals/:id/activity-logs`

Query params:

- `start_date`
- `end_date`
- `page`
- `limit`

Expected response shape:

```json
{
  "status": 200,
  "message": "Hospital activity logs retrieved successfully",
  "data": {
    "filters": {
      "start_date": "2026-04-01",
      "end_date": "2026-04-24",
      "page": 1,
      "limit": 20
    },
    "pagination": {
      "current_page": 1,
      "total_pages": 1,
      "total_logs": 3,
      "has_next": false,
      "has_previous": false,
      "logs_per_page": 20
    },
    "logs": [
      {
        "log_id": "uuid",
        "action": "department.created",
        "actor_role": "PLATFORM_ADMIN",
        "target_type": "department",
        "target_label": "Laboratory",
        "metadata": {
          "status": "active"
        },
        "created_at": "2026-04-24T11:10:00.000Z"
      }
    ]
  }
}
```

## 7. Receipt Reprint Requests

### GET `/api/admin/hospitals/:id/receipts`

Query params:

- `status`: `all` | `pending` | `approved` | `rejected`

Expected response:

```json
{
  "status": 200,
  "message": "Hospital receipt requests retrieved successfully",
  "data": {
    "summary": {
      "total_receipt_count": 10,
      "pending_request": 2,
      "approved": 5,
      "rejected": 3
    },
    "filter": "all",
    "receipts": [
      {
        "request_id": "uuid",
        "transaction_id": "uuid",
        "receipt_no": "RCPT-000245",
        "patient_name": "Amina Yusuf",
        "reason": "Patient misplaced receipt",
        "amount": 25000,
        "requested_at": "2026-04-24T09:00:00.000Z",
        "action_at": "2026-04-24T09:15:00.000Z",
        "agent_name": "John Doe",
        "agent_email": "john@example.com",
        "status": "approved",
        "action_by": {
          "user_id": "uuid",
          "name": "Admin User",
          "email": "admin@example.com",
          "role": "PLATFORM_ADMIN"
        },
        "approved_by": {
          "user_id": "uuid",
          "name": "Admin User",
          "email": "admin@example.com",
          "role": "PLATFORM_ADMIN"
        },
        "rejected_by": null
      }
    ]
  }
}
```

### POST `/api/admin/hospitals/:id/receipts/approve`

Body:

```json
{
  "request_id": "uuid"
}
```

Expected response:

```json
{
  "status": 200,
  "message": "Receipt reprint approved successfully",
  "data": {
    "id": "uuid",
    "transaction_id": "uuid",
    "agent_id": "uuid",
    "status": "approved",
    "approved_at": "2026-04-24T09:15:00.000Z"
  }
}
```

### POST `/api/admin/hospitals/:id/receipts/reject`

Body:

```json
{
  "request_id": "uuid"
}
```

Expected response is the same shape as approve, but with `status: "rejected"`.

## 8. Hospital Agents

### GET `/api/admin/hospitals/:id/agents`

Query params:

- `search`

Expected response:

```json
{
  "status": 200,
  "message": "Hospital agents retrieved successfully",
  "data": {
    "hospital_id": "uuid",
    "filters": {
      "search": null
    },
    "total_agents": 10,
    "agent_name_list": [
      {
        "agent_id": "uuid",
        "agent_name": "John Doe"
      }
    ],
    "agents": [
      {
        "agent_id": "uuid",
        "agent_name": "John Doe",
        "email": "john@example.com",
        "balance": 15000,
        "total_revenue_made": 320000,
        "status": "active"
      }
    ]
  }
}
```

### POST `/api/admin/hospitals/:id/agents`

Body:

```json
{
  "first_name": "John",
  "last_name": "Doe",
  "email": "john@example.com",
  "phone": "08012345678",
  "password": "password123"
}
```

Expected response:

```json
{
  "status": 201,
  "message": "Agent created successfully",
  "data": {
    "id": "uuid",
    "first_name": "John",
    "last_name": "Doe",
    "email": "john@example.com",
    "phone": "08012345678",
    "role": "AGENT",
    "hospital_id": "uuid"
  }
}
```

### PATCH `/api/admin/hospitals/:id/agents/:agentId`

Body accepts any of:

```json
{
  "first_name": "John",
  "last_name": "Doe",
  "email": "john@example.com",
  "phone": "08012345678",
  "status": "active",
  "password": "newPassword123"
}
```

Expected response:

```json
{
  "status": 200,
  "message": "Agent updated successfully",
  "data": {
    "agent_id": "uuid",
    "first_name": "John",
    "last_name": "Doe",
    "agent_name": "John Doe",
    "email": "john@example.com",
    "phone": "08012345678",
    "hospital_id": "uuid",
    "status": "active",
    "updated_at": "2026-04-24T12:00:00.000Z"
  }
}
```

## 9. Hospital FOs

### GET `/api/admin/hospitals/:id/fos`

Query params:

- `search`

Expected response:

```json
{
  "status": 200,
  "message": "Hospital FOs retrieved successfully",
  "data": {
    "hospital_id": "uuid",
    "filters": {
      "search": null
    },
    "total_fos": 2,
    "fo_name_list": [
      {
        "fo_id": "uuid",
        "fo_name": "Jane Doe"
      }
    ],
    "fos": [
      {
        "fo_id": "uuid",
        "fo_name": "Jane Doe",
        "email": "jane@example.com",
        "phone": "08012345679",
        "status": "active"
      }
    ]
  }
}
```

### POST `/api/admin/hospitals/:id/fos`

Body is the same shape as agent create, but role becomes `FO`.

Expected response message:

```json
{
  "status": 201,
  "message": "FO created successfully"
}
```

### PATCH `/api/admin/hospitals/:id/fos/:foId`

Body is the same style as agent update.

Expected response shape:

```json
{
  "status": 200,
  "message": "FO updated successfully",
  "data": {
    "fo_id": "uuid",
    "first_name": "Jane",
    "last_name": "Doe",
    "fo_name": "Jane Doe",
    "email": "jane@example.com",
    "phone": "08012345679",
    "hospital_id": "uuid",
    "status": "active",
    "updated_at": "2026-04-24T12:00:00.000Z"
  }
}
```

## 10. Departments

### POST `/api/admin/hospitals/:id/departments`

Body:

```json
{
  "name": "Laboratory"
}
```

Expected response:

```json
{
  "status": 201,
  "message": "Hospital department created successfully",
  "data": {
    "id": "uuid",
    "hospital_id": "uuid",
    "name": "Laboratory",
    "is_active": true,
    "is_deleted": false
  }
}
```

### GET `/api/admin/hospitals/:id/departments`

Query params:

- `search`

Expected response:

```json
{
  "status": 200,
  "message": "Hospital departments retrieved successfully",
  "data": {
    "hospital_id": "uuid",
    "filters": {
      "search": null
    },
    "total_departments": 6,
    "departments": [
      {
        "department_id": "uuid",
        "name": "Laboratory",
        "is_active": true,
        "is_deleted": false,
        "created_at": "2026-04-24T08:00:00.000Z",
        "updated_at": "2026-04-24T08:00:00.000Z",
        "income_heads": [],
        "bill_items": []
      }
    ]
  }
}
```

### PATCH `/api/admin/hospitals/:id/departments/:departmentId`

Expected response:

```json
{
  "status": 200,
  "message": "Hospital department updated successfully",
  "data": {
    "id": "uuid",
    "hospital_id": "uuid",
    "name": "Updated Department Name",
    "is_active": true,
    "is_deleted": false
  }
}
```

### DELETE `/api/admin/hospitals/:id/departments/:departmentId`

Expected response:

```json
{
  "status": 200,
  "message": "Hospital department deleted successfully",
  "data": {
    "id": "uuid",
    "hospital_id": "uuid",
    "name": "Laboratory",
    "is_active": false,
    "is_deleted": true
  }
}
```

## 11. Income Heads

### POST `/api/admin/hospitals/:id/income-heads`

Body:

```json
{
  "department_id": "uuid",
  "name": "Consultation"
}
```

Expected response:

```json
{
  "status": 201,
  "message": "Hospital income head created successfully",
  "data": {
    "id": "uuid",
    "hospital_id": "uuid",
    "department_id": "uuid",
    "name": "Consultation",
    "is_active": true,
    "is_deleted": false
  }
}
```

### GET `/api/admin/hospitals/:id/income-heads`

Query params:

- `department_id`
- `search`

Expected response:

```json
{
  "status": 200,
  "message": "Hospital income heads retrieved successfully",
  "data": {
    "hospital_id": "uuid",
    "filters": {
      "department_id": null,
      "search": null,
      "include_inactive": true
    },
    "total_income_heads": 8,
    "income_heads": [
      {
        "income_head_id": "uuid",
        "hospital_id": "uuid",
        "department_id": "uuid",
        "department_name": "Laboratory",
        "name": "Test Fee",
        "is_active": true,
        "is_deleted": false,
        "created_at": "2026-04-24T08:30:00.000Z",
        "updated_at": "2026-04-24T08:30:00.000Z"
      }
    ]
  }
}
```

### PATCH `/api/admin/hospitals/:id/income-heads/:incomeHeadId`

Body:

```json
{
  "name": "Updated Name",
  "status": "active"
}
```

Expected response:

```json
{
  "status": 200,
  "message": "Hospital income head updated successfully",
  "data": {
    "id": "uuid",
    "hospital_id": "uuid",
    "department_id": "uuid",
    "name": "Updated Name",
    "is_active": true
  }
}
```

## 12. Bill Items

### POST `/api/admin/hospitals/:id/bill-items`

Body:

```json
{
  "department_id": "uuid",
  "income_head_id": "uuid",
  "name": "X-Ray",
  "amount": 5000
}
```

Expected response:

```json
{
  "status": 201,
  "message": "Hospital bill item created successfully",
  "data": {
    "id": "uuid",
    "hospital_id": "uuid",
    "department_id": "uuid",
    "income_head_id": "uuid",
    "name": "X-Ray",
    "amount": 5000,
    "is_active": true
  }
}
```

### GET `/api/admin/hospitals/:id/bill-items`

Query params:

- `department_id`
- `income_head_id`
- `search` or `bill_name`
- `page`
- `limit`

Expected response:

```json
{
  "status": 200,
  "message": "Hospital bill items retrieved successfully",
  "data": {
    "hospital_id": "uuid",
    "filters": {
      "department_id": null,
      "income_head_id": null,
      "search": null,
      "include_inactive": true
    },
    "pagination": {
      "page": 1,
      "limit": 30,
      "total_bill_items": 42,
      "total_pages": 2,
      "has_previous_page": false,
      "has_next_page": true,
      "previous_page": null,
      "next_page": 2
    },
    "bill_items": [
      {
        "bill_item_id": "uuid",
        "hospital_id": "uuid",
        "department_id": "uuid",
        "department_name": "Laboratory",
        "income_head_id": "uuid",
        "income_head_name": "Test Fee",
        "name": "Malaria Test",
        "amount": 25000,
        "is_active": true,
        "is_deleted": false,
        "created_at": "2026-04-24T08:30:00.000Z",
        "updated_at": "2026-04-24T08:30:00.000Z"
      }
    ]
  }
}
```

### PATCH `/api/admin/hospitals/:id/bill-items/:billItemId`

Body accepts any of:

```json
{
  "department_id": "uuid",
  "income_head_id": "uuid",
  "name": "Chest X-Ray",
  "amount": 6500,
  "status": "active"
}
```

Expected response:

```json
{
  "status": 200,
  "message": "Hospital bill item updated successfully",
  "data": {
    "id": "uuid",
    "hospital_id": "uuid",
    "department_id": "uuid",
    "income_head_id": "uuid",
    "name": "Chest X-Ray",
    "amount": 6500,
    "is_active": true
  }
}
```

## 13. Agent Balance Top Up

### POST `/api/admin/agents/topup`

Body:

```json
{
  "agent_id": "uuid",
  "hospital_id": "uuid",
  "amount": 5000
}
```

Expected response:

```json
{
  "status": 200,
  "message": "Agent balance topped up successfully",
  "data": {
    "transaction": {
      "id": "uuid",
      "agent_id": "uuid",
      "hospital_id": "uuid",
      "amount": 5000
    },
    "updated_balance": 12000
  }
}
```

## Common Errors To Handle

- `401`: Invalid credentials
- `401`: Invalid or expired refresh token
- `401`: Session expired due to inactivity
- `403`: Account suspended. Contact administrator.
- `400`: Invalid hospital_status. Use: active or suspended
- `400`: Invalid sort. Use: newest or oldest
- `400`: Invalid payment_method. Use: cash, transfer, or pos
- `400`: patient_id must contain only numbers
- `400`: page must be a valid positive integer
- `400`: limit must be a number between 1 and 100

## Frontend Notes

- Date range filters require both `start_date` and `end_date` together.
- List pages should call endpoints without filters first to show all data.
- Export endpoints usually use `export=csv`.
- Printable report endpoints use `print=true`.
- Dashboard hospital selection uses `hospitals=<id1>,<id2>`.
- Admin report selection flow should use `/api/admin/reports/options`.
- `department` and `agent` report endpoints return different shapes depending on whether a specific `department` or `agent_id` was selected.

## Suggested Admin Pages

1. Login
2. Dashboard
3. System Logs
4. Hospitals List
5. Hospital Overview
6. Hospital Transactions
7. Hospital Reports
8. Hospital Activity Logs
9. Hospital Receipt Requests
10. Hospital Agents
11. Hospital FOs
12. Hospital Departments
13. Hospital Income Heads
14. Hospital Bill Items
15. Agent Wallet Top Up
