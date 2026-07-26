# Front Office (FO) Module API Integration Guide

This document lists the API endpoints consumed by each sub-module/page within the Front Office (FO) module.

---

## Global Requirements
All endpoints in this module require the following headers:
* `Authorization: Bearer <token>`
* Role: `FRONT_OFFICE`

---

## 1. FO Profile (Global Context)
* **Endpoint:** `GET /api/fo/profile`
* **Description:** Retrieves FO user profile, assigned hospital details, and module active permissions.

---

## 2. Dashboard Sub-module (`/fo/dashboard`)
* **Endpoint:** `GET /api/fo/dashboard`
  * **Description:** Retrieves general analytics and aggregated stats for the dashboard display.
* **Endpoint:** `GET /api/fo/stats`
  * **Description:** Retrieves transaction aggregates and counts for graphical/card visualization.

---

## 3. Agents Sub-module (`/fo/agents`)
* **Endpoint:** `GET /api/fo/agents`
  * **Description:** Retrieves paginated list of cashier/agent accounts registered in the hospital.
* **Endpoint:** `POST /api/fo/create`
  * **Description:** Registers/creates a new agent account under the hospital.
* **Endpoint:** `PATCH /api/fo/agents/:agentId/status`
  * **Description:** Toggles an agent's account status (active/inactive).

---

## 4. Bill Items Sub-module (`/fo/bill-items`)
* **Endpoint:** `GET /api/fo/bill-items`
  * **Description:** Retrieves paginated billing catalog items.
* **Endpoint:** `POST /api/fo/bill-items`
  * **Description:** Registers a new billable catalog item.
* **Endpoint:** `PATCH /api/fo/bill-items/:billItemId`
  * **Description:** Updates details (name, price, status) of a billable catalog item.
* **Endpoint:** `GET /api/fo/departments`
  * **Description:** Lists departments for dropdown selection when creating/editing items.
* **Endpoint:** `GET /api/fo/income-heads`
  * **Description:** Lists income heads for dropdown selection.

---

## 5. Departments Sub-module (`/fo/departments`)
* **Endpoint:** `GET /api/fo/departments`
  * **Description:** Retrieves paginated list of hospital departments.
* **Endpoint:** `POST /api/fo/departments`
  * **Description:** Registers a new department.
* **Endpoint:** `PATCH /api/fo/departments/:departmentId`
  * **Description:** Updates department details (e.g. name, description).

---

## 6. Income Heads Sub-module (`/fo/income-heads`)
* **Endpoint:** `GET /api/fo/income-heads`
  * **Description:** Retrieves list of active income heads.
* **Endpoint:** `POST /api/fo/income-heads`
  * **Description:** Registers a new income head category.
* **Endpoint:** `PATCH /api/fo/income-heads/:incomeHeadId`
  * **Description:** Updates income head settings.

---

## 7. Receipts Sub-module (`/fo/receipts`)
* **Endpoint:** `GET /api/fo/receipts`
  * **Description:** Retrieves history of payment receipts generated in the hospital.
* **Endpoint:** `POST /api/fo/receipts/approve`
  * **Description:** Approves pending checkouts/receipt payments.
* **Endpoint:** `POST /api/fo/receipts/reject`
  * **Description:** Rejects incorrect/pending checkouts.

---

## 8. Transactions Sub-module (`/fo/transactions`)
* **Endpoint:** `GET /api/fo/transactions`
  * **Description:** Retrieves paginated log of all successful cashier transactions.

---

## 9. Reports Sub-module (`/fo/reports/*`)
Comprehensive auditing reports.
* **Endpoint:** `GET /api/fo/reports`
  * **Description:** Retrieves general hospital payment report summary.
* **Endpoint:** `GET /api/fo/report/patient`
  * **Description:** Retrieves payment report for a specific patient (by `patient_id` or `phone_number`).
* **Endpoint:** `GET /api/fo/report/department`
  * **Description:** Retrieves revenue breakdown reports per department.
* **Endpoint:** `GET /api/fo/report/agent`
  * **Description:** Retrieves transactions and revenue breakdown report per cashier/agent.
