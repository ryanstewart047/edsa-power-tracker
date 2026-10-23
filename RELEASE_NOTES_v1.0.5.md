# ⚡ EDSA Power Tracker — Release Notes v1.0.5

**Version:** `1.0.5`  
**Build Code:** `6`  
**Release Date:** October 21, 2026  
**Target Environments:** Web (PWA), Android (Google Play Bundle), Mobile Web  

---

## 🌟 Major Highlights

Version **1.0.5** brings our biggest upgrade yet to EDSA Power Tracker, transforming the app into an end-to-end utility companion for every Sierra Leonean household and business. From granular per-meter financial breakdowns to localized prepaid meter shortcodes, private neighborhood grid bulletin sync, and an official EDSA News & Events interactive carousel — power management in Sierra Leone has never been smarter or more transparent.

---

## 📊 Detailed Feature Breakdown

### 1. 📈 Individual Meter Financial & Usage Analytics
* **Dedicated Meter Breakdown Modal**: Tap on any saved meter in your vault to unlock a complete financial dashboard customized specifically for that meter.
* **Weekly & Monthly Expenditure**: Real-time spending calculations in New Leones (SLL / NLe) comparing current month vs. previous month.
* **Visual Expenditure Charts**: Clean SVG bar graphs charting your spending and consumption trajectory over time.
* **Smart Burn-Rate Projections**: Calculates average daily kWh consumption, estimated days of power remaining, and the exact projected token expiry date.
* **Tariff Transparency**: Automatic calculation of EDSA residential block tariffs (Tier 1 vs. Tier 2), 15% GST, and statutory standing charges.
* **Inline Nickname Editing**: Easily rename meters (e.g., *"Parlor Meter"*, *"Compound Pump"*, *"Shop Freezer"*) with instant multi-tier persistence.

---

### 2. 🔢 Sierra Leone Prepaid Meter Numeric Shortcodes (No `*` or `#` Keys)
* **Tailored for Local Keypads**: Most CIU keypads across Freetown, Bo, Kenema, and Makeni lack the `*` or `#` symbols. We researched and built an exhaustive reference for numeric-only keypads.
* **Supported Manufacturers**:
  * **Conlog** (Numeric direct codes: `000`, `001`, `004`, `030`, `070`, etc.)
  * **Hexing** (`800`, `801`, `802`, `804`, `814`, etc.)
  * **Holley** (`00`, `01`, `03`, `05`, `07`, `10`)
  * **Inhemeter** (`01`, `02`, `03`, `07`, `21`)
  * **Landis+Gyr** (`i012`, `i013`, `i021`)
  * **Chint**, **Kaifa**, and **Clou**
* **Instant Diagnostic Lookup**: Check remaining credit, instantaneous load (kW), line voltage (V), meter serial number, and tamper status with 1 click. Includes interactive keypad copy and visual quick-reference guides.

---

### 3. 🛡️ Community Grid Bulletin with Strict Neighborhood Isolation & Live Sync
* **Database Persistence**: Grid notes now save permanently to PostgreSQL (`AppSetting` storage partition), ensuring resident field reports survive serverless restarts and redeployments.
* **Strict Area Isolation**: Enhanced privacy and relevance — field notes from Lumley are strictly isolated to Lumley, Aberdeen to Aberdeen, Wilberforce to Wilberforce, Kissy to Kissy, etc. Neighbors only see verified information relevant to their exact transformer feeder.
* **Live 15-Second Background Polling**: Automatic silent background synchronization keeps neighborhood outage reports up to date without requiring page refreshes.
* **Privacy Assurance Badge**: Clear UI banner reminding users that notes are private to their community boundary.

---

