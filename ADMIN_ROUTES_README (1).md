# Admin Routes README

This document is for the frontend developer building the `PLATFORM_ADMIN` views.

Base URL:

```text
/api
```

Role required for every admin route here:

```text
PLATFORM_ADMIN
```

## Auth

### POST `/api/auth/login`

Body:

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

### Protected requests

Send this header on every protected request:

```http
Authorization: Bearer <accessToken>
```

### POST `/api/auth/refresh`

Body:

```json
{
  "refreshToken": "jwt-refresh-token"
}
```

### POST `/api/auth/update`

Admin can change own password or another user's password.

Update self:

```json
{
  "newPassword": "new-password"
}
```

Update another user:

```json
{
  "userId": "uuid",
  "newPassword": "new-password"
}
```

### GET `/api/auth/logout`

## Global Rules

- Success payloads are wrapped like `response.data.data`.
- Standard success shape is:

```json
{
  "status": 200,
  "message": "Some message",
  "data": {}
}
```

- All admin GET routes use query params only. Do not send GET bodies.
- `:id` in hospital admin routes is the hospital UUID.
- Date filters use `YYYY-MM-DD`.
- If a route supports date range filtering, send both `start_date` and `end_date` together.
- Most paginated endpoints reject invalid `page` and invalid `limit`.
- CSV export responses return raw file content, not JSON.
- Print responses return raw HTML, not JSON.
- Auth/session inactivity timeout is about `20 minutes`.

## Route Index

- `GET /api/admin/dashboard`
- `GET /api/admin/system-logs`
- `GET /api/admin/hospitals`
- `GET /api/admin/reports/options`
- `POST /api/admin/hospitals`
- `PUT /api/admin/hospitals/:id`
- `GET /api/admin/hospitals/:id/overview`
- `GET /api/admin/hospitals/:id/transactions`
- `GET /api/admin/hospitals/:id/patients/search`
- `GET /api/admin/hospitals/:id/reports`
- `GET /api/admin/hospitals/:id/report/patient`
- `GET /api/admin/hospitals/:id/report/department`
- `GET /api/admin/hospitals/:id/report/agent`
- `GET /api/admin/hospitals/:id/activity-logs`
- `GET /api/admin/hospitals/:id/receipts`
- `POST /api/admin/hospitals/:id/receipts/approve`
- `POST /api/admin/hospitals/:id/receipts/reject`
- `GET /api/admin/hospitals/:id/agents`
- `POST /api/admin/hospitals/:id/agents`
- `PATCH /api/admin/hospitals/:id/agents/:agentId`
- `GET /api/admin/hospitals/:id/fos`
- `POST /api/admin/hospitals/:id/fos`
- `PATCH /api/admin/hospitals/:id/fos/:foId`
- `POST /api/admin/hospitals/:id/departments`
- `GET /api/admin/hospitals/:id/departments`
- `PATCH /api/admin/hospitals/:id/departments/:departmentId`
- `DELETE /api/admin/hospitals/:id/departments/:departmentId`
- `POST /api/admin/hospitals/:id/income-heads`
- `GET /api/admin/hospitals/:id/income-heads`
- `PATCH /api/admin/hospitals/:id/income-heads/:incomeHeadId`
- `POST /api/admin/hospitals/:id/bill-items`
- `GET /api/admin/hospitals/:id/bill-items`
- `PATCH /api/admin/hospitals/:id/bill-items/:billItemId`
- `POST /api/admin/agents/topup`

## Common Frontend Handling

- Treat `401` as unauthenticated or expired session.
- Treat `403` as forbidden, wrong role, or cross-hospital access failure.
- When `export=csv`, download from the response body.
- When `print=true`, open/render the returned HTML on the frontend.
- Some list endpoints return extra dropdown helpers like `agent_name_list` and `fo_name_list`. Use them to populate selects.

## 1. Dashboard

### GET `/api/admin/dashboard`

Purpose:

- Global dashboard across all hospitals
- No hospital filter here
- Optional month filter only

