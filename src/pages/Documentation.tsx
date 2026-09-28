import { useEffect } from 'react';
import { ArrowLeft, Printer, ShieldCheck } from 'lucide-react';

export function Documentation({ onBack }: { onBack: () => void }) {
  useEffect(() => {
    const styleId = 'doc-print-styles';
    if (document.getElementById(styleId)) return;
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      @media print {
        body * { visibility: hidden !important; }
        .doc-print-area, .doc-print-area * { visibility: visible !important; }
        .doc-print-area { position: absolute; left: 0; top: 0; width: 100%; padding: 0 !important; }
        .doc-no-print { display: none !important; }
        .doc-page { page-break-after: always; }
        .doc-page:last-child { page-break-after: auto; }
        .doc-avoid-break { page-break-inside: avoid; }
      }
    `;
    document.head.appendChild(style);
  }, []);

  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className="doc-page mb-8">
      <h1 className="text-2xl font-bold text-primary-700 dark:text-primary-300 border-b-3 border-primary-500 pb-2 mb-4" style={{ borderBottom: '3px solid var(--primary, #2563eb)' }}>
        {title}
      </h1>
      <div className="space-y-3 text-sm leading-relaxed">{children}</div>
    </div>
  );

  const Card = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className="doc-avoid-break surface border border-base rounded-xl p-4 mb-3">
      <div className="font-bold text-primary-700 dark:text-primary-300 mb-2">{title}</div>
      <div className="text-sm">{children}</div>
    </div>
  );

  const Table = ({ headers, rows }: { headers: string[]; rows: React.ReactNode[][] }) => (
    <div className="doc-avoid-break overflow-x-auto mb-4">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr>
            {headers.map((h, i) => (
              <th key={i} className="text-left px-3 py-2 font-semibold text-white bg-primary-800 dark:bg-primary-700 rounded-t-lg" style={{ background: '#1e3a8a' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className={i % 2 === 0 ? '' : 'bg-slate-50 dark:bg-slate-800/50'}>
              {row.map((cell, j) => (
                <td key={j} className="px-3 py-2 border-b border-base align-top">{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const Badge = ({ color, children }: { color: string; children: React.ReactNode }) => (
    <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold" style={{ background: color === 'green' ? '#d1fae5' : color === 'amber' ? '#fef3c7' : color === 'red' ? '#fee2e2' : color === 'blue' ? '#dbeafe' : '#ede9fe', color: color === 'green' ? '#065f46' : color === 'amber' ? '#92400e' : color === 'red' ? '#991b1b' : color === 'blue' ? '#1e3a8a' : '#5b21b6' }}>{children}</span>
  );

  const Flow = ({ steps }: { steps: { title: string; desc: string }[] }) => (
    <div className="space-y-0 my-4">
      {steps.map((step, i) => (
        <div key={i} className="flex items-start gap-3 relative">
          <div className="flex-shrink-0 w-9 h-9 rounded-full bg-primary-600 text-white flex items-center justify-center font-bold text-sm z-10">{i + 1}</div>
          <div className="pt-1 pb-4">
            <div className="font-semibold text-sm">{step.title}</div>
            <div className="text-xs text-muted">{step.desc}</div>
          </div>
          {i < steps.length - 1 && <div className="absolute left-[18px] top-9 bottom-0 w-0.5 bg-slate-300 dark:bg-slate-600" />}
        </div>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen surface">
      {/* Header bar */}
      <div className="doc-no-print sticky top-0 z-50 glass border-b border-base px-4 py-3 flex items-center justify-between">
        <button onClick={onBack} className="btn btn-ghost text-sm">
          <ArrowLeft size={18} /> Back to App
        </button>
        <div className="flex items-center gap-2 text-sm font-semibold">
          <ShieldCheck size={20} className="text-primary-600" />
          RoadGuard Documentation
        </div>
        <button onClick={() => window.print()} className="btn btn-primary text-sm">
          <Printer size={18} /> Print / Save as PDF
        </button>
      </div>

      {/* Print area */}
      <div className="doc-print-area max-w-4xl mx-auto px-6 py-8">

        {/* Cover */}
        <div className="doc-page min-h-[600px] rounded-2xl p-12 flex flex-col justify-between text-white mb-8" style={{ background: 'linear-gradient(160deg, #1e3a8a 0%, #2563eb 55%, #3b82f6 100%)' }}>
          <div>
            <div className="w-16 h-16 rounded-2xl bg-white/15 flex items-center justify-center mb-6">
              <ShieldCheck size={32} />
            </div>
            <div className="inline-block px-4 py-1.5 rounded-full bg-white/15 text-xs font-semibold tracking-wide mb-4">PROJECT DOCUMENTATION</div>
            <h1 className="text-5xl font-extrabold tracking-tight mb-2">RoadGuard</h1>
            <p className="text-xl opacity-85 mb-4">ML-Powered Road Damage Detection System</p>
            <p className="text-base opacity-65 max-w-lg leading-relaxed">
              A civic-tech platform that empowers citizens to report road damage through AI-powered
              image analysis, enabling administrators to verify, triage, and escalate issues to civic
              authorities for timely road maintenance.
            </p>
          </div>
          <div className="text-sm opacity-70 space-y-1 mt-8">
            <div><strong>Document Type:</strong> Full Technical &amp; Functional Overview</div>
            <div><strong>Stack:</strong> React + TypeScript + Vite + Supabase + ONNX Runtime Web</div>
            <div><strong>Version:</strong> 1.0 &nbsp;|&nbsp; <strong>Date:</strong> August 2026</div>
          </div>
        </div>

        {/* Table of Contents */}
        <Section title="Table of Contents">
          <ol className="list-decimal pl-6 space-y-1">
            <li>Project Overview</li>
            <li>Technology Stack</li>
            <li>System Architecture</li>
            <li>User Roles &amp; Access Control</li>
            <li>User Application — Features &amp; Screens</li>
            <li>Admin Console — Features &amp; Screens</li>
            <li>AI / ML Detection Pipeline</li>
            <li>Database Schema &amp; Data Model</li>
            <li>Security Model &amp; RLS Policies</li>
            <li>Authentication System</li>
            <li>Realtime Updates, Storage, Notifications &amp; Export</li>
            <li>Project File Structure</li>
            <li>Environment &amp; Configuration</li>
          </ol>
        </Section>

        {/* 1. Project Overview */}
        <Section title="1. Project Overview">
          <p><strong>RoadGuard</strong> is a civic-technology web application that bridges the gap between citizens and road maintenance authorities. It allows anyone to photograph road damage from their phone, automatically analyzes the image using an AI object-detection model running directly in the browser, and submits a structured report to administrators for verification and escalation.</p>

          <h3 className="font-bold text-base mt-4 mb-2">Problem Statement</h3>
          <p>Potholes, cracks, and road surface deterioration cause vehicle damage, accidents, and commuter frustration. Traditional complaint mechanisms — phone calls, physical visits to municipal offices — are slow, opaque, and lack photographic evidence. RoadGuard replaces this with a transparent, data-driven, mobile-first workflow.</p>

          <h3 className="font-bold text-base mt-4 mb-2">Solution — Three Core Capabilities</h3>
          <Card title="AI-Powered Damage Detection">
            A YOLOv8 model runs in-browser via ONNX Runtime Web, identifying damage type, location, and severity from a single photo — no server round-trip required.
          </Card>
          <Card title="Structured Reporting Workflow">
            Each report carries GPS coordinates, a road health score, deterioration risk, maintenance priority, and a spatial severity grid, giving administrators actionable data instead of vague complaints.
          </Card>
          <Card title="Admin Verification &amp; Authority Escalation">
            Administrators review, approve, reject, and escalate verified reports to civic authorities (BBMP) with reference numbers and tracking.
          </Card>

          <h3 className="font-bold text-base mt-4 mb-2">Key Differentiators</h3>
          <div className="grid grid-cols-2 gap-3">
            <Card title="On-Device Inference">The ML model runs entirely in the user's browser using WebAssembly — no GPU server, no API costs, and images never leave the device until submission.</Card>
            <Card title="Rich Telemetry">Every report includes confidence scores, bounding boxes, a 3×3 spatial severity grid, deterioration risk probability, and a computed road health score (0-100).</Card>
            <Card title="Realtime Sync">Supabase Realtime pushes database changes to all connected clients instantly — admins see new reports the moment they're submitted.</Card>
            <Card title="Authority Escalation">Verified reports can be escalated to BBMP with auto-generated reference numbers and full status tracking.</Card>
          </div>

          <h3 className="font-bold text-base mt-4 mb-2">Target Users</h3>
          <Table headers={['Role', 'Who', 'What They Do']} rows={[
            [<Badge color="blue">User</Badge>, 'Citizens, drivers, residents', 'Capture road damage photos, review AI analysis, submit reports, track status, escalate to authorities'],
            [<Badge color="purple">Admin</Badge>, 'Municipal staff, system operators', 'Review & verify reports, manage users, view analytics, escalate to BBMP, configure system settings'],
          ]} />
        </Section>

        {/* 2. Technology Stack */}
        <Section title="2. Technology Stack">
          <Table headers={['Layer', 'Technology', 'Why']} rows={[
            ['Frontend Framework', 'React 18 + TypeScript', 'Component-based UI with type safety. Hooks for state management, context for global state (auth, theme).'],
            ['Build Tool', 'Vite 5', 'Fast HMR dev server, optimized production builds, ES module native support.'],
            ['Styling', 'Tailwind CSS 3.4', 'Utility-first CSS for rapid, consistent design. Custom theme with 6 color ramps, dark mode support, 8px spacing system.'],
            ['Icons', 'Lucide React', 'Lightweight, tree-shakeable SVG icon library used throughout for nav, buttons, and status indicators.'],
            ['Backend / BaaS', 'Supabase', 'Postgres database, authentication, file storage, realtime subscriptions, edge functions — all in one platform.'],
            ['AI / ML', 'ONNX Runtime Web 1.18', 'Runs YOLOv8 model in-browser via WebAssembly. No server inference needed. Falls back to heuristic analysis if model is absent.'],
            ['Maps', 'Leaflet + OpenStreetMap', 'Free, open-source interactive maps. No API key required. Custom markers with pulsing animations for critical damage.'],
            ['Charts', 'Custom SVG components', 'Hand-built line, bar, donut, and progress bar charts. No chart library dependency — full control over styling.'],
            ['Geocoding', 'Nominatim (OpenStreetMap)', 'Free reverse geocoding API to convert GPS coordinates to human-readable addresses.'],
          ]} />

          <h3 className="font-bold text-base mt-4 mb-2">Package Dependencies</h3>
          <pre className="surface-2 rounded-lg p-4 text-xs overflow-x-auto border border-base"><code>{`{
  "dependencies": {
    "@supabase/supabase-js": "^2.57.4",   // Supabase client SDK
    "lucide-react": "^0.446.0",           // Icon library
    "onnxruntime-web": "^1.18.0",          // In-browser ML inference
    "react": "^18.3.1",                    // UI framework
    "react-dom": "^18.3.1"                 // React DOM renderer
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.3.1",      // Vite React plugin
    "tailwindcss": "^3.4.1",               // CSS framework
    "typescript": "^5.5.3",                // Type checking
    "vite": "^5.4.2"                        // Build tool
  }
}`}</code></pre>

          <div className="doc-avoid-break border-l-4 border-primary-500 bg-primary-50 dark:bg-primary-900/20 p-3 rounded-r-lg mt-4 text-sm">
            <strong>Design Philosophy:</strong> No UI component library (Material UI, Ant Design, etc.) is used. All UI components — cards, buttons, badges, modals, charts — are built from scratch with Tailwind CSS. This keeps the bundle small and gives complete control over the visual design.
          </div>
        </Section>

        {/* 3. System Architecture */}
        <Section title="3. System Architecture">
          <p>RoadGuard follows a <strong>client-server architecture</strong> where the browser is the primary compute surface for AI inference, and Supabase serves as the managed backend for data persistence, authentication, file storage, and realtime communication.</p>

          <h3 className="font-bold text-base mt-4 mb-2">High-Level Data Flow</h3>
          <Flow steps={[
            { title: 'User captures photo', desc: 'Browser camera API or file upload → image File object' },
            { title: 'GPS capture (parallel)', desc: 'Browser Geolocation API → coordinates + reverse geocoded address via Nominatim' },
            { title: 'AI inference (in-browser)', desc: 'Image → letterbox to 640×640 → ONNX tensor → YOLOv8 forward pass → raw detections' },
            { title: 'Postprocessing & scoring', desc: 'NMS → bounding boxes → severity score → grid map → deterioration risk → health score' },
            { title: 'User reviews & submits', desc: 'Detection canvas + metrics displayed → user confirms → image uploaded to Supabase Storage' },
            { title: 'Report persisted & admins notified', desc: 'Report row inserted → audit log written → notifications created for all active admins' },
            { title: 'Admin reviews & acts', desc: 'Admin sees report via Realtime → verifies/rejects → status update → user notified → optionally escalates to BBMP' },
          ]} />

          <h3 className="font-bold text-base mt-4 mb-2">Architecture Diagram</h3>
          <pre className="surface-2 rounded-lg p-4 text-xs overflow-x-auto border border-base"><code>{`┌─────────────────────────────────────────────────────┐
│                    USER BROWSER                       │
│                                                       │
│  ┌──────────┐  ┌───────────┐  ┌───────────────────┐  │
│  │ Camera /  │  │ Geolocation│  │  ONNX Runtime Web  │  │
│  │ Upload    │  │   API     │  │  (YOLOv8 in WASM)  │  │
│  └────┬─────┘  └─────┬─────┘  └────────┬──────────┘  │
│       └───────┬───────┘                  │           │
│               ▼                          ▼           │
│        ┌──────────────────────────────────────┐      │
│        │       Detection Pipeline              │      │
│        │  preprocess → infer → NMS → score    │      │
│        └──────────────────┬───────────────────┘      │
│                           ▼                          │
│        ┌──────────────────────────────────────┐      │
│        │  Review UI (canvas + metrics + GPS)  │      │
│        └──────────────────┬───────────────────┘      │
│                           ▼                          │
│        ┌──────────────────────────────────────┐      │
│        │  Supabase JS Client (auth + DB +     │      │
│        │  storage + realtime)                 │      │
│        └──────────────────┬───────────────────┘      │
└───────────────────────────┼──────────────────────────┘
                            │  HTTPS / WebSocket
                            ▼
┌─────────────────────────────────────────────────────┐
│                    SUPABASE CLOUD                      │
│                                                       │
│  ┌─────────┐  ┌──────────┐  ┌─────────┐  ┌────────┐ │
│  │ Postgres│  │   Auth   │  │ Storage │  │Realtime│ │
│  │ (RLS)   │  │ (JWT)    │  │ (S3)    │  │(WS)    │ │
│  └─────────┘  └──────────┘  └─────────┘  └────────┘ │
│                                                       │
│  ┌──────────────────────────────────────┐           │
│  │  Edge Function: create-admin          │           │
│  │  (auto-provisions default admin)       │           │
│  └──────────────────────────────────────┘           │
└─────────────────────────────────────────────────────┘`}</code></pre>
        </Section>

        {/* 4. User Roles */}
        <Section title="4. User Roles & Access Control">
          <p>RoadGuard has two user roles. The role is stored in the <code className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-primary-700 dark:text-primary-300 text-xs">profiles</code> table and determines which application shell the user sees after login.</p>

          <Card title="Regular Citizen / Driver (User)">
            <ul className="list-disc pl-5 space-y-1">
              <li>Can create road damage reports with AI analysis</li>
              <li>Can view their own reports and their status</li>
              <li>Can see their reports on an interactive map</li>
              <li>Can edit their profile (name, phone, avatar)</li>
              <li>Can receive notifications when admin acts on their report</li>
              <li>Can escalate verified reports to civic authorities (BBMP)</li>
              <li>Subject to a configurable daily report submission limit</li>
              <li><strong>Cannot</strong> see other users' reports or the admin console</li>
            </ul>
          </Card>

          <Card title="System Administrator / Municipal Operator (Admin)">
            <ul className="list-disc pl-5 space-y-1">
              <li>Can see all reports from all users</li>
              <li>Can verify (approve) or reject reports</li>
              <li>Can update report status through the full lifecycle</li>
              <li>Can manage users (activate/deactivate, promote to admin, delete)</li>
              <li>Can view system-wide analytics and dashboards</li>
              <li>Can escalate reports to BBMP as formal complaints</li>
              <li>Can configure the daily report limit for all users</li>
              <li>Can export reports as CSV or PDF</li>
              <li>Receives notifications when new reports are submitted</li>
            </ul>
          </Card>

          <h3 className="font-bold text-base mt-4 mb-2">Routing Logic</h3>
          <pre className="surface-2 rounded-lg p-4 text-xs overflow-x-auto border border-base"><code>{`if (state === 'loading')         → Show loading spinner
if (state === 'unauthenticated') → Show login/register screen
if (profile.role === 'admin')    → Render AdminApp
else                             → Render UserApp`}</code></pre>

          <div className="doc-avoid-break border-l-4 border-amber-500 bg-amber-50 dark:bg-amber-900/20 p-3 rounded-r-lg mt-4 text-sm">
            <strong>Defense in Depth:</strong> Access control is enforced at <em>two layers</em>:
            <ol className="list-decimal pl-5 mt-1">
              <li><strong>UI layer</strong> — the app only renders admin screens for admin-role users</li>
              <li><strong>Database layer</strong> — Supabase Row Level Security (RLS) policies enforce that users can only read/write their own data, and admin-only operations use SECURITY DEFINER functions that check <code>is_admin()</code> internally</li>
            </ol>
          </div>
        </Section>

        {/* 5. User Application */}
        <Section title="5. User Application — Features & Screens">
          <p>The user app uses a mobile-first layout with a sticky header and a bottom navigation bar with 5 tabs. The header shows the RoadGuard logo, the user's role, theme toggle, notification bell (with unread badge), avatar, and sign-out button.</p>

          <h3 className="font-bold text-base mt-4 mb-2">5.1 Home Dashboard</h3>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Hero greeting card</strong> — gradient blue banner with time-based greeting, user's name, simulated weather, and GPS coordinates</li>
            <li><strong>Road Health Score</strong> — computed as (approved reports / total reports) × 100</li>
            <li><strong>"New Report" button</strong> — quick access to the camera/report flow</li>
            <li><strong>4 stat cards</strong> — Total Reports, Pending, Verified, Critical — each with an icon, color-coded accent, and staggered entrance animation</li>
            <li><strong>Severity Distribution donut chart</strong> — shows count of reports by severity (low/medium/high/critical)</li>
            <li><strong>Road Condition Summary</strong> — three progress bars: Road Health, Verified Rate, Critical Rate, each color-coded by threshold</li>
            <li><strong>Recent Detections grid</strong> — last 6 reports shown as cards with thumbnail, severity badge, damage type, confidence %, time-ago, and status badge</li>
          </ul>

          <h3 className="font-bold text-base mt-4 mb-2">5.2 Interactive Map</h3>
          <ul className="list-disc pl-5 space-y-1">
            <li>Full-screen Leaflet map centered on the user's GPS location</li>
            <li>Color-coded markers: <Badge color="green">green</Badge> low, <Badge color="amber">amber</Badge> medium, <Badge color="red">red</Badge> critical</li>
            <li>Critical markers have a pulsing CSS animation ring for visual urgency</li>
            <li>Clicking a marker opens a popup with: thumbnail photo, damage type, severity badge, status badge, confidence %, and date</li>
            <li>Map tiles from OpenStreetMap (no API key needed)</li>
          </ul>

          <h3 className="font-bold text-base mt-4 mb-2">5.3 Report Creation Flow (Core Feature)</h3>
          <p>The most important feature. It guides the user through 5 stages:</p>
          <Flow steps={[
            { title: 'Capture Stage', desc: 'Take Photo (camera via getUserMedia with rear-facing preference) or Upload Image (file picker). Shows daily report limit gauge. If limit reached, both options disabled.' },
            { title: 'Analyzing Stage', desc: 'Animated loading screen. In background: GPS captured (15s timeout), reverse geocoded via Nominatim, and analyzeImage() runs the full ML pipeline. Typically 200-800ms.' },
            { title: 'Review Stage', desc: 'Most information-dense screen. Shows image with bounding boxes, damage type, severity badge, confidence %, road health score, prediction time, damage breakdown, severity score, maintenance priority, deterioration risk, 3×3 spatial grid, GPS location + address, and maintenance recommendation.' },
            { title: 'Uploading Stage', desc: 'Image uploaded to Supabase Storage (reports bucket), report row inserted with all ML data, audit log written, all active admins notified.' },
            { title: 'Done Stage', desc: 'Green confirmation screen. User can start a new report or go to history.' },
          ]} />

          <h4 className="font-semibold mt-3 mb-1">Review Screen — Data Shown to User</h4>
          <Table headers={['Field', 'Description', 'Example']} rows={[
            ['Detection Canvas', 'Image with colored bounding boxes drawn over detected damage', 'Red box over a pothole'],
            ['Damage Type', 'Primary damage class detected', 'Pothole'],
            ['Severity', 'Color-coded badge (low/medium/high/critical)', <Badge color="red">Critical</Badge>],
            ['Confidence', "Model's confidence in the detection (0-100%)", '87.3%'],
            ['Road Health Score', 'Computed 0-100 (higher = healthier)', '42'],
            ['Prediction Time', 'Milliseconds taken for inference', '340 ms'],
            ['Detections', 'Number of bounding boxes found', '3'],
            ['Damage Breakdown', 'Count of potholes, cracks, edge damage', '2 potholes, 1 crack'],
            ['Severity Score', 'Numeric 0-5 score', '4.2 / 5'],
            ['Maintenance Priority', 'low / normal / high / urgent', <Badge color="red">Urgent</Badge>],
            ['Deterioration Risk', '0-100% probability bar', '78%'],
            ['Spatial Severity Map', '3×3 grid with color intensity per cell', 'Visual grid'],
            ['GPS Location', 'Coordinates + reverse-geocoded address + OSM link', '12.97, 77.59'],
            ['Maintenance Recommendation', 'Text based on severity', 'Immediate repair required'],
          ]} />

          <h3 className="font-bold text-base mt-4 mb-2">5.4 Report History</h3>
          <p>Shows all of the user's past reports in a vertical list with thumbnail, damage type, severity badge, status badge, confidence, health score, date, and location. Clicking opens the full Report Detail view with bounding boxes, all ML metrics, spatial grid, deterioration risk, and the complete status timeline. If the report is "approved," the user can escalate to BBMP.</p>

          <h3 className="font-bold text-base mt-4 mb-2">5.5 User Profile</h3>
          <ul className="list-disc pl-5 space-y-1">
            <li>Avatar (circular display of initials or uploaded photo)</li>
            <li>Editable full name and phone number</li>
            <li>Email (display only, linked to auth)</li>
            <li>Member since date and report statistics</li>
            <li>Dark mode toggle and sign out button</li>
          </ul>

          <h4 className="font-semibold mt-3 mb-1">Notifications Panel</h4>
          <p>Accessible via the bell icon in the header (with unread count badge). Slide-in panel listing 20 most recent notifications with type icon, title, body, time-ago, and read/unread indicator. Updates in realtime via Supabase Realtime subscriptions.</p>
        </Section>

        {/* 6. Admin Console */}
        <Section title="6. Admin Console — Features & Screens">
          <p>The admin app uses a sidebar layout on desktop (fixed 240px sidebar) and a bottom navigation bar on mobile. It has 6 sections:</p>

          <h3 className="font-bold text-base mt-4 mb-2">6.1 Admin Dashboard</h3>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Live sync indicator</strong> — pulsing green dot showing realtime connection is active</li>
            <li><strong>8 stat cards</strong> — Total Users, Active Users, Today's Reports, Pending, Verified, Rejected, Critical Roads, Avg Severity</li>
            <li><strong>7-day Reports Trend</strong> — line chart showing daily report counts for the past week</li>
            <li><strong>Status Distribution donut</strong> — pending vs approved vs rejected vs other</li>
            <li><strong>System Monitoring panel</strong> — ML Server (Online), API Response (124ms), Storage (42% used), Database (Healthy)</li>
            <li><strong>Pending Verification Queue</strong> — list of up to 5 pending reports with thumbnail, type, reporter, time, severity, and confidence</li>
          </ul>

          <h3 className="font-bold text-base mt-4 mb-2">6.2 Report Management</h3>
          <ul className="list-disc pl-5 space-y-1">
            <li>Search bar — filter by damage type or reporter name</li>
            <li>Status filter dropdown — all / submitted / pending / under_review / approved / rejected / etc.</li>
            <li>Severity filter dropdown — all / low / medium / high / critical</li>
            <li>CSV Export button — downloads filtered reports as CSV</li>
            <li>Daily Report Limit control — admin can change per-user daily submission limit (1-1000)</li>
            <li>Report cards — thumbnail, type, reporter, date, severity, status, confidence, health score, location. Clicking opens full Report Detail view.</li>
          </ul>
          <p>In the Report Detail view, admins can: view full image with detection boxes, see all ML metrics, change report status (approve, reject, assign maintenance, mark in progress, complete, close), add admin remarks, view reporter info, escalate to BBMP. Every status change writes an audit log entry and notifies the report owner.</p>

          <h3 className="font-bold text-base mt-4 mb-2">6.3 Authority Complaints</h3>
          <p>Manages formal complaints escalated to BBMP. When an admin escalates an approved report, a complaint record is created with authority details (BBMP name, email, phone, helpline, website, address), complaint fields (subject, message, GPS, location), auto-generated reference number, and link to the original report.</p>
          <p>Complaint status lifecycle: <strong>Draft → Lodged → Acknowledged → Resolved</strong> (or <strong>Rejected</strong>)</p>

          <h3 className="font-bold text-base mt-4 mb-2">6.4 User Management</h3>
          <ul className="list-disc pl-5 space-y-1">
            <li>Search users by name or email</li>
            <li>User list with avatar, name, email, role badge, active status, join date, report count</li>
            <li>Activate/Deactivate — toggle is_active to enable/disable access</li>
            <li>Promote to Admin — change role from "user" to "admin"</li>
            <li>Delete User — permanently removes user and all their data: reports, photos, notifications, complaints, audit logs, and auth account (via SECURITY DEFINER function)</li>
            <li>Create User — admin can create a new user account</li>
          </ul>

          <h3 className="font-bold text-base mt-4 mb-2">6.5 Admin Map</h3>
          <p>Same interactive Leaflet map as the user version, but shows <strong>all reports across all users</strong> with the same color-coded markers, popups, and critical-pulsing animations.</p>

          <h3 className="font-bold text-base mt-4 mb-2">6.6 Analytics</h3>
          <ul className="list-disc pl-5 space-y-1">
            <li>4 summary cards — Avg Confidence, Avg Health Score, Verification Rate, Total Users</li>
            <li>Monthly Reports line chart — 6-month trend of report volumes</li>
            <li>Damage Categories bar chart — count of reports per damage type</li>
            <li>Severity Distribution donut chart — low/medium/high/critical breakdown</li>
            <li>Prediction Accuracy by Type — per-damage-type average confidence with progress bars</li>
          </ul>
        </Section>

        {/* 7. AI/ML Pipeline */}
        <Section title="7. AI / ML Detection Pipeline">
          <p>The detection pipeline is the technical heart of RoadGuard. It runs entirely in the browser using ONNX Runtime Web, with a heuristic fallback when no model file is deployed.</p>

          <h3 className="font-bold text-base mt-4 mb-2">7.1 Image Preprocessing</h3>
          <ol className="list-decimal pl-5 space-y-1">
            <li><strong>Letterbox resize</strong> — image scaled to fit within 640×640 while maintaining aspect ratio. Padding (dark gray #114) fills remaining space.</li>
            <li><strong>Canvas rendering</strong> — scaled image drawn onto off-screen canvas at exactly 640×640.</li>
            <li><strong>Pixel extraction</strong> — getImageData() reads all pixels as RGBA values.</li>
            <li><strong>Tensor conversion</strong> — pixels rearranged into CHW format: Channel 0 (R), Channel 1 (G), Channel 2 (B), each normalized to [0,1] by dividing by 255.</li>
            <li><strong>Scale &amp; pad offsets</strong> — saved to map detection boxes back to original image coordinates later.</li>
          </ol>
          <pre className="surface-2 rounded-lg p-4 text-xs overflow-x-auto border border-base mt-2"><code>{`// Output: Float32Array of size 3 × 640 × 640 = 1,228,800 values
// Shape: [1, 3, 640, 640]  (batch=1, channels=3, H=640, W=640)`}</code></pre>

          <h3 className="font-bold text-base mt-4 mb-2">7.2 ONNX Inference</h3>
          <p>The YOLOv8 model is loaded lazily from <code>/models/yolov8_pothole.onnx</code>. The app first does a HEAD request to check if the file exists. If it does, an InferenceSession is created with WASM execution provider and full graph optimization.</p>
          <pre className="surface-2 rounded-lg p-4 text-xs overflow-x-auto border border-base"><code>{`const session = await ort.InferenceSession.create(MODEL_URL, {
  executionProviders: ['wasm'],
  graphOptimizationLevel: 'all',
});

const feeds = {
  [inputName]: new ort.Tensor('float32', tensor, [1, 3, 640, 640])
};

const results = await session.run(feeds);
// Output shape: [1, 4+num_classes, 8400] or [1, 8400, 4+num_classes]`}</code></pre>
          <p>The model detects 6 damage classes: <code>pothole, crack, surface_wear, road_depression, broken_edge, water_damage</code>.</p>

          <h3 className="font-bold text-base mt-4 mb-2">7.3 Postprocessing (Non-Maximum Suppression)</h3>
          <p>The raw model output contains 8,400 anchor predictions. Each anchor has 4 bounding box coordinates (cx, cy, width, height) plus 6 class confidence scores. Postprocessing:</p>
          <ol className="list-decimal pl-5 space-y-1">
            <li><strong>Parse output</strong> — handles both transposed [1, 4+NC, 8400] and non-transposed [1, 8400, 4+NC] formats.</li>
            <li><strong>Best class per anchor</strong> — for each of 8,400 anchors, find the highest class score.</li>
            <li><strong>Confidence filter</strong> — discard anchors below 0.25 (25%) confidence threshold.</li>
            <li><strong>Coordinate mapping</strong> — convert from 640×640 letterboxed space back to original image space, then normalize to [0,1].</li>
            <li><strong>Non-Maximum Suppression (NMS)</strong> — sort remaining boxes by score, greedily keep the highest, remove overlapping boxes with IoU above 0.45. Prevents duplicate detections.</li>
          </ol>

          <h3 className="font-bold text-base mt-4 mb-2">7.4 Scoring Algorithms</h3>
          <p>After bounding boxes are extracted, several metrics are computed:</p>

          <h4 className="font-semibold mt-3 mb-1">Damage Type Weights</h4>
          <Table headers={['Damage Type', 'Weight', 'Rationale']} rows={[
            ['Pothole', '5', 'Highest risk — can cause tire damage and accidents'],
            ['Road Depression', '4', 'Structural issue — can worsen into pothole'],
            ['Broken Edge', '4', 'Compromises road integrity at margins'],
            ['Crack', '3', 'Allows water ingress — leads to further damage'],
            ['Water Damage', '3', 'Indicates drainage or surface failure'],
            ['Surface Wear', '2', 'Lowest risk — cosmetic degradation'],
          ]} />

          <h4 className="font-semibold mt-3 mb-1">Severity Score (0-5)</h4>
          <pre className="surface-2 rounded-lg p-4 text-xs overflow-x-auto border border-base"><code>{`severityScore = (Σ(weight × confidence) / numBoxes) + min(numBoxes, 5) × 0.2
// Capped at 5.0`}</code></pre>
          <Table headers={['Score Range', 'Severity']} rows={[
            ['≥ 4.0', <Badge color="red">Critical</Badge>],
            ['2.8 - 3.9', <Badge color="amber">High</Badge>],
            ['1.5 - 2.7', <Badge color="amber">Medium</Badge>],
            ['< 1.5', <Badge color="green">Low</Badge>],
          ]} />

          <h4 className="font-semibold mt-3 mb-1">Spatial Severity Grid (3×3)</h4>
          <p>The image is divided into a 3×3 grid. Each detected bounding box is assigned to the grid cell containing its center. Each cell accumulates <code>weight × confidence</code> for all boxes in it, producing a spatial heat map of where damage is concentrated.</p>

          <h4 className="font-semibold mt-3 mb-1">Deterioration Risk (0-1)</h4>
          <pre className="surface-2 rounded-lg p-4 text-xs overflow-x-auto border border-base"><code>{`deteriorationRisk = min(1, severityScore × 0.5
                        + min(damageCount, 8) × 0.08
                        + maxGridSeverity × 0.05)`}</code></pre>
          <p>Represents the probability that the road condition will worsen if not repaired. Combines overall severity, number of distinct damages, and spatial concentration.</p>

          <h4 className="font-semibold mt-3 mb-1">Maintenance Priority</h4>
          <pre className="surface-2 rounded-lg p-4 text-xs overflow-x-auto border border-base"><code>{`composite = severityScore × 0.6
           + deteriorationRisk × 2
           + min(damageCount, 5) × 0.15

composite ≥ 4.5 → Urgent
composite ≥ 3.5 → High
composite ≥ 2.0 → Normal
composite <  2.0 → Low`}</code></pre>

          <h4 className="font-semibold mt-3 mb-1">Road Health Score (0-100)</h4>
          <pre className="surface-2 rounded-lg p-4 text-xs overflow-x-auto border border-base"><code>{`penalty = severityPenalty × damageCount + severityScore × 2
healthScore = max(5, 100 - penalty)

// Severity penalties:
//   low: 8, medium: 18, high: 32, critical: 50`}</code></pre>
          <p>A single number representing overall road condition. 100 = pristine, 5 = severely damaged. Used on dashboards and maps for quick visual assessment.</p>

          <h3 className="font-bold text-base mt-4 mb-2">7.5 Heuristic Fallback</h3>
          <p>If the ONNX model file is not deployed (HEAD request returns non-200 or session fails to create), the app falls back to a <strong>heuristic analyzer</strong> using pixel-level analysis:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Dark pixel ratio</strong> — counts pixels with luminance &lt; 80 (dark spots indicate potholes/shadows)</li>
            <li><strong>Edge pixel ratio</strong> — counts adjacent pixels with luminance difference &gt; 45 (indicates cracks/edges)</li>
            <li><strong>Damage type</strong> — if dark ratio &gt; 15%, classified as "pothole"; otherwise deterministic hash-based selection from all 6 types</li>
            <li><strong>Confidence</strong> — base 0.55 + darkRatio × 0.6 + edgeRatio × 0.4, clamped to [0.4, 0.98]</li>
            <li><strong>Bounding boxes</strong> — 1-3 boxes generated deterministically from filename hash</li>
            <li>All downstream scoring uses the same algorithms as the ONNX path</li>
          </ul>
          <div className="doc-avoid-break border-l-4 border-primary-500 bg-primary-50 dark:bg-primary-900/20 p-3 rounded-r-lg mt-3 text-sm">
            <strong>Why a fallback?</strong> The heuristic ensures the app is fully functional even before the YOLOv8 model file is deployed. It produces realistic-looking results using deterministic image analysis, so the entire UI and workflow can be demonstrated and tested.
          </div>
        </Section>

        {/* 8. Database Schema */}
        <Section title="8. Database Schema & Data Model">
          <p>The database is PostgreSQL hosted on Supabase. All tables have Row Level Security (RLS) enabled. The schema was created through 7 migrations.</p>

          <h3 className="font-bold text-base mt-4 mb-2">profiles</h3>
          <p>User accounts, linked 1:1 to Supabase auth.users.</p>
          <Table headers={['Column', 'Type', 'Description']} rows={[
            ['id', 'uuid (PK)', 'Matches auth.users.id'],
            ['email', 'text', "User's email address"],
            ['full_name', 'text', 'Display name'],
            ['phone', 'text', 'Phone number'],
            ['avatar_url', 'text', 'Profile photo URL'],
            ['role', "enum ('user','admin')", 'Determines app access level'],
            ['is_active', 'boolean', 'If false, user cannot log in'],
            ['created_at', 'timestamptz', 'Account creation time'],
            ['updated_at', 'timestamptz', 'Last modification time'],
          ]} />

          <h3 className="font-bold text-base mt-4 mb-2">reports</h3>
          <p>Road damage reports with all ML analysis data.</p>
          <Table headers={['Column', 'Type', 'Description']} rows={[
            ['id', 'uuid (PK)', 'Unique report ID'],
            ['user_id', 'uuid (FK)', "Reporter's profile ID"],
            ['image_url', 'text', 'Public URL of uploaded image'],
            ['damage_type', 'enum', 'pothole, crack, surface_wear, etc.'],
            ['severity', 'enum', 'low, medium, high, critical'],
            ['confidence', 'float', '0-1 model confidence'],
            ['road_health_score', 'int', '0-100 computed score'],
            ['prediction_time_ms', 'int', 'ML inference duration'],
            ['bounding_boxes', 'jsonb', 'Array of detected boxes'],
            ['pothole_count / crack_count / edge_damage_count', 'int', 'Count of each detection type'],
            ['severity_score', 'float', '0-5 numeric score'],
            ['grid_map', 'jsonb', '3×3 spatial severity grid'],
            ['deterioration_risk', 'float', '0-1 probability'],
            ['maintenance_priority', 'enum', 'low, normal, high, urgent'],
            ['latitude / longitude', 'float', 'GPS coordinates (nullable)'],
            ['location_text', 'text', 'Reverse-geocoded address'],
            ['status', 'enum', '9-state lifecycle (see below)'],
            ['admin_remarks', 'text', 'Admin notes during review'],
            ['verified_by / verified_at', 'uuid / timestamptz', 'Admin who verified and when'],
            ['created_at / updated_at', 'timestamptz', 'Timestamps'],
          ]} />

          <h4 className="font-semibold mt-3 mb-1">Report Status Lifecycle</h4>
          <p><strong>Submitted → Pending → Under Review → Approved</strong> (or <strong>Rejected</strong>)</p>
          <p><strong>Approved → Maintenance Assigned → In Progress → Completed → Closed</strong></p>

          <h3 className="font-bold text-base mt-4 mb-2">notifications</h3>
          <Table headers={['Column', 'Type', 'Description']} rows={[
            ['id', 'uuid (PK)', 'Unique notification ID'],
            ['user_id', 'uuid (FK)', "Recipient's profile ID"],
            ['type', 'text', 'new_report, status_change, etc.'],
            ['title / body', 'text', 'Notification content'],
            ['report_id', 'uuid (FK)', 'Related report (nullable)'],
            ['read', 'boolean', 'Read status (default false)'],
            ['created_at', 'timestamptz', 'Timestamp'],
          ]} />

          <h3 className="font-bold text-base mt-4 mb-2">authority_complaints</h3>
          <Table headers={['Column', 'Type', 'Description']} rows={[
            ['id', 'uuid (PK)', 'Unique complaint ID'],
            ['report_id', 'uuid (FK)', 'Linked report (nullable)'],
            ['raised_by', 'uuid (FK)', 'Admin who escalated'],
            ['authority_name / email / phone / helpline', 'text', 'BBMP contact info'],
            ['subject / message', 'text', 'Complaint content'],
            ['latitude / longitude', 'float', 'Location (nullable)'],
            ['status', 'enum', 'draft, lodged, acknowledged, resolved, rejected'],
            ['reference_number', 'text', 'Auto-generated tracking number'],
            ['created_at / updated_at', 'timestamptz', 'Timestamps'],
          ]} />

          <h3 className="font-bold text-base mt-4 mb-2">audit_logs</h3>
          <Table headers={['Column', 'Type', 'Description']} rows={[
            ['id', 'uuid (PK)', 'Unique log ID'],
            ['action', 'text', 'login, logout, report_created, status_changed, user_deleted, etc.'],
            ['entity_type / entity_id', 'text', 'Type and ID of affected entity'],
            ['metadata', 'jsonb', 'Additional context (e.g., email, damage type)'],
            ['device', 'text', 'User agent string (truncated)'],
            ['created_at', 'timestamptz', 'Timestamp'],
          ]} />

          <h3 className="font-bold text-base mt-4 mb-2">app_settings</h3>
          <Table headers={['Column', 'Type', 'Description']} rows={[
            ['id', 'int (PK)', 'Singleton row (id=1)'],
            ['daily_report_limit', 'int', 'Max reports per user per day (default 10)'],
            ['updated_at', 'timestamptz', 'Last modification'],
          ]} />

          <h3 className="font-bold text-base mt-4 mb-2">Database Migrations</h3>
          <Table headers={['Migration', 'Purpose']} rows={[
            ['20260804042715_create_roadguard_schema', 'Creates profiles, reports, notifications, audit_logs tables + RLS policies'],
            ['20260804042801_create_storage_policies', 'Storage bucket policies for report images'],
            ['20260804043636_harden_functions', 'Security hardening for database functions'],
            ['20260806021937_create_app_settings_and_user_management', 'app_settings table + admin user management functions'],
            ['20260806025458_create_authority_complaints', 'authority_complaints table + RLS'],
            ['20260806030723_add_ml_columns_to_reports', 'Adds ML-specific columns to reports'],
            ['20260806035204_create_admin_delete_user_function', 'SECURITY DEFINER function for cascading user deletion'],
          ]} />
        </Section>

        {/* 9. Security Model */}
        <Section title="9. Security Model & RLS Policies">
          <p>Security is enforced at the database level using PostgreSQL Row Level Security (RLS). Every table has RLS enabled, meaning <strong>no data is accessible without an explicit policy</strong>.</p>

          <h3 className="font-bold text-base mt-4 mb-2">RLS Policy Pattern</h3>
          <p>Each table has 4 separate policies — one per CRUD operation (SELECT, INSERT, UPDATE, DELETE):</p>
          <pre className="surface-2 rounded-lg p-4 text-xs overflow-x-auto border border-base"><code>{`-- Example: reports table policies for a signed-in user

-- User can only SELECT their own reports
CREATE POLICY "select_own_reports" ON reports FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

-- User can only INSERT reports for themselves
CREATE POLICY "insert_own_reports" ON reports FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

-- User can only UPDATE their own reports
CREATE POLICY "update_own_reports" ON reports FOR UPDATE
  TO authenticated USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- User can only DELETE their own reports
CREATE POLICY "delete_own_reports" ON reports FOR DELETE
  TO authenticated USING (auth.uid() = user_id);`}</code></pre>

          <div className="doc-avoid-break border-l-4 border-amber-500 bg-amber-50 dark:bg-amber-900/20 p-3 rounded-r-lg mt-3 text-sm">
            <strong>Key Rules:</strong>
            <ul className="list-disc pl-5 mt-1 space-y-0.5">
              <li><code>FOR ALL</code> policies are never used — always 4 separate policies per verb</li>
              <li><code>auth.uid()</code> is used for ownership checks, never <code>current_user</code></li>
              <li><code>USING (true)</code> is only used for intentionally public data, never as a shortcut</li>
              <li>Admins access all data through their role, not by bypassing RLS</li>
            </ul>
          </div>

          <h3 className="font-bold text-base mt-4 mb-2">SECURITY DEFINER Functions</h3>
          <p>Sensitive operations that require elevated privileges use SECURITY DEFINER functions. These run with the permissions of the function owner (postgres), not the caller. Each function internally checks <code>is_admin()</code> before proceeding:</p>
          <Table headers={['Function', 'Purpose', 'Who Can Call']} rows={[
            ['is_admin()', 'Returns true if caller has admin role', 'Anyone (read-only check)'],
            ['get_app_settings()', 'Returns daily report limit', 'Authenticated users'],
            ['update_daily_report_limit()', 'Changes the daily limit', 'Admins only (checked internally)'],
            ['admin_create_user()', 'Creates a new user account', 'Admins only'],
            ['admin_delete_user()', 'Cascading delete of user + all data', 'Admins only'],
          ]} />

          <h3 className="font-bold text-base mt-4 mb-2">Storage Security</h3>
          <p>Report images are stored in a Supabase Storage bucket named <code>reports</code>. Storage policies ensure users can upload to their own folder, images are publicly readable (for display), and users cannot delete or modify other users' images.</p>

          <h3 className="font-bold text-base mt-4 mb-2">Auth Security</h3>
          <ul className="list-disc pl-5 space-y-1">
            <li>Passwords are hashed by Supabase Auth (bcrypt)</li>
            <li>JWT tokens are used for session management</li>
            <li>Email confirmation is OFF (for ease of demo/testing)</li>
            <li>OTP-based login is available as an alternative</li>
            <li>Password reset via email is supported</li>
          </ul>
        </Section>

        {/* 10. Authentication */}
        <Section title="10. Authentication System">
          <p>Authentication is handled by Supabase Auth. The AuthContext React context provides auth state and methods to the entire app.</p>

          <h3 className="font-bold text-base mt-4 mb-2">Auth State Machine</h3>
          <pre className="surface-2 rounded-lg p-4 text-xs overflow-x-auto border border-base"><code>{`state: 'loading' → 'authenticated' | 'unauthenticated'

On app load:
  1. supabase.auth.getSession() checks for existing session
  2. If session exists → load profile → state = 'authenticated'
  3. If no session → state = 'unauthenticated'

On auth state change (realtime):
  SIGNED_IN  → load profile → state = 'authenticated' → log audit
  SIGNED_OUT → clear state → state = 'unauthenticated'`}</code></pre>

          <h3 className="font-bold text-base mt-4 mb-2">Available Auth Methods</h3>
          <Table headers={['Method', 'Description']} rows={[
            ['Email/Password Sign Up', 'Creates account with Supabase Auth. Full name stored in user_metadata.'],
            ['Email/Password Sign In', 'Standard password-based login.'],
            ['OTP Send', 'Sends a 6-digit verification code to email.'],
            ['OTP Verify + Sign Up', 'Verifies OTP, then sets password and name for new user.'],
            ['OTP Verify + Sign In', 'Verifies OTP for existing user.'],
            ['Password Reset', 'Sends password reset email.'],
            ['Sign Out', 'Clears session, logs audit entry.'],
          ]} />

          <h3 className="font-bold text-base mt-4 mb-2">Profile Loading</h3>
          <p>After authentication, the app loads the user's profile from the <code>profiles</code> table using <code>maybeSingle()</code> (not <code>single()</code>) to gracefully handle the case where a profile row doesn't exist yet. The profile determines which app shell to render (User vs Admin), whether the account is active, and display name/avatar for the header.</p>

          <h3 className="font-bold text-base mt-4 mb-2">Default Admin Account</h3>
          <p>On first app launch, the <code>ensureAdminAccount()</code> function calls the <code>create-admin</code> edge function to auto-provision a default admin:</p>
          <pre className="surface-2 rounded-lg p-4 text-xs overflow-x-auto border border-base"><code>{`Email:    admin@roadguard
Password: admin@2026
Name:     RoadGuard Admin
Role:     admin`}</code></pre>
          <p>The edge function is idempotent — if the admin already exists, it does nothing. This ensures the app is immediately usable with admin access after deployment.</p>

          <h3 className="font-bold text-base mt-4 mb-2">Auth Screens</h3>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Splash</strong> — animated loading screen with RoadGuard logo, shown for ~2 seconds on first load</li>
            <li><strong>Login</strong> — email + password fields, "Forgot password?" link, "Register" link</li>
            <li><strong>Register</strong> — full name + email + password fields, "Login" link</li>
            <li><strong>Forgot Password</strong> — email field, sends reset link</li>
          </ul>
        </Section>

        {/* 11. Realtime / Storage / Notifications / Export */}
        <Section title="11. Realtime Updates, Storage, Notifications & Export">
          <h3 className="font-bold text-base mt-4 mb-2">Realtime Updates</h3>
          <p>Both the user and admin apps subscribe to Supabase Realtime (Postgres Changes) channels. When data changes in the database, connected clients receive updates instantly without polling:</p>
          <Table headers={['Client', 'Channel', 'Events', 'Effect']} rows={[
            ['User', 'user-reports', 'INSERT/UPDATE/DELETE on reports (own)', 'Refresh report list'],
            ['User', 'user-notifs', 'INSERT on notifications (own)', 'Refresh notification list'],
            ['Admin', 'admin-reports', 'INSERT/UPDATE/DELETE on reports (all)', 'Refresh report list'],
            ['Admin', 'admin-users', 'INSERT/UPDATE/DELETE on profiles', 'Refresh user list'],
            ['Admin', 'admin-notifs', 'INSERT on notifications (own)', 'Refresh notification list'],
          ]} />
          <p>The admin dashboard displays a "Live sync active" indicator with a pulsing green dot to show the realtime connection is working.</p>

          <h3 className="font-bold text-base mt-4 mb-2">File Storage &amp; Uploads</h3>
          <p>Report images are uploaded to the Supabase Storage bucket <code>reports</code>. The upload path is structured as <code>{'{user_id}/{timestamp}-{random}.{ext}'}</code> to ensure files are organized by user, no filename collisions, and original file extension is preserved. After upload, a public URL is generated and stored in the <code>image_url</code> column of the report.</p>

          <h3 className="font-bold text-base mt-4 mb-2">Notifications</h3>
          <p>Notifications are created at key moments: new report submitted (all active admins notified), report status changed (report owner notified), report verified/rejected (report owner notified). The notification panel shows the 20 most recent with unread count badge in the header.</p>

          <h3 className="font-bold text-base mt-4 mb-2">Audit Logging</h3>
          <p>Every significant action is logged to the <code>audit_logs</code> table: login, logout, register, report_created, status_changed (with old/new status in metadata), user_deleted, user_activated, user_deactivated, complaint_lodged, complaint_updated. Each log entry includes the action, entity type, entity ID, metadata (JSON), and the user's device/user-agent string (truncated to 120 chars).</p>

          <h3 className="font-bold text-base mt-4 mb-2">Export &amp; Reporting</h3>
          <p>Admins can export reports in two formats:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>CSV Export</strong> — downloads a CSV file with columns: ID, Damage Type, Severity, Confidence, Road Health, Status, Latitude, Longitude, Location, Created, Priority. Properly escapes quotes and commas.</li>
            <li><strong>PDF Export</strong> — opens a new window with a styled HTML table and triggers the browser's print dialog (which can save as PDF). Includes RoadGuard branding, generation timestamp, and reporter name.</li>
          </ul>
        </Section>

        {/* 12. File Structure */}
        <Section title="12. Project File Structure">
          <pre className="surface-2 rounded-lg p-4 text-xs overflow-x-auto border border-base leading-relaxed"><code>{`project/
├── index.html                          # Vite HTML entry point
├── package.json                        # Dependencies and scripts
├── vite.config.ts                     # Vite build config
├── tailwind.config.js                 # Tailwind theme (colors, fonts, dark mode)
├── tsconfig.json                      # TypeScript config
├── .env                               # Supabase environment variables
│
├── public/
│   ├── roadguard.svg                   # Logo SVG
│   ├── documentation.html              # Standalone HTML documentation
│   └── ort/                            # ONNX Runtime WASM files
│
├── src/
│   ├── main.tsx                         # React DOM render entry
│   ├── App.tsx                          # Root: splash → auth gate → app shell
│   ├── index.css                        # Global styles + Tailwind directives
│   │
│   ├── context/
│   │   ├── AuthContext.tsx              # Auth state, sign in/up/out, profile loading
│   │   └── ThemeContext.tsx              # Dark/light theme toggle
│   │
│   ├── lib/
│   │   ├── supabase.ts                   # Supabase client singleton
│   │   ├── types.ts                      # All TypeScript types + label maps
│   │   ├── detection.ts                  # ONNX inference + heuristic fallback
│   │   ├── predictor.ts                  # Severity, risk, priority, health scoring
│   │   ├── grid-scorer.ts                # 3×3 grid computation + damage weights
│   │   ├── services.ts                   # DB service layer (fetch, notify, audit)
│   │   ├── storage.ts                    # Image upload to Supabase Storage
│   │   ├── export.ts                     # CSV and PDF export functions
│   │   ├── format.ts                     # Date formatting, severity/status CSS
│   │   └── setup.ts                       # Auto-provision default admin account
│   │
│   ├── components/
│   │   ├── ui/index.tsx                  # Reusable UI: Card, Badge, Button, Spinner
│   │   ├── Charts.tsx                     # SVG charts: Line, Bar, Donut, ProgressBar
│   │   ├── CameraCapture.tsx             # Camera modal with getUserMedia
│   │   ├── DetectionCanvas.tsx            # Draws bounding boxes over image
│   │   ├── MapView.tsx                    # Leaflet map wrapper with custom markers
│   │   ├── NotificationsPanel.tsx         # Slide-in notification panel
│   │   └── ReportDetail.tsx               # Full report detail view (shared)
│   │
│   └── pages/
│       ├── auth/
│       │   ├── Splash.tsx                 # Animated splash screen
│       │   └── AuthPages.tsx              # Login, Register, ForgotPassword
│       │
│       ├── user/
│       │   ├── UserApp.tsx                # User shell: header + bottom nav
│       │   ├── UserHome.tsx                # Home dashboard with stats + charts
│       │   ├── UserMap.tsx                 # User's reports on Leaflet map
│       │   ├── ReportFlow.tsx              # Multi-stage report creation flow
│       │   ├── UserHistory.tsx             # Report history list
│       │   └── UserProfile.tsx             # Profile editing + settings
│       │
│       └── admin/
│           ├── AdminApp.tsx               # Admin shell: sidebar + content routing
│           ├── AdminDashboard.tsx          # Overview dashboard with live stats
│           ├── AdminReports.tsx           # Report management + filters
│           ├── AdminComplaints.tsx        # BBMP complaint management
│           ├── AdminUsers.tsx             # User management (activate, delete)
│           ├── AdminMap.tsx                # All reports on map
│           └── AdminAnalytics.tsx         # System-wide analytics + charts
│
└── supabase/
    ├── migrations/                       # 7 SQL migration files
    └── functions/
        └── create-admin/index.ts          # Edge function: auto-provision admin`}</code></pre>
        </Section>

        {/* 13. Environment */}
        <Section title="13. Environment & Configuration">
          <h3 className="font-bold text-base mt-4 mb-2">Environment Variables</h3>
          <p>The app connects to Supabase using credentials stored in the <code>.env</code> file. These are pre-provisioned and do not need manual configuration:</p>
          <pre className="surface-2 rounded-lg p-4 text-xs overflow-x-auto border border-base"><code>{`# Supabase Configuration (pre-populated)
VITE_SUPABASE_URL=https://<project-id>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon-key>

# Server-side (used by edge functions)
SUPABASE_URL=https://<project-id>.supabase.co
SUPABASE_ANON_KEY=<anon-key>
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
SUPABASE_DB_URL=postgresql://...`}</code></pre>

          <h3 className="font-bold text-base mt-4 mb-2">Build Scripts</h3>
          <Table headers={['Command', 'Purpose']} rows={[
            ['npm run dev', 'Start Vite dev server with HMR (auto-started)'],
            ['npm run build', 'Production build to dist/'],
            ['npm run typecheck', 'TypeScript type checking without emitting files'],
            ['npm run lint', 'Run ESLint'],
            ['npm run preview', 'Preview the production build locally'],
          ]} />

          <h3 className="font-bold text-base mt-4 mb-2">Theme System</h3>
          <p>The app supports light and dark modes via the ThemeContext. Tailwind's <code>dark:</code> variant is used throughout. The theme toggle is available in the header for both user and admin apps. The theme persists across sessions via localStorage.</p>
          <p>Custom CSS utility classes: <code>surface</code>, <code>surface-2</code>, <code>glass</code>, <code>card</code>, <code>btn-primary</code>, <code>btn-ghost</code>, <code>badge</code>, <code>input</code>, <code>border-base</code>, <code>text-muted</code> — all theme-adaptive.</p>

          <h3 className="font-bold text-base mt-4 mb-2">Path Alias</h3>
          <p>The <code>@/</code> alias maps to <code>src/</code>, so imports like <code>@/components/Charts</code> resolve to <code>src/components/Charts</code>. Configured in <code>tsconfig.json</code> and <code>vite.config.ts</code>.</p>

          <h3 className="font-bold text-base mt-4 mb-2">ONNX Runtime Web Configuration</h3>
          <p>The ONNX Runtime WASM files are served from <code>/public/ort/</code>. The path is set in <code>detection.ts</code>: <code>ort.env.wasm.wasmPaths = '/ort/';</code></p>
          <p>The model file is expected at <code>/public/models/yolov8_pothole.onnx</code>. If this file is not present, the app uses the heuristic fallback analyzer.</p>

          <div className="doc-avoid-break border-l-4 border-green-500 bg-green-50 dark:bg-green-900/20 p-4 rounded-r-lg mt-6 text-sm">
            <strong>End of Documentation</strong>
            <p className="mt-1">This document covers the complete architecture, features, AI pipeline, database schema, security model, and file structure of the RoadGuard application. For any code-level questions, refer to the specific files listed in Section 12.</p>
          </div>
        </Section>

      </div>
    </div>
  );
}
