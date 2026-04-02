<div align="center">

# 🏠 Maskan

### Premium Real Estate Platform for Morocco

*A modern, secure, full-stack real estate web application built with Django & React*

![Django](https://img.shields.io/badge/Django-5.x-092E20?style=flat&logo=django&logoColor=white)
![React](https://img.shields.io/badge/React-18-61DAFB?style=flat&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.6-3178C6?style=flat&logo=typescript&logoColor=white)
![Tailwind](https://img.shields.io/badge/Tailwind_CSS-3-06B6D4?style=flat&logo=tailwindcss&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Neon-4169E1?style=flat&logo=postgresql&logoColor=white)

---

[🚀 Quick Start](#-quick-start) • [📖 Features](#-features) • [🔒 Security](#-security) • [🗄️ Database](#️-database-schema) • [📡 API](#-api-reference) • [🎨 Design](#-design-system)

</div>

---

## ✨ What is Maskan?

Maskan is a **premium real estate platform** designed for the Moroccan market. It connects property buyers, sellers, and agents through a modern, intuitive web experience.

### 🎯 Key Highlights

- 🔍 **Smart Search** — Multi-criteria filters (type, region, city, price, area, bedrooms)
- 🗺️ **Interactive Map** — Leaflet-powered map with custom markers and modern popups
- 👤 **Agent Management** — Dynamic application system with admin-configurable forms
- 🛡️ **OWASP Security** — JWT auth, rate limiting, input validation, security headers
- 📱 **Mobile-First** — Responsive design, works beautifully on all devices
- ⚡ **Developer Mode** — Toggle mock data for investor demos

---

## 🏗️ Tech Stack

### Backend 🐍

| Technology | Purpose | Why |
|:---|:---|:---|
| **Python 3.12** | Runtime | Latest stable, fast |
| **Django 5.x** | Web framework | Batteries included, ORM, admin |
| **Django REST Framework** | REST API | Serialization, auth, filters |
| **PostgreSQL (Neon)** | Database | Serverless, scales to zero |
| **Simple JWT** | Authentication | HttpOnly cookie / Bearer token |
| **django-filter** | Search | Multi-criteria property filtering |
| **django-ratelimit** | Rate limiting | Per-IP, per-user throttling |
| **Pillow** | Image handling | Validation, format checking |

### Frontend ⚛️

| Technology | Purpose | Why |
|:---|:---|:---|
| **React 18** | UI framework | Concurrent features, fast |
| **TypeScript** | Type safety | Catch errors at compile time |
| **Vite 5** | Build tool | HMR, fast builds |
| **Tailwind CSS 3** | Styling | Utility-first, fast prototyping |
| **shadcn/ui** | Components | Radix primitives, customizable |
| **Framer Motion** | Animations | Smooth micro-interactions |
| **Leaflet** | Maps | Open-source, no API key needed |
| **Axios** | HTTP client | Interceptors, retry logic |
| **Lucide React** | Icons | 1000+ beautiful icons |

---

## 🚀 Quick Start

### Prerequisites

- 🐍 Python 3.12+
- 📦 Node.js 18+
- 🗄️ [Neon](https://console.neon.tech) PostgreSQL account (free tier)

### 1️⃣ Backend Setup

```bash
# Navigate to backend
cd maskan-api

# Create virtual environment
python -m venv .venv

# Activate it
# Windows:
.venv\Scripts\Activate.ps1
# macOS/Linux:
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure your database
# Edit .env → paste your Neon DATABASE_URL

# Run migrations
python manage.py migrate

# Create admin user
python manage.py createsuperuser

# Start the server 🚀
python manage.py runserver
```

✅ Backend running at `http://127.0.0.1:8000`

### 2️⃣ Frontend Setup

```bash
# Navigate to frontend (new terminal)
cd maskan-web

# Install dependencies
npm install

# Start dev server 🚀
npm run dev
```

✅ Frontend running at `http://localhost:5173`

### 3️⃣ Login

Open `http://localhost:5173` and use your superuser credentials to log in.

---

## 📁 Project Structure

```
immobiliere/
│
├── 📄 README.md                    ← You are here
├── 📄 UML_DOCUMENTATION.md         ← UML diagrams (PlantUML)
│
├── 📦 maskan-api/                   ← Django Backend
│   ├── manage.py
│   ├── requirements.txt
│   ├── .env                         ← Environment variables (secrets)
│   └── apps/
│       ├── 📁 accounts/
│       │   ├── models.py            ← User, AgentApplication, ApplicationField
│       │   ├── serializers.py       ← All account serializers
│       │   ├── views.py             ← Auth, profile, admin endpoints
│       │   ├── urls.py              ← Auth routes
│       │   ├── authentication.py    ← JWT cookie/Bearer auth
│       │   ├── permissions.py       ← IsAgent, IsOwner
│       │   └── admin.py             ← Django admin config
│       └── 📁 properties/
│           ├── models.py            ← Property, PropertyImage
│           ├── serializers.py       ← Property CRUD
│           ├── views.py             ← ViewSet with search
│           ├── filters.py           ← Multi-criteria filter
│           ├── urls.py              ← Property routes
│           └── admin.py
│
└── 📦 maskan-web/                   ← React Frontend
    ├── package.json
    ├── vite.config.ts               ← Vite + API proxy config
    ├── tailwind.config.js           ← Tailwind + shadcn theme
    └── src/
        ├── main.tsx                 ← Entry point + providers
        ├── App.tsx                  ← Route definitions
        ├── index.css                ← CSS variables (theme)
        │
        ├── 📁 types/
        │   └── index.ts             ← TypeScript interfaces
        │
        ├── 📁 lib/
        │   ├── api.ts               ← Axios + JWT interceptor
        │   ├── utils.ts             ← cn(), formatPrice()
        │   └── mockData.ts          ← Developer mode data
        │
        ├── 📁 context/
        │   └── AuthContext.tsx       ← Auth state management
        │
        ├── 📁 hooks/
        │   ├── useProperties.ts     ← Property fetch hooks
        │   ├── useLocations.ts      ← Cities/regions hooks
        │   ├── useDeveloperMode.ts  ← Dev mode toggle
        │   └── useToast.ts          ← Toast notifications
        │
        ├── 📁 components/
        │   ├── Navbar.tsx           ← Modern navbar + dropdowns
        │   ├── DashboardLayout.tsx  ← Collapsible sidebar
        │   ├── PropertyCard.tsx     ← Yakeey-style cards
        │   ├── SearchFilter.tsx     ← Tabbed search bar
        │   ├── PropertyMap.tsx      ← Leaflet map
        │   ├── MapPropertyPopup.tsx ← Modern map popup
        │   ├── LocationPicker.tsx   ← Map + reverse geocoding
        │   ├── ImageUploader.tsx    ← Drag-drop images
        │   ├── AvatarCropper.tsx    ← Profile photo crop
        │   ├── Toaster.tsx          ← Toast container
        │   └── 📁 ui/               ← 17 shadcn primitives
        │
        └── 📁 pages/
            ├── Home.tsx             ← Landing page
            ├── Properties.tsx       ← Search + grid/map
            ├── PropertyDetail.tsx   ← Full detail page
            ├── Login.tsx
            ├── Register.tsx
            ├── Estimate.tsx
            └── 📁 dashboard/
                ├── DashboardHome.tsx
                ├── DashboardProperties.tsx
                ├── AddProperty.tsx
                ├── DashboardStats.tsx
                ├── SavedProperties.tsx
                ├── Profile.tsx
                ├── Settings.tsx
                ├── UserManagement.tsx
                ├── BecomeAgent.tsx
                ├── AgentApplications.tsx
                └── ApplicationFields.tsx
```

---

## 🗄️ Database Schema

### 👤 User

| Field | Type | Description |
|:---|:---|:---|
| `id` | UUID | Primary key (no enumeration) |
| `email` | EmailField | Unique, used as login |
| `username` | CharField(30) | Display name |
| `phone` | CharField(20) | Contact (+212) |
| `role` | CharField(10) | `client` / `agent` / `admin` |
| `is_verified` | Boolean | Agent verification |
| `is_active` | Boolean | Account enabled |
| `avatar` | TextField | Base64 profile photo |
| `bio` | TextField | User biography |
| `address` | CharField(300) | Street address |
| `city` | CharField(100) | City name |
| `region` | CharField(100) | Moroccan region |
| `developer_mode` | Boolean | Admin mock data toggle |

### 🏠 Property

| Field | Type | Description |
|:---|:---|:---|
| `id` | UUID | Primary key |
| `title` | CharField(200) | Listing title |
| `description` | TextField | Full description |
| `property_type` | CharField(20) | apartment / villa / studio / house / land / commercial / office |
| `status` | CharField(10) | available / sold / rented / pending |
| `price` | Decimal(14,2) | Price in MAD |
| `area_sqm` | PositiveIntegerField | Area in m² |
| `bedrooms` | SmallIntegerField | Number of bedrooms |
| `bathrooms` | SmallIntegerField | Number of bathrooms |
| `address` | CharField(300) | Full address |
| `city` | CharField(100) | City |
| `region` | CharField(100) | Moroccan region |
| `latitude` | Decimal(12,8) | GPS latitude |
| `longitude` | Decimal(12,8) | GPS longitude |
| `agent_id` | FK → User | Property owner |
| `is_published` | Boolean | Visibility flag |
| `is_featured` | Boolean | Featured listing |

### 🖼️ PropertyImage

| Field | Type | Description |
|:---|:---|:---|
| `id` | UUID | Primary key |
| `property_id` | FK → Property | Parent property |
| `image_data` | TextField | Base64 encoded image |
| `image_hash` | CharField(64) | SHA-256 for dedup |
| `order` | SmallIntegerField | Display order |

### 📋 ApplicationField *(Dynamic Form Builder)*

| Field | Type | Description |
|:---|:---|:---|
| `id` | UUID | Primary key |
| `label` | CharField(200) | Field label |
| `field_type` | CharField(10) | text / number / textarea / select / checkbox |
| `placeholder` | CharField(200) | Input placeholder |
| `help_text` | CharField(300) | Helper text |
| `choices` | JSONField | Options for select fields |
| `is_required` | Boolean | Required validation |
| `order` | SmallIntegerField | Display order |
| `is_active` | Boolean | Enabled/disabled |

### 📝 AgentApplication

| Field | Type | Description |
|:---|:---|:---|
| `id` | UUID | Primary key |
| `user_id` | OneToOne → User | Applicant |
| `status` | CharField(10) | pending / approved / rejected |
| `admin_notes` | TextField | Review notes |
| `reviewed_by` | FK → User | Admin who reviewed |
| `reviewed_at` | DateTime | Review timestamp |

### 💬 ApplicationResponse

| Field | Type | Description |
|:---|:---|:---|
| `id` | UUID | Primary key |
| `application_id` | FK → AgentApplication | Parent application |
| `field_id` | FK → ApplicationField | Form field reference |
| `value` | TextField | User's answer |

---

## 📡 API Reference

### 🔐 Authentication

| Method | Endpoint | Description | Auth |
|:---:|:---|:---|:---:|
| `POST` | `/api/auth/register/` | Register new user | 🌐 Public |
| `POST` | `/api/auth/login/` | Login (returns JWT tokens) | 🌐 Public |
| `POST` | `/api/auth/logout/` | Logout (blacklist token) | 🔒 User |
| `GET` | `/api/auth/profile/` | Get own profile | 🔒 User |
| `PATCH` | `/api/auth/profile/` | Update own profile | 🔒 User |
| `POST` | `/api/auth/token/refresh/` | Refresh access token | 🌐 Public |

### 🏠 Properties

| Method | Endpoint | Description | Auth |
|:---:|:---|:---|:---:|
| `GET` | `/api/properties/` | List with filters + pagination | 🌐 Public |
| `POST` | `/api/properties/` | Create property with images | 🔒 Agent |
| `GET` | `/api/properties/{id}/` | Property detail | 🌐 Public |
| `PUT` | `/api/properties/{id}/` | Full update | 🔒 Owner |
| `PATCH` | `/api/properties/{id}/` | Partial update | 🔒 Owner |
| `DELETE` | `/api/properties/{id}/` | Delete property | 🔒 Owner |
| `GET` | `/api/properties/featured/` | Featured listings | 🌐 Public |
| `GET` | `/api/properties/cities/` | Distinct cities | 🌐 Public |
| `GET` | `/api/properties/regions/` | Distinct regions | 🌐 Public |
| `GET` | `/api/properties/map-pins/` | Lightweight map data | 🌐 Public |
| `GET` | `/api/properties/my-properties/` | Agent's own listings | 🔒 Agent |

### 🔍 Search Filters

```
GET /api/properties/
    ?search=villa               # Text search (title, city, description)
    &property_type=apartment    # Property type filter
    &region=Casablanca          # Region filter
    &city=Rabat                 # City filter
    &price_min=500000           # Minimum price (MAD)
    &price_max=5000000          # Maximum price (MAD)
    &bedrooms=3                 # Exact bedrooms
    &bedrooms_min=2             # Minimum bedrooms
    &area_min=50                # Minimum area (m²)
    &area_max=200               # Maximum area (m²)
    &is_featured=true           # Featured only
    &ordering=-price            # Sort: price, -price, created_at, -created_at
    &page=2                     # Pagination (20 per page)
```

### 👑 Admin Endpoints

| Method | Endpoint | Description |
|:---:|:---|:---|
| `GET` | `/api/auth/users/` | List all users |
| `PATCH` | `/api/auth/users/{id}/` | Update role/status |
| `DELETE` | `/api/auth/users/{id}/` | Delete user |
| `GET/PATCH` | `/api/auth/developer-mode/` | Toggle mock data |
| `GET/POST` | `/api/auth/application-fields/` | Form builder CRUD |
| `PUT/PATCH/DELETE` | `/api/auth/application-fields/{id}/` | Manage fields |
| `GET` | `/api/auth/agent-applications/` | List applications |
| `GET` | `/api/auth/agent-applications/{id}/` | Application detail |
| `PATCH` | `/api/auth/agent-applications/{id}/` | Approve/reject |

### 👤 Agent Application (Client)

| Method | Endpoint | Description |
|:---:|:---|:---|
| `GET` | `/api/auth/agent-application/` | Own application status |
| `POST` | `/api/auth/agent-application/` | Submit application |

---

## 🔒 Security

Maskan follows **OWASP** security guidelines:

### 🛡️ Authentication & Authorization

- ✅ **JWT tokens** with configurable expiry (access: 15min, refresh: 7 days)
- ✅ **Token blacklisting** on logout
- ✅ **Role-based access** (client / agent / admin)
- ✅ **UUID primary keys** — prevents sequential ID enumeration
- ✅ **Owner-only** write access to properties

### 🔐 Data Protection

- ✅ **HttpOnly cookies** option (no XSS token theft)
- ✅ **SameSite=Lax** — CSRF protection
- ✅ **HTTPS ready** — `SECURE_SSL_REDIRECT` in production
- ✅ **Secrets in `.env`** — never hardcoded
- ✅ **SHA-256 image hashing** — deduplication without exposing content

### 🚦 Rate Limiting

- ✅ **30 requests/min** on GET endpoints (per IP)
- ✅ **10 requests/min** on POST endpoints (per IP)
- ✅ **Login/Register** rate limited to prevent brute force

### 🛡️ Security Headers

- ✅ `X-Frame-Options: DENY` — prevents clickjacking
- ✅ `X-Content-Type-Options: nosniff` — prevents MIME sniffing
- ✅ `Referrer-Policy: strict-origin-when-cross-origin`
- ✅ `Content-Security-Policy` — restricts resource loading
- ✅ `HSTS` — forces HTTPS in production

### ✅ Input Validation

- ✅ **Frontend** — TypeScript types, form validation
- ✅ **Backend** — DRF serializers with field validators
- ✅ **SQL injection** — Django ORM only, no raw SQL
- ✅ **XSS** — React auto-escapes output, CSP headers
- ✅ **Image validation** — Pillow verifies format, size limit 10MB

### 🌐 CORS Configuration

```python
CORS_ALLOWED_ORIGINS = ["http://localhost:5173"]
CORS_ALLOW_CREDENTIALS = True
CORS_ALLOW_METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"]
```

---

## 🎨 Design System

### 🎨 Color Palette

| Token | Hex | Tailwind | Preview |
|:---|:---|:---|:---:|
| Primary | `#0F766E` | `teal-700` | 🟢 |
| Primary Hover | `#0D9488` | `teal-600` | 🟢 |
| Accent | `#14B8A6` | `teal-500` | 🟢 |
| Background | `#F0FDFA` | `teal-50` | ⬜ |
| Card | `#FFFFFF` | `white` | ⬜ |
| Foreground | `#134E4A` | `teal-900` | ⚫ |
| Muted | `#64748B` | `slate-500` | 🔘 |
| Border | `#E2E8F0` | `slate-200` | 🔘 |
| Success | `#16A34A` | `green-600` | 🟢 |
| Error | `#EF4444` | `red-500` | 🔴 |
| Warning | `#F59E0B` | `amber-500` | 🟡 |

### 🔤 Typography

| Role | Font | Weight | Usage |
|:---|:---|:---|:---|
| **Headings** | Inter | 600–800 | Page titles, card titles |
| **Body** | Inter | 400–500 | Paragraphs, descriptions |
| **Labels** | Inter | 500 | Form labels, badges |

```css
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
```

### 📐 Border Radius

| Element | Class | Value |
|:---|:---|:---|
| Cards | `rounded-xl` | 12px |
| Buttons | `rounded-lg` | 8px |
| Search bar | `rounded-full` | 9999px |
| Badges | `rounded-md` | 6px |
| Modals | `rounded-2xl` | 16px |
| Inputs | `rounded-lg` | 8px |

### 🎬 Animations

- **Page transitions** — Fade + slide via Framer Motion
- **Card entrance** — Staggered fade-up on scroll
- **Search expand** — Spring physics on focus
- **Map pins** — Bounce-in on filter results
- **Sidebar collapse** — Smooth width transition

---

## 🌍 Country Adaptation

Maskan is built for **Morocco** 🇲🇦 but can be adapted:

| Setting | Current Value | Location |
|:---|:---|:---|
| Currency | MAD (Dirham) | `models.py`, `formatPrice()` |
| Phone format | +212 | `Register.tsx` |
| Regions | Moroccan regions | Database (admin-configurable) |
| Cities | Moroccan cities | Database (seeded) |
| Map center | Casablanca (33.57, -7.59) | `PropertyMap.tsx` |

### To adapt for another country:

1. Update `currency` default in `Property` model
2. Update `formatPrice()` in `lib/utils.ts`
3. Update phone placeholder in `Register.tsx`
4. Reseed data with local cities/regions
5. Update map default center coordinates

---

## 📊 Features by Role

### 🌐 Public (Not Logged In)

- Browse property listings
- Search with filters
- View property details
- Interactive map
- Trending cities

### 👤 Client

- Everything above, plus:
- ❤️ Save favorite properties
- 📝 Apply to become agent
- ✏️ Edit profile + avatar
- 🔔 Notification settings

### 🏢 Agent

- Everything above, plus:
- ➕ Create property listings (5-step wizard)
- 🖼️ Upload property images (drag-drop)
- 📍 Map-based location picker
- 📊 View statistics
- ✏️ Edit/delete own properties

### 👑 Admin

- Everything above, plus:
- 👥 Manage all users (role, status, delete)
- 📋 Review agent applications (approve/reject)
- 🔧 Configure application form fields
- 🎭 Toggle developer mode (mock data)
- 📊 Full platform statistics

---

## 🧪 Development Mode

Admin can toggle **Developer Mode** in Settings to show impressive mock data — perfect for investor demos or portfolio presentations.

When enabled:
- Dashboard shows inflated statistics
- Activity feed shows simulated events
- All data is client-side generated (no API calls)

---

## 🛠️ Useful Commands

```bash
# Backend
python manage.py migrate              # Apply migrations
python manage.py createsuperuser      # Create admin
python manage.py shell                # Django shell
python manage.py check                # System check

# Frontend
npm run dev                           # Start dev server
npm run build                         # Production build
```

---

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing`)
5. Open a Pull Request

---

## 📄 License

This project is private. All rights reserved.

---

<div align="center">

**Built with ❤️ for Morocco 🇲🇦**

*Django • React • TypeScript • Tailwind • shadcn/ui • Framer Motion • Leaflet*

</div>
