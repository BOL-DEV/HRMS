# Pharmacy Inventory & Restocking APIs

These endpoints manage the drug inventory listings and restocking strategies.

---

## 1. Create Inventory Item
* **Endpoint:** `POST /api/pharmacy/inventory`
* **Role required:** `PHARMACY` or `PLATFORM_ADMIN`
* **Content-Type:** `application/json`

### Request Body
| Parameter | Type | Required | Description |
| :--- | :--- | :---: | :--- |
| `name` | `string` | **Yes** | Product/brand name of the drug. |
| `unit_price` | `number` | **Yes** | Selling price per single unit (must be >= 0). |
| `category_id` | `UUID` | No | ID of the associated category. |
| `generic_name` | `string` | No | Chemical/generic formula name. |
| `batch_number` | `string` | No | Batch code/number. |
| `expiry_date` | `string` | No | Expiration date (`YYYY-MM-DD`). |
| `stock` | `integer` | No | Initial stock quantity (default is `0`). |
| `reorder_level` | `integer` | No | Reorder threshold level (default is `0`). |

### Expected Response (`201 Created`)
```json
{
  "status": 201,
  "message": "Pharmacy item created successfully",
  "data": {
    "id": "e671a2e-4b2a-4dfa-8a5e-b49cb4a52444",
    "name": "Paracetamol 500mg",
    "generic_name": "Acetaminophen",
    "unit_price": 5.50,
    "stock": 100,
    "reorder_level": 20,
    "batch_number": "B123",
    "expiry_date": "2027-12-31",
    "is_active": true,
    "status": "In stock"
  }
}
```

---

## 2. List Inventory Items
* **Endpoint:** `GET /api/pharmacy/inventory`
* **Role required:** `PHARMACY` or `PLATFORM_ADMIN`
* **Query Parameters:**
  * `category_id` (optional, UUID): Filter by category.
  * `status` (optional, string): Filter by inventory status (`'Expired'`, `'Low stock'`, `'In stock'`).
  * `include_inactive` (optional, boolean): Set to `true` to include inactive items. Default is `false`.
  * `search` (optional, string): Search matching name, generic name, or batch number.
  * `page` (optional, integer): Page number for pagination. Default is `1`.
  * `limit` (optional, integer): Items per page. Default is `30`.

### Expected Response (`200 OK`)
```json
{
  "status": 200,
  "message": "Pharmacy items retrieved successfully",
  "data": {
    "total_items": 1,
    "page": 1,
    "limit": 30,
    "total_pages": 1,
    "items": [
      {
        "id": "e671a2e-4b2a-4dfa-8a5e-b49cb4a52444",
        "name": "Paracetamol 500mg",
        "generic_name": "Acetaminophen",
        "unit_price": 5.50,
        "stock": 100,
        "reorder_level": 20,
        "batch_number": "B123",
        "expiry_date": "2027-12-31T00:00:00.000Z",
        "status": "In stock"
      }
    ]
  }
}
```

---

## 3. Retrieve Single Item
* **Endpoint:** `GET /api/pharmacy/inventory/:itemId`
* **Role required:** `PHARMACY` or `PLATFORM_ADMIN`

### Expected Response (`200 OK`)
Returns detailed item attributes matching the single object in the list above.

---

## 4. Update Inventory Details (Excluding Stock)
* **Endpoint:** `PATCH /api/pharmacy/inventory/:itemId`
* **Role required:** `PHARMACY` or `PLATFORM_ADMIN`
* **Content-Type:** `application/json`

### Description
Allows editing basic drug details. **Note:** Direct modifications of `stock` counts are blocked here. Attempts to supply `stock` will return an error, forcing inventory adjustments to be routed through the restocking endpoint.

### Request Body
All fields are optional: `name`, `category_id`, `generic_name`, `batch_number`, `expiry_date`, `unit_price`, `reorder_level`, `is_active`.

### Expected Response on Error (`400 Bad Request`)
If `stock` is present in request body:
```json
{
  "status": 400,
  "error": "Direct updating of stock count is not allowed. Please use the stock addition endpoint."
}
```

---

## 5. List Items for Stock Addition
* **Endpoint:** `GET /api/pharmacy/inventory/stock-addition`
* **Role required:** `PHARMACY` or `PLATFORM_ADMIN`
* **Query Parameters:** Identical to the main list endpoint (`search`, `category_id`, `page`, `limit`).
* **Description:** Serves the list of inventory drugs for selection in the restocking screen.

---

## 6. Add Stock / Restock Item
* **Endpoint:** `POST /api/pharmacy/inventory/stock-addition`
* **Role required:** `PHARMACY` or `PLATFORM_ADMIN`
* **Content-Type:** `application/json`

### Request Body
| Parameter | Type | Required | Description |
| :--- | :--- | :---: | :--- |
| `pharmacy_item_id` | `UUID` | **Yes** | ID of the drug item to restock. |
| `quantity` | `integer` | **Yes** | Quantity to add (must be a positive integer > 0). |
| `batch_number` | `string` | No | Batch number of the new stock. |
| `expiry_date` | `string` | No | Expiry date of the new stock (`YYYY-MM-DD`). |

### Backend Behavior based on Strategy:
* **Option A (`single_row` strategy):**
  * The system increments the stock count on the selected drug item.
  * Overwrites its `batch_number` and `expiry_date` details with the new inputs (if provided).
* **Option B (`multi_batch` strategy - Default):**
  * If the input batch & expiry match the active row, increments its stock count.
  * If they differ, it searches if this hospital already has an active inventory record for this drug with the exact new batch and expiry details.
    * If found, it updates that record instead.
    * If not, it clones the base drug details into a new record with the new batch/expiry details and set stock.

### Expected Response (`200 OK`)
Returns the updated or newly generated inventory record.

---

## 7. Delete Item (Soft Delete)
* **Endpoint:** `DELETE /api/pharmacy/inventory/:itemId`
* **Role required:** `PLATFORM_ADMIN`

### Expected Response (`200 OK`)
```json
{
  "status": 200,
  "message": "Pharmacy item deleted successfully",
  "data": {
    "id": "e671a2e-4b2a-4dfa-8a5e-b49cb4a52444",
    "name": "Paracetamol 500mg",
    "is_deleted": true
  }
}
```
* **Behavior:** Soft deletes the inventory item by setting `is_deleted = true`.
