# MedCare — AI-Powered Clinic Management

A modern clinic management web application with an AI chatbot assistant for appointment booking, doctor discovery, and patient management.

## Features

- **AI Chat Assistant** — 24/7 conversational bot that helps patients find doctors and book appointments
- **Doctor Directory** — Browse specialists with profiles, qualifications, and availability
- **Appointment Booking** — Seamless scheduling powered by real-time doctor availability
- **Admin Dashboard** — Manage doctors, patients, appointments, conversations, and clinic settings
- **Authentication** — Secure staff login with password reset flow
- **Responsive Design** — Works across desktop, tablet, and mobile

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, TypeScript, Vite |
| Styling | Tailwind CSS, shadcn/ui, Framer Motion |
| Backend | Supabase (Auth, Database, Edge Functions) |
| AI | Supabase Edge Functions with LLM integration |
| State | TanStack React Query |
| Routing | React Router v6 |

## Getting Started

### Prerequisites

- Node.js 18+
- npm or bun

### Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd medcare

# Install dependencies
npm install

# Start development server
npm run dev
```

The app will be available at `http://localhost:5173`.

### Environment Variables

Create a `.env` file in the project root:

```env
VITE_SUPABASE_URL=<your-supabase-url>
VITE_SUPABASE_PUBLISHABLE_KEY=<your-supabase-anon-key>
```

## Project Structure

```
src/
├── components/
│   ├── auth/          # Authentication guards
│   ├── chat/          # AI chat widget
│   ├── layout/        # App layout & sidebar
│   └── ui/            # shadcn/ui components
├── hooks/             # Custom React hooks (auth, toast)
├── integrations/      # Supabase client & types
├── lib/               # Chat service & utilities
├── pages/
│   ├── admin/         # Admin dashboard pages
│   ├── Index.tsx      # Public homepage
│   ├── DoctorsPage.tsx
│   └── AuthPage.tsx   # Login & signup
supabase/
├── functions/         # Edge functions (chat, book-appointment)
└── config.toml
```

## Admin Panel

Access the admin dashboard at `/admin` (requires authentication):

- **Dashboard** — Overview stats and metrics
- **Doctors** — Manage doctor profiles and schedules
- **Appointments** — View and manage bookings
- **Patients** — Patient records
- **Conversations** — Review AI chat conversations
- **Settings** — Clinic configuration

## License

This project is private. All rights reserved.