Query params:

- `months`
  - Supported named values:
    - `this_month`
    - `last_month`
    - `last_two_months`
    - `last_2_months`
    - `last_three_months`
    - `last_3_months`
    - `last_6_months`
    - `last_6months`
    - `last_six_months`
    - `last_12_months`
    - `last_12months`
    - `last_twelve_months`
  - Also accepts a positive integer month count like `3` or `9`
  - Default when omitted is `12` months

Expected response:

```json
{
  "status": 200,
  "message": "Admin dashboard data retrieved successfully",
  "data": {
    "filters": {
      "months": 12,
      "period": "last_12_months"
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

- `highestPerformingHospitals[].status` currently comes back as `active` or `inactive`.
- This endpoint is already global, so do not build hospital query support into the dashboard page.

## 2. System Logs

### GET `/api/admin/system-logs`

Query params:

- `start_date`
- `end_date`
- `hospital_id`
- `role`: `PLATFORM_ADMIN` | `FO` | `AGENT`
- `page`
- `limit`

Defaults:

- `page=1`
- `limit=20`

Rules:

- `hospital_id` must be a valid UUID when sent.
- `role` is uppercased internally.

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

- `failed_reason` is only populated when log `status === "failed"`.
- `hospital.hospital_id` and `hospital.hospital_name` can be `null` for platform-level logs.

## 3. Hospitals

### GET `/api/admin/hospitals`

Query params:

- `search`
- `hospital_name`
- `hospital_code`
- `hospital_status`: `active` | `suspended`
- `sort`: `newest` | `oldest`

Defaults:

- `sort=newest`

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
        "hospital_code": "HC-001",
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

- Populate hospital dropdown before opening a report page
- Provide report types and linked endpoints

Query params:

- Same filters as `GET /api/admin/hospitals`

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
        "hospital_code": "HC-001",
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

Required:

- `name`

Optional:

- `logo_url`
- `address`
- `contact_email`
- `contact_phone`
- `revenue_type`

Rules:

- `name` is trimmed before save.
- Hospital name must be unique across hospitals.
- `revenue_type` supports `manual` or `automatic`.
- Default `revenue_type` is `manual`.

Expected response:

```json
{
  "status": 201,
  "message": "Hospital created successfully",
  "data": {
    "id": "uuid",
    "hospital_code": "HC-001",
    "name": "General Hospital",
    "logo_url": "https://example.com/logo.png",
    "address": "123 Hospital Road",
    "contact_email": "info@example.com",
    "contact_phone": "08012345678",
    "revenue_type": "automatic",
    "is_active": true,
    "created_at": "2026-04-24T09:00:00.000Z",
    "updated_at": "2026-04-24T09:00:00.000Z"
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

Rules:

- Send only fields being edited.
- At least one allowed field is required.
- `name` cannot be empty if sent.
- Hospital name must remain unique.
- `status` supports `active` or `suspended`.
- `revenue_type` supports `manual` or `automatic`.

Expected response:

```json
{
  "status": 200,
  "message": "Hospital updated successfully",
  "data": {
    "id": "uuid",
    "hospital_code": "HC-001",
    "name": "Updated Hospital Name",
    "logo_url": "https://example.com/new-logo.png",
    "address": "New Address",
    "contact_email": "new@example.com",
    "contact_phone": "08099999999",
    "revenue_type": "manual",
    "is_active": true,
    "created_at": "2026-04-24T09:00:00.000Z",
    "updated_at": "2026-04-24T11:00:00.000Z"
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
      "hospital_code": "HC-001",
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
      "total_fos": 2,
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

Frontend notes:

- `revenue_trend` is a 30-day daily series.

## 4. Transactions Per Hospital

### GET `/api/admin/hospitals/:id/transactions`

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

Defaults:

- `page=1`
- `limit=15`

Filter behavior:

- `patient_id` is exact patient ID match.
- `patient_id` must contain only digits when sent.
- `department` is matched by department name.
- `agent` is matched by full agent name.
- `search` is a broad text search on:
  - `patient_name`
  - `patient_id`
  - `phone_number`
  - `receipt_no`
- When no filters are sent, backend returns all completed transactions for that hospital.

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

Export behavior:

- `export=csv` returns a CSV attachment named like `admin_hospital_transactions_<hospitalId>.csv`
- Export mode still honors filters
- Export mode does not return JSON

### GET `/api/admin/hospitals/:id/patients/search`

Purpose:

- Patient ID autocomplete helper for the transaction page
- Use this while the user is typing patient ID digits

Query params:

- `query`
- or `patient_id`
- `limit`

Defaults:

- `limit=10`
- Max limit is `20`

Rules:

- Search value is required.
- Search value must contain only numbers.
- Matching is partial on `patient_id`.

Examples:

```http
GET /api/admin/hospitals/:id/patients/search?query=102
GET /api/admin/hospitals/:id/patients/search?patient_id=1023&limit=5
```

Expected response:

```json
{
  "status": 200,
  "message": "Patient search completed successfully",
  "data": {
    "hospital_id": "uuid",
    "query": "102",
    "total_matches": 2,
    "patients": [
      {
        "id": "uuid",
        "hospital_id": "uuid",
        "patient_id": "10234",
        "patient_name": "Amina Yusuf",
        "phone_number": "08012345678",
        "created_at": "2026-04-24T08:00:00.000Z",
        "updated_at": "2026-04-24T08:00:00.000Z"
      }
    ]
  }
}
```

Frontend notes:

- Build autosuggest from `patients[]`.
- Once the user picks a patient, pass the exact `patient_id` to `/transactions`.

## 5. Reports Per Hospital

Recommended flow:

1. Call `GET /api/admin/reports/options`
2. Choose hospital
3. Choose report type
4. Call the matching report endpoint

### GET `/api/admin/hospitals/:id/reports`

Revenue report.

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

Defaults:

- `page=1`
- `limit=15`

Filter behavior:

- `departments`, `income_heads`, and `agents` accept comma-separated UUIDs.
- `payment_method` supports `cash`, `transfer`, `pos`.

Expected JSON response:

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

Export and print behavior:

- `export=csv` returns CSV
- `print=true` returns printable HTML
- Do not expect JSON in those modes

### GET `/api/admin/hospitals/:id/report/patient`

Query params:

- `patient_id`
- `start_date`
- `end_date`
- `export=csv`
- `print=true`

Rules:

- `patient_id` is optional.
- If provided, it must contain only numbers.
- `filters.show_all` becomes `true` only when no patient and no date filters are applied.

Expected response:

```json
{
  "status": 200,
  "message": "Hospital patient report retrieved successfully",
  "data": {
    "hospital_id": "uuid",
    "hospital_name": "General Hospital",
    "hospital_code": "HC-001",
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

- Without `department`, response returns grouped `report`.
- With `department`, response returns one department `summary` plus `transactions`.
- `department` is matched by department name, not UUID.

All-departments response:

```json
{
  "status": 200,
  "message": "Hospital department report retrieved successfully",
  "data": {
    "hospital_id": "uuid",
    "hospital_name": "General Hospital",
    "hospital_code": "HC-001",
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

Single-department response:

```json
{
  "status": 200,
  "message": "Hospital department report retrieved successfully",
  "data": {
    "hospital_id": "uuid",
    "hospital_name": "General Hospital",
    "hospital_code": "HC-001",
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

- Without `agent_id`, response returns grouped `report`.
- With `agent_id`, response returns one agent `summary` plus `transactions`.
- `agent_id` should be sent as UUID.

All-agents response:

```json
{
  "status": 200,
  "message": "Hospital agent report retrieved successfully",
  "data": {
    "hospital_id": "uuid",
    "hospital_name": "General Hospital",
    "hospital_code": "HC-001",
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

Single-agent response:

```json
{
  "status": 200,
  "message": "Hospital agent report retrieved successfully",
  "data": {
    "hospital_id": "uuid",
    "hospital_name": "General Hospital",
    "hospital_code": "HC-001",
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

## 6. Activity Logs Per Hospital

### GET `/api/admin/hospitals/:id/activity-logs`

Query params:

- `start_date`
- `end_date`
- `action`: `all` | `hospital` | `agent` | `fo` | `department` | `income_head` | `bill_item` | `receipt_reprint` | `agent.balance_topped_up`
- `page`
- `limit`

Defaults:

- `action=all`
- `page=1`
- `limit=20`

Expected response:

```json
{
  "status": 200,
  "message": "Hospital activity logs retrieved successfully",
  "data": {
    "hospital_id": "uuid",
    "filters": {
      "start_date": "2026-04-01",
      "end_date": "2026-04-24",
      "action": "department",
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
        "actor": {
          "user_id": "uuid",
          "name": "Admin User",
          "email": "admin@example.com",
          "role": "PLATFORM_ADMIN"
        },
        "target": {
          "type": "department",
          "id": "uuid",
          "label": "Laboratory"
        },
        "metadata": {
          "status": "active"
        },
        "created_at": "2026-04-24T11:10:00.000Z"
      }
    ]
  }
}
```

Frontend notes:

- `metadata` varies by action.
- Use `action=all` or omit `action` to fetch every log type.
- Group filters work like `?action=fo`, `?action=department`, or `?action=receipt_reprint`.
- `action=agent` returns `agent.created` and `agent.updated` only. Use `action=agent.balance_topped_up` for wallet top-ups.
- Common actions include `hospital.created`, `hospital.updated`, `agent.created`, `agent.updated`, `fo.created`, `fo.updated`, `department.created`, `department.updated`, `department.deleted`, `income_head.created`, `income_head.updated`, `bill_item.created`, `bill_item.updated`, `receipt_reprint.approved`, `receipt_reprint.rejected`, and `agent.balance_topped_up`.

## 7. Receipt Reprint Requests

### GET `/api/admin/hospitals/:id/receipts`

Query params:

- `status`: `all` | `pending` | `approved` | `rejected`

Default:

- `status=all`

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

Expected response:

```json
{
  "status": 200,
  "message": "Receipt reprint rejected successfully",
  "data": {
    "id": "uuid",
    "transaction_id": "uuid",
    "agent_id": "uuid",
    "status": "rejected",
    "approved_at": "2026-04-24T09:15:00.000Z"
  }
}
```

Frontend notes:

- Reject response still uses field name `approved_at` because that is what the model currently returns.

## 8. Agents In A Hospital

### GET `/api/admin/hospitals/:id/agents`

Query params:

- `search`

Search behavior:

- Matches full name and email

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
        "total_topup": 335000,
        "last_wallet_topup": 5000,
        "status": "active"
      }
    ]
  }
}
```

Field meaning:

- `balance` is current remaining wallet balance.
- `total_revenue_made` is total completed transaction amount handled by the agent.
- `total_topup` is derived as `balance + total_revenue_made`.
- `last_wallet_topup` is the last credited wallet amount, not a date.

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

Rules:

- All fields are required.
- Response does not currently echo `phone`.

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
    "role": "AGENT",
    "hospital_id": "uuid",
    "is_active": true
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

Rules:

- At least one field is required.
- `first_name`, `last_name`, `email`, `phone`, `password` cannot be empty when sent.
- `status` supports `active` or `suspended`.
- `email` must remain unique.

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

## 9. FOs In A Hospital

### GET `/api/admin/hospitals/:id/fos`

Query params:

- `search`

Search behavior:

- Matches full name and email

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

Body:

```json
{
  "first_name": "Jane",
  "last_name": "Doe",
  "email": "jane@example.com",
  "phone": "08012345679",
  "password": "password123"
}
```

Rules:

- All fields are required.
- Response does not currently echo `phone`.

Expected response:

```json
{
  "status": 201,
  "message": "FO created successfully",
  "data": {
    "id": "uuid",
    "first_name": "Jane",
    "last_name": "Doe",
    "email": "jane@example.com",
    "role": "FO",
    "hospital_id": "uuid",
    "is_active": true
  }
}
```

### PATCH `/api/admin/hospitals/:id/fos/:foId`

Body accepts any of:

```json
{
  "first_name": "Jane",
  "last_name": "Doe",
  "email": "jane@example.com",
  "phone": "08012345679",
  "status": "active",
  "password": "newPassword123"
}
```

Rules:

- Same validation behavior as agent update.

Expected response:

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

Rules:

- `name` is required
- `name.trim()` cannot be empty
- Max length is `255`
- Department name must be unique within the hospital

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
    "is_deleted": false,
    "created_at": "2026-04-24T08:00:00.000Z",
    "updated_at": "2026-04-24T08:00:00.000Z"
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
        "income_heads": [
          {
            "income_head_id": "uuid",
            "name": "Test Fee",
            "is_active": true,
            "is_deleted": false,
            "created_at": "2026-04-24T08:30:00.000Z",
            "updated_at": "2026-04-24T08:30:00.000Z"
          }
        ],
        "bill_items": [
          {
            "bill_item_id": "uuid",
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
    ]
  }
}
```

Frontend notes:

- This is a nested management payload and is useful for department detail pages.
- `income_heads` and `bill_items` here are grouped by department already.

### PATCH `/api/admin/hospitals/:id/departments/:departmentId`

Body:

```json
{
  "name": "Updated Department Name"
}
```

Rules:

- `name` is required for update
- `name.trim()` cannot be empty
- Max length is `255`
- Department name must remain unique within the hospital

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
    "is_deleted": false,
    "created_at": "2026-04-24T08:00:00.000Z",
    "updated_at": "2026-04-24T09:00:00.000Z"
  }
}
```

### DELETE `/api/admin/hospitals/:id/departments/:departmentId`

Behavior:

- Soft delete only
- Deleted department becomes `is_deleted=true` and `is_active=false`

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
    "is_deleted": true,
    "created_at": "2026-04-24T08:00:00.000Z",
    "updated_at": "2026-04-24T10:00:00.000Z"
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

Rules:

- `department_id` and `name` are required
- `name.trim()` cannot be empty
- Max length is `255`
- Department must belong to this hospital
- Name must be unique inside the selected department

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
    "is_deleted": false,
    "created_at": "2026-04-24T08:30:00.000Z",
    "updated_at": "2026-04-24T08:30:00.000Z"
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

Frontend notes:

- Admin list includes inactive records too because `include_inactive=true`.

### PATCH `/api/admin/hospitals/:id/income-heads/:incomeHeadId`

Body accepts any of:

```json
{
  "name": "Updated Name",
  "status": "active"
}
```

Rules:

- At least one of `name` or `status` is required
- `name` must be string if sent
- `name.trim()` cannot be empty
- Max length is `255`
- `status` supports `active` or `suspended`
- Name must remain unique inside the same department

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
    "is_active": true,
    "is_deleted": false,
    "created_at": "2026-04-24T08:30:00.000Z",
    "updated_at": "2026-04-24T09:30:00.000Z"
  }
}
```

## 12. Bill Items

Important:

- These endpoints exist for admin, but bill-item management only makes business sense for hospitals with `revenue_type=automatic`.
- FO bill-item management explicitly enforces `automatic`; admin docs should still assume these are for automatic-revenue hospitals.

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

Rules:

- `department_id`, `income_head_id`, `name`, and `amount` are required
- `name` is trimmed
- `name` max length is `255`
- `amount` must be a positive number
- Department and income head must belong to the same hospital

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
    "is_active": true,
    "is_deleted": false,
    "created_at": "2026-04-24T08:30:00.000Z",
    "updated_at": "2026-04-24T08:30:00.000Z"
  }
}
```

### GET `/api/admin/hospitals/:id/bill-items`

Query params:

- `department_id`
- `income_head_id`
- `search`
- `bill_name`
- `page`
- `limit`

Behavior:

- Backend uses `search || bill_name`.
- `department_id` and `income_head_id` are UUID filters.
- Inactive bill items are included for admin.

Pagination behavior:

- Bad `page` is normalized to `1`
- Bad `limit` falls back to `30`

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

Also supported:

```json
{
  "is_active": true
}
```

Rules:

- At least one field is required
- `name` is trimmed if sent
- Send either `status` or `is_active`, not both
- `status` supports `active` or `suspended`
- If moving department or income head, backend re-validates the relationship

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
    "is_active": true,
    "is_deleted": false,
    "created_at": "2026-04-24T08:30:00.000Z",
    "updated_at": "2026-04-24T09:00:00.000Z"
  }
}
```

