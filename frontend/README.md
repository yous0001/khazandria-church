# Khazandria Church Activities Management - Frontend

Mobile-first Next.js frontend for managing church activities, with Arabic RTL support.

## Quick Start

1. **Install dependencies:**

```bash
npm install
```

2. **Configure environment:**

Copy `env.example` to `.env.local`:

```bash
cp env.example .env.local
```

Edit `.env.local` and set:
- `INTERNAL_API_BASE_URL`: Your backend API URL (e.g., `http://localhost:5000/api`)

3. **Add the church logo:**

Save the church logo image as `public/logo.png` (recommended size: 512x512px)

4. **Run development server:**

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

5. **Login:**

Use the backend seed credentials:
- Email: `superadmin@khazandria.com`
- Password: `Admin@12345`

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **Forms**: React Hook Form + Zod
- **Data Fetching**: TanStack Query
- **Icons**: Lucide React
- **Font**: Cairo (Arabic)

## Features

- ✅ Arabic RTL layout
- ✅ Mobile-first responsive design
- ✅ Secure cookie-based authentication
- ✅ Activities management
- ✅ Groups with label filtering
- ✅ Student enrollment
- ✅ Session attendance tracking
- ✅ Real-time grade calculations
- ✅ Bottom navigation for mobile
- ✅ White & blue theme matching church logo

## Project Structure

```
frontend/
├── app/
│   ├── (auth)/          # Login page
│   ├── (app)/           # Protected app pages
│   │   ├── activities/
│   │   ├── groups/
│   │   ├── sessions/
│   │   ├── reports/
│   │   ├── admin/
│   │   └── settings/
│   └── api/             # Next.js API routes (proxy to backend)
├── components/
│   ├── ui/              # shadcn/ui components
│   ├── layout/          # Navigation, TopBar
│   └── brand/           # Logo component
├── lib/
│   ├── api/             # API client & schemas
│   └── auth/            # Session utilities
└── types/               # TypeScript domain types
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Run production build
- `npm run lint` - Run ESLint

## Notes

- The frontend uses Next.js API routes as a secure proxy to the backend
- All authentication is handled via httpOnly cookies
- The app is optimized for mobile with bottom navigation
- RTL (right-to-left) is enabled by default for Arabic

## License

ISC
