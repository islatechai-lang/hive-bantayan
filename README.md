# Bantayan Hub — Next.js Island Marketplace

Bantayan Hub is a local marketplace and delivery platform built exclusively for Bantayan Island, Cebu, Philippines. It connects island customers with local businesses for direct ordering, real-time tracking, chat messaging, and cash-on-delivery (COD) fulfillment.

---

## 🏝️ Tech Stack

- **Frontend**: Next.js 14 (App Router) + React 18 + TypeScript + Framer Motion
- **State Management**: Zustand
- **Backend Services**: Firebase (Authentication, Firestore, Storage)
- **Styling**: Vanilla CSS Modules (support for Light / Dark Mode preferences)
- **Deployment**: Vercel (Frontend) + Firebase CLI (Rules / Indexes)

---

## 🚀 Getting Started

### 1. Clone & Install Dependencies
Navigate to the project folder and run:
```bash
npm install
```

### 2. Set Up Firebase Configuration
1. Go to the [Firebase Console](https://console.firebase.google.com/) and create a new project called **Bantayan Hub**.
2. Enable **Google Sign-In** inside Firebase Auth (`Build > Authentication > Sign-in method`).
3. Create a **Cloud Firestore** database in production mode.
4. Create a **Cloud Storage** bucket.
5. Register a Web App inside your Firebase project settings to get your configuration parameters.

### 3. Setup Environment Variables
Create a file called `.env.local` in the project root:
```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

### 4. Deploy Firestore Rules & Indexes
Install Firebase CLI globally:
```bash
npm install -g firebase-tools
firebase login
```
Deploy the security configurations:
```bash
firebase deploy --only firestore:rules
firebase deploy --only firestore:indexes
```

### 5. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📦 Production Builds & Deployment

### Build the App Bundle
Verify TypeScript validation and Next.js optimization compilation:
```bash
npm run build
```

### Deploy to Vercel (Recommended)
1. Import this repository into Vercel.
2. Add the environment variables from your `.env.local` file.
3. Click **Deploy**. Vercel will automatically configure routing, SSL, and asset distribution.