## 13. Agent Wallet Top-Up

### POST `/api/admin/agents/topup`

Body:

```json
{
  "agent_id": "uuid",
  "hospital_id": "uuid",
  "amount": 5000
}
```

Rules:

- All fields are required
- `amount` must be a positive number

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

Frontend notes:

- Use this after choosing both hospital and agent.
- If top-up succeeds, refresh the hospital agents list to get updated `balance`, `total_topup`, and `last_wallet_topup`.

## Common Error Messages

- `400`: Hospital name is required
- `400`: Hospital name cannot be empty
- `400`: Hospital with this name already exists
- `400`: Invalid revenue_type. Use: manual or automatic
- `400`: Invalid status. Use: active or suspended
- `400`: Invalid sort. Use: newest or oldest
- `400`: hospital_id must be a valid UUID
- `400`: role must be one of: PLATFORM_ADMIN, FO, AGENT
- `400`: Both start_date and end_date are required together
- `400`: Invalid date format. Use YYYY-MM-DD
- `400`: start_date cannot be later than end_date
- `400`: Invalid months filter. Use: this_month, last_month, last_two_months, last_three_months, last_6_months, or last_12_months
- `400`: Invalid payment_method. Use: cash, transfer, or pos
- `400`: patient_id must contain only numbers
- `400`: query is required
- `400`: query must contain only numbers
- `400`: page must be a valid positive integer
- `400`: limit must be a number between 1 and 100
- `400`: Invalid page number. Total pages: X
- `400`: Invalid export format. Use: csv
- `400`: Request ID is required
- `400`: first_name, last_name, email, phone, and password are required
- `400`: At least one of first_name, last_name, email, phone, status, or password is required
- `400`: Department name is required
- `400`: Department name cannot be empty
- `400`: Department name cannot exceed 255 characters
- `400`: Department name is required for update
- `400`: A department with this name already exists in this hospital
- `400`: department_id and name are required
- `400`: Income head name cannot be empty
- `400`: Income head name cannot exceed 255 characters
- `400`: At least one of name or status is required
- `400`: An income head with this name already exists in the selected department
- `400`: department_id, income_head_id, name, and amount are required
- `400`: Amount must be a positive number
- `400`: Provide either status or is_active, not both
- `403`: Department does not belong to this hospital
- `403`: Only platform admin can perform balance top-ups
- `404`: Hospital not found
- `404`: AGENT user not found in this hospital
- `404`: FO user not found in this hospital
- `404`: Department not found in this hospital
- `404`: Income head not found in this hospital
- `404`: Bill item not found in this hospital
- `404`: Pending reprint request not found for this hospital

## Suggested Admin Pages

1. Login
2. Dashboard
3. System Logs
4. Hospitals List
5. Create Hospital
6. Edit Hospital
7. Hospital Overview
8. Hospital Transactions
9. Patient ID Transaction Search
10. Hospital Reports
11. Hospital Activity Logs
12. Receipt Reprint Requests
13. Agents
14. FOs
15. Departments
16. Income Heads
17. Bill Items
18. Agent Wallet Top-Up
