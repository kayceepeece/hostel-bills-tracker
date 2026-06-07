# Hostel Bills Tracker — Specification

> **Goal:** A simple web dashboard for 26 hostel members (20 individuals + 6 shops) to view and track bill payments — light bill, sweeping contributions, environmental bill, and electricity usage — with easy month filtering.

---

## 1. Users

| Type | Count | Pays Light Bill | Pays Environmental | Sweeping Role |
|------|-------|-----------------|-------------------|---------------|
| Individual | 20 | ✅ | ✅ | Pay (₦1,500/mo) OR Sweep |
| Shop | 6 | ✅ | ✅ | N/A |

**Members List:**
- Rooms 1–20: Funmi, Destiny, Joan, Nikki, Eghosa, Wizzy, Daniel, Lemuel, Kaycee, Catherine, Joshua, Godstime, Nelly, Joyce, Hasel, Joy, Precious, Blessing, Valentine, Apata
- Shops 1–6: Lawrentina, Mike, Joy, Onome, Oma, Samuel

**Room assignments** are being finalized (confirmed: Kaycee=9, Precious=17, Blessing=18, Valentine=19, Apata=20).

---

## 2. Data Model

### members
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | Primary key |
| name | text | Unique, recognizable name |
| room | text | Room number or "Shop 1", "Shop 2", etc. |
| type | enum | 'individual' or 'shop' |
| sweeping_role | enum | 'pay', 'sweep', or null (shops) |
| phone | text | Optional |
| alt_contact | text | Optional |
| created_at | timestamp | |

### light_bill_payments
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | Primary key |
| member_id | UUID | FK → members |
| period | text | "July 2026" format |
| amount | integer | In Naira (₦) |
| date_paid | date | |
| method | text | Cash, Transfer, etc. |
| notes | text | Optional |
| created_at | timestamp | |

### sweeping_payments
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | Primary key |
| member_id | UUID | FK → members |
| period | text | "July 2026" format |
| amount | integer | ₦1,500 for payers, null for sweepers |
| date_paid | date | |
| notes | text | Optional |
| created_at | timestamp | |

### environmental_payments
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | Primary key |
| member_id | UUID | FK → members |
| period | text | "July 2026" format |
| amount | integer | In Naira (₦) |
| date_paid | date | |
| notes | text | Optional |
| created_at | timestamp | |

### electricity_usage
| Column | Type | Notes |
|--------|------|-------|
| id | UUID | Primary key |
| date | date | Reading date |
| meter_reading | integer | Current meter value |
| units_used | integer | Calculated (current - previous) |
| bought | integer | Amount spent (₦) |
| remaining | integer | Units remaining |
| notes | text | Optional |
| created_at | timestamp | |

---

## 3. Pages & Navigation

### Bottom Navigation Bar
```
[🏠 Dashboard] [👥 Members] [💰 Payments] [⚡ Electricity] [🔧 Admin]
```

### `/` — Dashboard
- Month selector pill at top
- 4 summary cards (Light Bill, Sweeping, Environmental, Electricity)
- Each card shows key stats + progress bar
- Tap card → navigate to detailed page

### `/members` — Members List
- Scrollable list of member cards
- Each card: Name, Room, Type, Sweeping Role, Contact
- Search bar at top
- Admin: Edit icon on each card

### `/payments` — Payment Hub
- **Sub-tabs** at top: [Light Bill] [Sweeping] [Environmental]
- Month selector pill (shared across sub-tabs)
- Scrollable list of payment cards for selected sub-tab
- Admin: "Add Payment" FAB (floating action button)

### `/electricity` — Electricity Usage
- Month selector pill at top
- Scrollable list of reading cards
- Summary card at top (total units, cost, average)
- Admin: "Add Reading" FAB

### `/admin` — Admin Panel
- Password login screen
- After login: Full edit access on all pages
- "Add" buttons and edit/delete icons appear
- Logout button

---

## 4. Authentication & Roles

### Public (no login)
- View dashboard
- View all payment tables
- Filter by month

### Admin (Kaycee only)
- **Login:** Password-protected `/admin` route
- **Session:** HTTP-only cookie, expires after 24 hours
- **Capabilities:**
  - Add/edit/delete all payment records
  - Add/edit/delete electricity readings
  - Add/edit/remove members
  - Edit member details (room, name, contacts, sweeping role)
- **All data is manually inputted** by admin

---

## 5. UI Requirements

### Design Principles
- **Mobile-first** — phone is primary device for all 26 members
- **Card-based layout** — no tables (tables are desktop-oriented)
- **Large tap targets** — easy to tap on small screens
- **Dark theme** — matches existing spreadsheet
- **Minimal navigation** — bottom nav bar with 5 tabs

