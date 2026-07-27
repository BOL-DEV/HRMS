# Pharmacy Reports & Logs APIs

These endpoints provide financial summaries, restocking history logs, and detailed dispensing audits.

---

## 1. Pharmacy Overview Report
* **Endpoint:** `GET /api/pharmacy/report/overview`
* **Role required:** `PHARMACY` or `PLATFORM_ADMIN`
* **Query Parameters:**
  * `start_date` / `end_date` (optional, string): Filter date range (`YYYY-MM-DD`). Default is today.

### Expected Response (`200 OK`)
```json
{
  "status": 200,
  "message": "Pharmacy overview report retrieved successfully",
  "data": {
    "summary": {
      "total_revenue": 125000.00,
      "dispensed_count": 48,
      "unique_patients_served": 35
    },
    "sales_by_payment_type": [
      { "payment_type": "cash", "amount": 80000.00, "count": 30 },
      { "payment_type": "pos", "amount": 30000.00, "count": 12 },
      { "payment_type": "transfer", "amount": 15000.00, "count": 6 }
    ],
    "top_selling_items": [
      {
        "pharmacy_item_id": "e671a2e-4b2a-4dfa-8a5e-b49cb4a52444",
        "item_name": "Paracetamol 500mg",
        "generic_name": "Acetaminophen",
        "quantity_sold": 220,
        "revenue_generated": 1210.00
      }
    ]
  }
}
```

---

## 2. Dispensed Billing Report Logs
* **Endpoint:** `GET /api/pharmacy/report/dispensed`
* **Role required:** `PHARMACY` or `PLATFORM_ADMIN`
* **Query Parameters:**
  * `start_date` / `end_date` (optional, string): Filter date range (`YYYY-MM-DD`). Default is today.
  * `page` (optional, integer): Page number. Default is `1`.
  * `limit` (optional, integer): Logs per page. Default is `30`.

### Expected Response (`200 OK`)
```json
{
  "status": 200,
  "message": "Pharmacy dispensed report retrieved successfully",
  "data": {
    "total_items": 1,
    "page": 1,
    "limit": 30,
    "total_pages": 1,
    "logs": [
      {
        "id": "a9821a2e-4b2a-4dfa-8a5e-b49cb4a52555",
        "billing_code": "PH-98765432",
        "patient_id": "1002",
        "patient_name": "Alice Johnson",
        "phone_number": "08098765432",
        "total_amount": 55.00,
        "dispensed_at": "2026-07-22T06:15:00.000Z",
        "pharmacist_name": "John Doe",
        "payment_type": "cash",
        "items": [
          {
            "pharmacy_item_id": "e671a2e-4b2a-4dfa-8a5e-b49cb4a52444",
            "item_name": "Paracetamol 500mg",
            "generic_name": "Acetaminophen",
            "quantity": 10,
            "unit_price": 5.50,
            "total_price": 55.00
          }
        ]
      }
    ]
  }
}
```

---

## 3. Stock Additions History (Audit Logs)
* **Endpoint:** `GET /api/pharmacy/report/stock-additions`
* **Role required:** `PHARMACY` or `PLATFORM_ADMIN`
* **Query Parameters:**
  * `start_date` / `end_date` (optional, string): Filter date range (`YYYY-MM-DD`). Default is today.
  * `page` (optional, integer): Page number. Default is `1`.
  * `limit` (optional, integer): Logs per page. Default is `30`.

### Expected Response (`200 OK`)
```json
{
  "status": 200,
  "message": "Pharmacy stock report retrieved successfully",
  "data": {
    "total_items": 1,
    "page": 1,
    "limit": 30,
    "total_pages": 1,
    "logs": [
      {
        "id": "b381a2e-4b2a-4dfa-8a5e-b49cb4a52666",
        "action_type": "restock",
        "quantity_changed": 150,
        "old_stock": 100,
        "new_stock": 250,
        "old_batch": "B123",
        "new_batch": "B123-NEW",
        "old_expiry": "2027-12-31T00:00:00.000Z",
        "new_expiry": "2028-06-30T00:00:00.000Z",
        "created_at": "2026-07-22T06:16:00.000Z",
        "item_name": "Paracetamol 500mg",
        "generic_name": "Acetaminophen",
        "pharmacist_name": "John Doe"
      }
    ]
  }
}
```
* **Behavior:** Shows both initial item creation entries (`action_type = 'create'`) and restocking events (`action_type = 'restock'`), recording changes in quantities, batch numbers, and expiry dates.