### 4. 📰 EDSA News & Events Sliding Carousel + Rich Popup Modal
* **Interactive Homepage Carousel**: Sleek horizontal sliding cards directly below the quick actions on the homepage (`app/page.tsx`).
* **Category Filters**: Filter instantly between **All**, **News**, and **Events**.
* **Smooth-Scrolling Pop-up Modal**: Clicking any card smoothly expands a detail view complete with:
  * High-resolution utility photography
  * Event date, time, and venue badge pills
  * Formatted story paragraphs with official EDSA byline
  * **1-Click WhatsApp Sharing** formatted with headlines and deep-links.

---

### 5. 🛠️ Official News & Events Admin Management Suite (`/admin/news`)
* **Secure Editorial Workspace**: Accessible directly from the Admin Dashboard and Operations Hub.
* **Photo Uploader**: Direct upload from phone or desktop with client-side preview, plus curated preset imagery of Sierra Leonean grid infrastructure.
* **Full Lifecycle Control**: Create, edit, preview, and delete news and event stories.
* **Instant Enable / Disable Toggles**: Temporarily hide or spotlight announcements on the homepage without deleting historical records.

---

### 6. 🧹 Clean Meter Slate (Default Demo Meter Removed)
* **Zero Dummy Data**: The legacy fallback placeholder meter (`meter-1` / `01423859201`) has been permanently eradicated from the system.
* **Auto-Migration Scrub**: Client vaults automatically sweep away legacy demo records so users start with a clean slate.
* **Zero-Meter Deletion**: Users can safely delete meters down to zero without the system re-seeding dummy records.
* **Friendly Onboarding**: An encouraging empty state guides users to register their own genuine meters.

---

## 📱 Google Play Console / App Store Submission Copy

### Short Description (80 characters max):
> Track EDSA tokens, meter spend, community power outages, and official news in Sierra Leone.

### "What's New in Version 1.0.5" (Google Play Release Notes):
```text
• Per-Meter Financial Breakdown: Track weekly & monthly spend, view expenditure charts, and see projected token expiry dates.
• Sierra Leone Meter Shortcodes: Added direct numeric codes for keypads without * or # (Conlog, Hexing, Holley, Inhemeter, Landis+Gyr).
• Community Grid Bulletin: Private, persistent outage reports synced exclusively for your neighborhood.
• EDSA News & Events: Interactive homepage carousel with official updates and 1-click WhatsApp sharing.
• Removed default demo meter for a clean first-time setup.
• Performance optimizations and UI enhancements.
```

---

## 💬 WhatsApp & Social Media Announcement (Sierra Leone Community)

> 💡 **EDSA Power Tracker Update — Version 1.0.5 is Live!** 🇸🇱⚡
> 
> Good news for all EDSA electricity consumers in Sierra Leone! We’ve just rolled out a major update with powerful new tools to help you manage your prepaid electricity:
> 
> 📊 **Know Where Your Money Goes**: Click any saved meter to see how much you spent this week or month, your average daily burn rate, and when your units will finish!
> 
> 🔢 **Keypad Shortcodes (No * or #)**: Got a meter without star or hash keys? Find the exact 2-digit and 3-digit codes for Conlog, Hexing, Holley, and Inhemeter to check remaining units and voltage.
> 
> 🏘️ **Community Grid Bulletin**: Real-time outage notes from neighbors in your exact area (Lumley, Aberdeen, Kissy, etc.) with strict area privacy!
> 
> 📰 **Official EDSA News & Events**: Stay informed about scheduled maintenance, substation upgrades, and tariff information right from the homepage.
> 
> 📲 **Open the app now**: https://edsa-power-tracker.vercel.app  
> *(If you already installed the PWA, simply reopen it to get the update automatically!)*

---

## 🔒 Verification & Quality Assurance
- **TypeScript**: 0 type errors across all route handlers, server actions, and UI components.
- **ESLint**: 100% compliant with Next.js 14 production lint standards.
- **Security**: Strict session checks on admin endpoints (`requireAdminSession`), parameterized Prisma queries, and rate-limiting.
- **Offline / PWA**: Multi-tier vault caching with offline-first local storage fallback.
