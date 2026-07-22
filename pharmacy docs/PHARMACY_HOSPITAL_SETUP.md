# Hospital Setup & Pharmacy Module Configuration

This document covers hospital registration and configuration parameters related to the Pharmacy Module. 

---

## 1. Hospital Registration
* **Endpoint:** `POST /api/admin/hospitals`
* **Role required:** `PLATFORM_ADMIN`
* **Content-Type:** `application/json`

### Request Body
| Parameter | Type | Required | Default | Description |
| :--- | :--- | :---: | :---: | :--- |
| `name` | `string` | **Yes** | — | Unique name of the hospital. |
| `has_pharmacy_module` | `boolean` | No | `false` | Enable or disable the pharmacy module for the hospital. |
| `pharmacy_batch_strategy` | `string` | No | `'multi_batch'` | Strategy for restocking. Options: `'single_row'` or `'multi_batch'`. |
| `allow_pharmacy_walk_in` | `boolean` | No | `true` | Allow pharmacy billing for unregistered walk-in patients. |
| `allow_pharmacy_self_pay` | `boolean` | No | `false` | Allow pharmacists to pay/clear billing requests directly. |
| `allow_agent_pharmacy_pay` | `boolean` | No | `true` | Allow general agents to pay/clear billing requests. |

### Expected Response (`201 Created`)
```json
{
  "status": 201,
  "message": "Hospital created successfully",
  "data": {
    "id": "78326a2e-4b2a-4dfa-8a5e-b49cb4a52021",
    "hospital_code": "HC-123456",
    "name": "General Hospital",
    "has_pharmacy_module": true,
    "pharmacy_batch_strategy": "multi_batch",
    "allow_pharmacy_walk_in": true,
    "allow_pharmacy_self_pay": false,
    "allow_agent_pharmacy_pay": true,
    "is_active": true
  }
}
```

---

## 2. Hospital Update
* **Endpoint:** `PUT /api/admin/hospitals/:id`
* **Role required:** `PLATFORM_ADMIN`
* **Content-Type:** `application/json`

### Request Body
All parameters are optional. Include only the fields you wish to update.
* Includes: `name`, `has_pharmacy_module`, `pharmacy_batch_strategy` (`'single_row'` or `'multi_batch'`), `allow_pharmacy_walk_in`, `allow_pharmacy_self_pay`, `allow_agent_pharmacy_pay`.

### Expected Response (`200 OK`)
Returns the updated hospital record with the same structure as the creation response.

---

## 3. Configuration Details & Behavior

### `has_pharmacy_module`
* **`true`:** Enables the pharmacy module. An associated `"Pharmacy"` department is automatically generated for the hospital if it does not already exist.
* **`false`:** Disables all pharmacy-related features and endpoints for the hospital.

### `pharmacy_batch_strategy`
* **`'single_row'`:** Option A (Single Row per Drug). Stock adjustments are made on the same item record. Overwrites batch numbers and expiry dates with the latest values input on restocking.
* **`'multi_batch'`:** Option B (Multi-batch tracking). Restocking with a different batch number or expiry date creates a separate inventory record for the drug to isolate the batches.

### `allow_pharmacy_walk_in`
* **`true`:** Allows billing walk-in patients (using their name & phone number) without requiring a registered hospital `patient_id`.
* **`false`:** Restricts all pharmacy billing requests to patients with a valid registered Patient ID.

### `allow_pharmacy_self_pay` & `allow_agent_pharmacy_pay`
* Restricts who can clear billing requests. If both are true, either pharmacists or agents can process payments.
