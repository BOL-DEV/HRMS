# HRMS Frontend

SwiftRev's HRMS frontend is a Next.js application for hospital revenue operations across admin, FO, and agent workspaces.

## Stack

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS 4
- TanStack Query
- Recharts

## Workspaces

- `admin`: platform-wide oversight, hospital management, reports, receipts, and audit flows
- `fo`: financial office operations, reports, revenue breakdowns, and receipts
- `agents`: transaction processing, wallet balance tracking, top-up history, and patient payment flows

## Local Development

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Open `http://localhost:3000`.

## Scripts

```bash
npm run dev
npm run build
npm run start
npm run lint
npm run ts-check
```

## Project Structure

```text
app/          Route entry points and page-level UI
components/   Shared interface building blocks
libs/         API clients, helpers, types, and branding constants
```

## Notes

- Authentication routes users into the correct workspace after login.
- Reporting screens support export/print flows for admin and FO use cases.
- Chart surfaces use shared SwiftRev watermark styling.

