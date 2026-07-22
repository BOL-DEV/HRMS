# Pharmacy Profile & Dashboard APIs

These endpoints provide profile details and analytical overview stats for the pharmacy dashboard.

---

## 1. Pharmacy Profile
* **Endpoint:** `GET /api/pharmacy/profile`
* **Role required:** `PHARMACY`
* **Headers:** `Authorization: Bearer <token>`
* **Description:** Retrieves the logged-in pharmacist's profile, including their assigned hospital and its settings.

### Expected Response (`200 OK`)
```json
{
  "status": 200,
  "message": "Pharmacy profile retrieved successfully",
  "data": {
    "id": "2b3a6a2e-4b2a-4dfa-8a5e-b49cb4a52011",
    "first_name": "John",
    "last_name": "Doe",
    "email": "john.doe@hospital.com",
    "phone": "08012345678",
    "role": "PHARMACY",
    "is_active": true,
    "created_at": "2026-07-22T06:00:00.000Z",
    "hospital_id": "78326a2e-4b2a-4dfa-8a5e-b49cb4a52021",
    "hospital_name": "General Hospital",
    "hospital_code": "HC-123456",
    "hospital_modules": {
      "has_pharmacy_module": true,
      "allow_pharmacy_self_pay": true,
      "allow_agent_pharmacy_pay": true,
      "allow_pharmacy_walk_in": true
    }
  }
}
```

---

## 2. Pharmacy Dashboard Analytics
* **Endpoint:** `GET /api/pharmacy/dashboard`
* **Role required:** `PHARMACY` or `PLATFORM_ADMIN`
* **Headers:** `Authorization: Bearer <token>`
* **Description:** Returns summary metrics and analytical reports for the active hospital.

### Expected Response (`200 OK`)
```json
{
  "status": 200,
  "message": "Pharmacy dashboard analytics retrieved successfully",
  "data": {
    "summary": {
      "total_inventory_items": 142,
      "total_categories": 12,
      "low_stock_items": 8,
      "expired_items": 3,
      "pending_billing_requests": 14
    },
    "sales": {
      "today_total_revenue": 45000.00,
      "today_dispensed_count": 18
    },
    "low_stock_alerts": [
      {
        "id": "e391a2e-4b2a-4dfa-8a5e-b49cb4a52111",
        "name": "Paracetamol 500mg",
        "generic_name": "Acetaminophen",
        "stock": 5,
        "reorder_level": 50,
        "status": "Low stock"
      }
    ],
    "expiry_alerts": [
      {
        "id": "f581a2e-4b2a-4dfa-8a5e-b49cb4a52222",
        "name": "Amoxicillin 250mg",
        "generic_name": "Amoxicillin",
        "expiry_date": "2026-06-30",
        "status": "Expired"
      }
    ]
  }
}
```
