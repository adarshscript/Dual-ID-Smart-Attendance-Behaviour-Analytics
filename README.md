# DIAS Attendance System

Next.js based Dual-ID Attendance System for your college project. This app includes:

- Landing page based on your shared design
- Admin login with reset secret key
- Admin dashboard, students, analytics
- Classroom live grid
- Student login and profile
- Firebase Realtime Database sync
- Floating AI chatbot on all pages

## 1. VS Code Terminal Commands

Run these commands inside:

```powershell
cd "C:\Users\Adarsh Maurya\OneDrive\Documents\DIAS"
npm install
npm run dev
```

Then open:

- `http://localhost:3000`

## 2. Project Structure

```text
DIAS/
├─ package.json
├─ tsconfig.json
├─ next.config.ts
├─ src/
│  ├─ app/
│  │  ├─ admin/
│  │  │  ├─ analytics/page.tsx
│  │  │  ├─ dashboard/page.tsx
│  │  │  ├─ login/page.tsx
│  │  │  └─ students/page.tsx
│  │  ├─ classroom/page.tsx
│  │  ├─ student/[roll]/page.tsx
│  │  ├─ globals.css
│  │  ├─ layout.tsx
│  │  ├─ loading.tsx
│  │  └─ page.tsx
│  ├─ components/
│  │  ├─ admin/
│  │  ├─ chatbot/
│  │  ├─ layout/
│  │  ├─ shared/
│  │  └─ student/
│  ├─ hooks/use-dias-data.ts
│  └─ lib/
│     ├─ attendance.ts
│     ├─ auth.ts
│     ├─ chatbot.ts
│     ├─ export.ts
│     ├─ firebase.ts
│     ├─ firebase-queries.ts
│     ├─ fonts.ts
│     ├─ format.ts
│     └─ types.ts
└─ README.md
```

## 3. Login Details

- Admin username: `admin`
- Default password: `dias2024`
- Reset secret key: `DIAS-ADMIN-RESET-8055`

## 4. Student Login Rule

Currently for demo:

- Username field: student first name
- Password field: same student roll number

You can later replace this with Firebase Authentication or a custom `studentCredentials` node.

## 5. Firebase Nodes Used

The app reads these nodes:

- `users`
- `attendance`
- `holidays`
- `notifications`

### Expected `users` example

```json
{
  "name": "Adarsh",
  "roll": "4",
  "department": "Computer Science",
  "email": "adarsh@dias.edu",
  "phone": "",
  "rfidTag": "RF004",
  "fingerprintId": "FP004",
  "createdAt": "2026-04-02T08:00:00.000Z"
}
```

### Expected `attendance` example

```json
{
  "name": "Adarsh",
  "roll": "4",
  "datetime": "2026-04-02T13:30:20.000Z",
  "status": "ENTRY"
}
```

## 6. Images and Icons

This version is made mostly with CSS, gradients, icons, and glassmorphism so you do not need extra images immediately.

If later you want to add your own images:

- create `public/images/`
- put files there
- then use paths like `/images/your-image.png`

## 7. Important Note

This is a strong project base and already matches your requested flow, but if you want the design to become even closer to each screenshot pixel-by-pixel, we can next do a second pass only for UI polishing page by page.
