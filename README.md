Listed directory MPC
Listed directory project-bolt-sb1-mipbayfi%20%281%29
Listed directory project
Viewed package.json:1-37
Viewed index.html:1-21
Listed directory src
Listed directory components
Listed directory pages
Listed directory admin
Listed directory user
Listed directory auth
Listed directory lib
Viewed types.ts:1-100
Viewed detection.ts:1-106
Viewed App.tsx:1-50
Created README.md

I have created a comprehensive, professional **`README.md`** tailored specifically for your project **RoadGuard — Intelligent Road Damage Detection & Municipal Portal**.

The file has been created in your repository at [`README.md`](file:///d:/download/MPC/project-bolt-sb1-mipbayfi%20%281%29/project/README.md).

Below is the complete content of the `README.md` for quick reference:

```markdown
# 🛡️ RoadGuard — Intelligent Road Damage Detection & Municipal Portal

[![React](https://img.shields.io/badge/React-18.3-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-5.4-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-Database%20%26%20Auth-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)
[![License](https://img.shields.io/badge/License-MIT-green.svg?style=for-the-badge)](LICENSE)

**RoadGuard** is an end-to-end, AI-powered road condition detection and municipal infrastructure management platform. It enables citizens and inspectors to capture road damage (potholes, cracks, surface wear) in real-time, tags precise GPS coordinates, computes a **Road Health Score**, and routes verified reports directly to city maintenance authorities.

---

## 🌟 Key Features

### 📱 User / Citizen Mobile Portal
* **AI Camera & File Upload**: Real-time camera capture with automatic bounding-box visualizer for damage detection.
* **Smart Detection & Classification**: Identifies 6 categories of road distress:
  * 🕳️ **Potholes**
  * ⚡ **Cracks** (Longitudinal, Fatigue, Transverse)
  * 🛣️ **Surface Wear & Raveling**
  * 📉 **Road Depressions / Ruts**
  * 🧱 **Broken Edges / Shoulder Damage**
  * 💧 **Water Damage / Drainage Issues**
* **Instant Severity & Health Indexing**: Calculates severity (`Low`, `Medium`, `High`, `Critical`), AI confidence rating (%), and overall Road Health Score (0–100 scale).
* **Geotagging & Maps**: Automatic geolocation tagging with interactive Google Maps interface.
* **Real-Time Tracking**: Monitor report progress through lifecycle states (`Submitted` → `Under Review` → `Maintenance Assigned` → `In Progress` → `Completed`).
* **In-App Notifications**: Real-time alerts when status or priority is updated by administrators.

### 🛡️ Admin & Municipal Portal
* **Command Center Dashboard**: High-level KPIs, total reports, high-priority counts, resolution throughput, and health trends.
* **Geospatial Map View**: Interactive map cluster and heatmaps showing critical road hazard locations.
* **Workflow & Dispatch Management**: Assign repair crews, set urgency (`Low`, `Normal`, `High`, `Urgent`), append official remarks, and change report status.
* **Data Analytics & Export**: Graphical breakdown of damage types, regional severity distribution, and CSV/PDF export tools for field teams.
* **User & Role Management**: Administrative controls for user status and security privileges.

---

## 🏗️ Architecture & Technology Stack

| Layer | Technology | Description |
|---|---|---|
| **Frontend Framework** | [React 18](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/) | Single-page application built with strict typings and modular component design |
| **Build Tool & HMR** | [Vite](https://vitejs.org/) | Lightning-fast development server and optimized production bundler |
| **Styling & UI** | [Tailwind CSS](https://tailwindcss.com/) + [Lucide Icons](https://lucide.dev/) | Utility-first CSS with dark/light themes, micro-animations, and clean UI components |
| **Geospatial Engine** | [Google Maps JavaScript API](https://developers.google.com/maps) | Dynamic map markers, custom info windows, and geolocation lookups |
| **Database & Auth** | [Supabase](https://supabase.com/) | PostgreSQL database with Row Level Security (RLS), Auth, & Storage buckets |
| **AI Computer Vision** | Custom Canvas Analysis Engine | Client-side pixel luminance & edge detection pipeline simulating YOLOv8 detection |

---

## ⚡ Quick Start

### 1. Prerequisites
Ensure you have the following installed on your machine:
* [Node.js](https://nodejs.org/) (v18.x or higher)
* [npm](https://www.npmjs.com/) (v9.x or higher)

### 2. Installation

Clone the repository and install dependencies:

```bash
git clone https://github.com/nishank1225/RoadGaurd.git
cd RoadGaurd/project-bolt-sb1-mipbayfi\ \(1\)/project
npm install
```

### 3. Environment Variables Setup

Create a `.env` file in the root of the React project directory (`project/`):

```env
VITE_SUPABASE_URL=https://your-supabase-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

*(Note: The app falls back to local storage mock mode if Supabase keys are not present).*

### 4. Running Development Server

Start the Vite development server:

```bash
npm run dev
```

Open your browser and navigate to `http://localhost:5173`.

---

## 🗄️ Database Schema & Edge Functions

RoadGuard utilizes a relational Supabase PostgreSQL schema equipped with **Row Level Security (RLS)**:

- `profiles` — Manages user accounts, roles (`user` | `admin`), and profile metadata.
- `reports` — Stores geotagged damage records, image URLs, severity levels, bounding box JSON, status, and remarks.
- `notifications` — Tracks status update alerts per user.

Supabase Edge Functions are located in `supabase/functions/`:
- `create-admin` — Secure bootstrap function to provision initial admin accounts.

To deploy Supabase migrations:
```bash
npx supabase db push
```

---

## 📂 Project Structure

```text
├── public/                     # Static assets & icons
├── src/
│   ├── components/             # Reusable UI components
│   │   ├── CameraCapture.tsx    # Live camera & bounding box tool
│   │   ├── DetectionCanvas.tsx # Canvas overlay for AI bounding boxes
│   │   ├── MapView.tsx         # Google Maps integration component
│   │   ├── Charts.tsx          # Analytical charts (Recharts/Custom)
│   │   └── ui/                 # Core design system components
│   ├── context/                # React Contexts (AuthContext, ThemeContext)
│   ├── lib/
│   │   ├── detection.ts        # AI Computer Vision & detection algorithm
│   │   ├── services.ts         # Supabase API services
│   │   ├── supabase.ts         # Supabase client initialization
│   │   └── types.ts            # TypeScript interfaces & enums
│   ├── pages/
│   │   ├── admin/              # Admin Dashboard, Reports, Analytics & Map
│   │   ├── auth/               # Login, Register, & Password Reset flow
│   │   └── user/               # User Home, Camera Capture, History & Map
│   ├── App.tsx                 # Core App routing & role gate keeper
│   └── main.tsx                # React root mount point
├── supabase/
│   ├── functions/              # Deno Edge Functions
│   └── migrations/             # SQL schema migrations
├── tailwind.config.js          # Tailwind CSS configuration
└── vite.config.ts              # Vite configuration
```

---

## 📊 AI Road Health Calculation Formula

RoadGuard determines road condition integrity using the formula:

$$\text{Road Health Score} = \max\left(5, \; 100 - \sum \text{Penalty}(\text{Severity}) \times \text{Damage Count}\right)$$

Where base penalties per detected damage area are:
- **Low Severity**: $-8$ pts
- **Medium Severity**: $-18$ pts
- **High Severity**: $-32$ pts
- **Critical Severity**: $-50$ pts

---

## 🤝 Contributing

Contributions are always welcome! 

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git checkout -b feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

---

<p align="center">
  Made with ❤️ for safer roads and smarter cities.
</p>
```
