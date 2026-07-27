# Pharmacy Categories API

These endpoints manage categories for drugs/items inside the pharmacy department.

---

## 1. Create Category
* **Endpoint:** `POST /api/pharmacy/categories`
* **Role required:** `PHARMACY` or `PLATFORM_ADMIN`
* **Content-Type:** `application/json`

### Request Body
```json
{
  "name": "Analgesics"
}
```

### Expected Response (`201 Created`)
```json
{
  "status": 201,
  "message": "Pharmacy category created successfully",
  "data": {
    "id": "e4581a2e-4b2a-4dfa-8a5e-b49cb4a52333",
    "hospital_id": "78326a2e-4b2a-4dfa-8a5e-b49cb4a52021",
    "name": "Analgesics",
    "is_active": true,
    "is_deleted": false,
    "created_at": "2026-07-22T06:10:00.000Z",
    "updated_at": "2026-07-22T06:10:00.000Z"
  }
}
```

---

## 2. List Categories
* **Endpoint:** `GET /api/pharmacy/categories`
* **Role required:** `PHARMACY` or `PLATFORM_ADMIN`
* **Query Parameters:**
  * `include_inactive` (optional, boolean): Set to `true` to include inactive categories. Default is `false`.
  * `search` (optional, string): Filter categories matching the query name.
  * `hospital_id` (optional, UUID): For `PLATFORM_ADMIN` requests to retrieve categories of a specific hospital.

### Expected Response (`200 OK`)
```json
{
  "status": 200,
  "message": "Pharmacy categories retrieved successfully",
  "data": [
    {
      "id": "e4581a2e-4b2a-4dfa-8a5e-b49cb4a52333",
      "hospital_id": "78326a2e-4b2a-4dfa-8a5e-b49cb4a52021",
      "name": "Analgesics",
      "is_active": true,
      "is_deleted": false,
      "created_at": "2026-07-22T06:10:00.000Z",
      "updated_at": "2026-07-22T06:10:00.000Z"
    }
  ]
}
```

---

## 3. Update Category
* **Endpoint:** `PATCH /api/pharmacy/categories/:categoryId`
* **Role required:** `PHARMACY` or `PLATFORM_ADMIN`
* **Content-Type:** `application/json`

### Request Body
All parameters are optional.
```json
{
  "name": "Pain Relievers",
  "is_active": false
}
```

### Expected Response (`200 OK`)
Returns the updated category object.

---

## 4. Delete Category (Soft Delete)
* **Endpoint:** `DELETE /api/pharmacy/categories/:categoryId`
* **Role required:** `PHARMACY` or `PLATFORM_ADMIN`

### Expected Response (`200 OK`)
```json
{
  "status": 200,
  "message": "Pharmacy category deleted successfully",
  "data": {
    "id": "e4581a2e-4b2a-4dfa-8a5e-b49cb4a52333",
    "name": "Pain Relievers",
    "is_deleted": true
  }
}
```
* **Behavior:** Performs a soft delete (marks `is_deleted = true`). All associated drug items in this category remain, but the category itself is excluded from normal queries.
