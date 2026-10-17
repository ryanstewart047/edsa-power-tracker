# EDSA Power Tracker — Release Notes

## Version 0.2.0 (2026-10-17)
**Release ID**: `rel-2026-10-17-v0.2.0`  
**Target Platform**: Web & Mobile PWA (Sierra Leone Nationwide)

---

### 🌟 Release Summary
Release **v0.2.0** delivers a major upgrade to the EDSA Power Tracker platform, focusing on enhanced citizen hazard reporting, expanded utility services, high-visibility operational notifications, a modern clean white design with smooth scroll-driven reveals, and an automated release update system.

---

### 📸 1. Hazard Reporting & Camera Evidence
- **Direct Camera Capture**: Users can now take photos directly with their device camera in real time, in addition to choosing files from their photo library.
- **Client-Side Image Optimization**: Live automatic photo compression reduces payload size while preserving critical visual details, ensuring fast and reliable uploads even on 3G and edge mobile connections across Sierra Leone.
- **Mobile Action Bar Visibility**: Resolved an issue where the danger report submission button was obscured behind the mobile bottom navigation bar by adding responsive bottom padding and a floating, accessible CTA bar.

---

### ⚡ 2. Expanded Service & Hazard Categories
Added three frequently requested utility incident and operational categories to the reporting workflows:
1. **Billing and Account services** — Escalation of token generation errors, meter deduction mismatches, and customer account inquiries.
2. **Voltage Issues (Low or High)** — Community tracking of brownouts, voltage surges, and erratic supply protecting household appliances.
3. **Cut or Damaged Wires** — Urgent reporting of downed cables, snapped overhead lines, and high-risk exposed wiring.
- Integrated across incident schemas, admin consoles, and local location configuration maps.

---

### 🎨 3. Clean White Theme & Scroll-Driven Animations
- **Modern White Theme**: Refreshed the entire application interface to a clean, crisp white background (`bg-white`) with high-contrast slate typography (`text-slate-900`) and subtle slate border accents.
- **Native Smooth Scrolling**: Configured global smooth scrolling behavior (`scroll-behavior: smooth`) across all routes and devices.
- **Scroll-Driven Reveal Effects**: Added dynamic fade-in and slide-up animations (`framer-motion` and `.scroll-reveal`) so cards, safety guidelines, and stats fluidly reveal themselves as users scroll down.

---

### 🔗 4. Interactive Homepage Navigation & Deep-Linking
Converted static homepage badges into interactive navigation links with custom Lucide icons, directional indicators, and hover states:
- **`GPS-Verified`** $\rightarrow$ Direct jump to location-verified community status.
- **`Meter Top-Up`** $\rightarrow$ Deep-links directly to `/topup?tab=buy` for USSD quick-dial payments (Orange Money & Afrimoney).
- **`Token Vault`** $\rightarrow$ Deep-links directly to `/topup?tab=vault` for offline 20-digit token storage and SMS parser.
- **`Hazard Evidence`** $\rightarrow$ Direct link to live photo and camera hazard reporting.
- **`Real-Time Status`** $\rightarrow$ Instant access to community power grid signals.

---

### 🔔 5. High-Visibility Orange-Yellow Notification Banners
- **Urgent Notification Styling**: Replaced muted notifications with a vibrant, high-visibility orange-yellow gradient (`from-amber-400 via-yellow-400 to-orange-400`) with high-contrast text and glowing amber borders.
- **Coordinated Banner Stack**: Operational announcements, detected tokens, and area alerts now use unified high-visibility amber styling so users never miss critical notices.

---

### 🚀 6. Release-Based App Update System
- **Automated Update Detection**: The app monitors server release versions and Service Worker installation states.
- **One-Click Update**: Users receive an in-app banner notifying them of new versions with a single **"Update App"** button that purges stale caches, triggers Service Worker skip-waiting, and reloads to the latest build.
- **One-Time Acknowledgment**: Once updated, the notification is permanently suppressed and will **not pop up again until a newer release is published**.

---

### 🛠️ 7. System & Backend Resiliency
- **Self-Healing Database Migrations**: Added per-column fallback checks for incident tables to prevent downtime during schema upgrades.
- **Multi-Tier Offline Storage**: Token vault and meter profile data are safely persisted across IndexedDB and LocalStorage with Android persistent storage permissions.
- **Service Worker v6**: Updated PWA cache to `edsa-tracker-v6` for reliable offline access.

---

*EDSA Native Platform — Sierra Leone Power & Hazard Operations*
