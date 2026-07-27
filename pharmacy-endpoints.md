# Pharmacy Module API Integration Guide

This document lists the API endpoints consumed by each sub-module/page within the Pharmacy module.

---

## Global Requirements
All endpoints in this module require the following headers:
* `Authorization: Bearer <token>`
* Role: `PHARMACY`

---

## 1. Pharmacy Profile (Global Header Context)
Used in headers to resolve the pharmacist's name, active hospital branding, and module settings.
* **Endpoint:** `GET /api/pharmacy/profile`
* **Description:** Retrieves profile, hospital details, and module toggles (e.g. walk-in billing allowed, self-pay allowed).

---

## 2. Dashboard Sub-module (`/pharmacy/dashboard`)
Displays analytics, stock alerts, configuration, and pending requests list.
* **Endpoint:** `GET /api/pharmacy/dashboard`
  * **Description:** Retrieves real-time dashboard analytics (today's revenue, low stock count, expired stock count, etc.).
* **Endpoint:** `GET /api/pharmacy/request?status=pending&limit=5`
  * **Description:** Retrieves the first few pending billing requests to populate the list.
* **Endpoint:** `GET /api/pharmacy/inventory?limit=100`
  * **Description:** Retrieves inventory formulation list to calculate total formulations and total stock volume (sum of stocks).
* **Endpoint:** `GET /api/pharmacy/profile`
  * **Description:** Displays active hospital module configuration.

---

## 3. Dispense Sub-module (`/pharmacy/dispense`)
Enables searching formulations, looking up patients, creating billing requests, and processing checkout/self-pay.
* **Endpoint:** `GET /api/pharmacy/inventory`
  * **Description:** Searches the inventory items for prescription items.
* **Endpoint:** `GET /api/pharmacy/patients/:patient_id`
  * **Description:** Looks up a registered hospital patient using their patient ID digits.
* **Endpoint:** `GET /api/pharmacy/walk-in/:phoneNumber`
  * **Description:** Looks up a walk-in patient by phone number.
* **Endpoint:** `POST /api/pharmacy/request`
  * **Description:** Submits/creates a new billing request for a prescription.
* **Endpoint:** `POST /api/pharmacy/payment/self`
  * **Description:** Processes immediate checkouts/self-pay payments for drugs (Cash, POS, or Transfer) if allowed by the hospital setup.
* **Endpoint:** `GET /api/pharmacy/profile`
  * **Description:** Verifies module configuration.

---

## 4. Prescriptions Sub-module (`/pharmacy/prescriptions`)
Allows searching, reviewing details, editing, cancelling, and clearing/dispensing prescriptions.
* **Endpoint:** `GET /api/pharmacy/request`
  * **Description:** Retrieves billing requests with filters (pending, dispensed, cancelled).
* **Endpoint:** `GET /api/pharmacy/request/:requestId`
  * **Description:** Retrieves full details of a specific request, including items.
* **Endpoint:** `PATCH /api/pharmacy/request/:requestId`
  * **Description:** Updates/edits details and item quantities in a pending request.
* **Endpoint:** `DELETE /api/pharmacy/request/:requestId`
  * **Description:** Cancels/cancels a billing request.
* **Endpoint:** `POST /api/pharmacy/payment/self`
  * **Description:** Self-clears payment for a billing request.
* **Endpoint:** `POST /api/pharmacy/request/:requestId/dispense`
  * **Description:** Marks a paid request as physically dispensed.
* **Endpoint:** `GET /api/pharmacy/patients/:patient_id`
  * **Description:** Looks up a registered patient when editing request details.

---

## 5. Inventory Sub-module (`/pharmacy/inventory`)
Catalog management, adding formulations, updating details, and restocking batches.
* **Endpoint:** `GET /api/pharmacy/inventory`
  * **Description:** Retrieves paginated drug formulations list.
* **Endpoint:** `GET /api/pharmacy/categories`
  * **Description:** Retrieves list of active categories.
* **Endpoint:** `POST /api/pharmacy/inventory`
  * **Description:** Creates a new drug formulation entry.
* **Endpoint:** `PATCH /api/pharmacy/inventory/:itemId`
  * **Description:** Edits formulation details (name, generic name, category, unit price, threshold). *Note: Omit `stock` payload key.*
* **Endpoint:** `DELETE /api/pharmacy/inventory/:itemId`
  * **Description:** Deactivates/deletes a formulation.
* **Endpoint:** `GET /api/pharmacy/inventory/stock-addition`
  * **Description:** Queries historical stock additions/restock actions.
* **Endpoint:** `POST /api/pharmacy/inventory/stock-addition`
  * **Description:** Restocks/adds batch count to a formulation.

---

## 6. Reports Sub-module (`/pharmacy/reports`)
Financial breakdowns, transaction logs, and stock tracking logs.
* **Endpoint:** `GET /api/pharmacy/report/overview`
  * **Description:** Retrieves total revenue overview, top selling formulations, and payment method summaries.
* **Endpoint:** `GET /api/pharmacy/report/dispensed`
  * **Description:** Retrieves dispensed billing requests logs.
* **Endpoint:** `GET /api/pharmacy/report/stock-additions`
  * **Description:** Retrieves stock restock additions log history.