### Navigation (Bottom Bar)
```
[Dashboard] [Members] [Payments] [Electricity] [Admin]
```

### Card Design

**Payment Card:**
```
┌─────────────────────────────┐
│  Funmi                      │
│  Room 1 • Individual        │
│                             │
│  ₦5,000                     │
│  Paid: 01/07/26 • Transfer  │
│                             │
│  [Edit] [Delete]  ← admin   │
└─────────────────────────────┘
```

**Member Card:**
```
┌─────────────────────────────┐
│  Funmi                      │
│  Room 1 • Individual        │
│  Sweeping: Pay              │
│  📱 080... • 💬 WhatsApp    │
└─────────────────────────────┘
```

**Electricity Reading Card:**
```
┌─────────────────────────────┐
│  July 1, 2026               │
│                             │
│  Reading: 1,250             │
│  Used: 8 units              │
│  Bought: ₦3,000             │
│  Remaining: 42 units        │
└─────────────────────────────┘
```

### Month Selector
- **Pill-style dropdown** at top of each page
- Shows current month by default
- Tap to expand → scroll through months
- Sticky at top while scrolling

### Add/Edit Forms
- **Bottom sheet** slides up from bottom
- Large input fields (easy to type on mobile)
- Big "Save" button at bottom
- Swipe down or tap X to cancel

### Dashboard Cards
```
┌─────────────────────────────┐
│  💡 Light Bill               │
│  ₦45,000 / ₦100,000         │
│  ████████░░░░ 45% paid       │
└─────────────────────────────┘

┌─────────────────────────────┐
│  🧹 Sweeping                 │
│  ₦22,500 collected           │
│  15 pay • 5 sweep            │
│  Share: ₦4,500/sweeper       │
└─────────────────────────────┘

┌─────────────────────────────┐
│  🌍 Environmental            │
│  ₦30,000 / ₦60,000          │
│  20/26 paid                  │
└─────────────────────────────┘

┌─────────────────────────────┐
│  ⚡ Electricity               │
│  240 units used              │
│  ₦9,000 spent               │
│  Avg: 8 units/day            │
└─────────────────────────────┘
```

---

## 5. Tech Stack

| Layer | Technology | Cost |
|-------|-----------|------|
| Frontend | Next.js 14 (App Router) | Free (Vercel) |
| Database | Neon PostgreSQL | Free (512MB, 190h compute) |
| Hosting | Vercel | Free (Hobby plan) |
| ORM | Drizzle | Free |
| Auth | Simple PIN (no full auth system) | Free |

---

## 6. API Routes

### Public (no auth)
```
GET    /api/members                         — List all members
GET    /api/light-bill?period=July 2026      — List payments for month
GET    /api/sweeping?period=July 2026        — List payments for month
GET    /api/environmental?period=July 2026   — List payments for month
GET    /api/electricity?month=7&year=2026    — List readings for month
GET    /api/dashboard?period=July 2026       — Aggregated summary
```

### Admin (password required)
```
POST   /api/admin/login                     — Authenticate, set cookie
POST   /api/admin/logout                    — Clear cookie

PUT    /api/admin/members/[id]              — Update member
POST   /api/admin/members                   — Add member
DELETE /api/admin/members/[id]              — Remove member

POST   /api/admin/light-bill                — Add payment
PUT    /api/admin/light-bill/[id]           — Edit payment
DELETE /api/admin/light-bill/[id]           — Delete payment

POST   /api/admin/sweeping                  — Add payment
PUT    /api/admin/sweeping/[id]             — Edit payment
DELETE /api/admin/sweeping/[id]             — Delete payment

POST   /api/admin/environmental             — Add payment
PUT    /api/admin/environmental/[id]        — Edit payment
DELETE /api/admin/environmental/[id]        — Delete payment

POST   /api/admin/electricity               — Add reading
PUT    /api/admin/electricity/[id]          — Edit reading
DELETE /api/admin/electricity/[id]          — Delete reading
```

---

## 7. Month Filtering

**User flow:**
1. Open any page
2. See "Month" dropdown at top (pre-selected to current month)
3. Select different month → table updates instantly
4. No page reload — client-side filtering or URL param

**Implementation:**
- Period stored as text ("July 2026") in DB
- Query filters by period column
- Dropdown populated from distinct periods in DB

---

## 8. Seed Data

Import from existing Google Sheets:
- Members list (26 entries)
- Historical payments (if any)
- Electricity readings (if any)

---

## 9. Deployment

1. Push to GitHub
2. Connect repo to Vercel
3. Add Neon database URL to Vercel env vars
4. Deploy
5. Share URL with hostel members

---

## 10. Future Enhancements (Not Now)

- Push notifications when bill is due
- Payment reminders via WhatsApp
- Export to PDF/Excel
- Multi-month comparison views
