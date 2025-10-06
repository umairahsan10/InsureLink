# InsureLink Client - Final Folder Structure

## ✅ Completed Restructuring

This document outlines the new folder structure implemented for the InsureLink client application.

## 📁 App Structure

### Public Routes
- `/` - Landing page (Home)
- `/explore` - Explore roles screen
- `/explore/patient` - Patient demo dashboard
- `/explore/corporate` - Corporate demo dashboard
- `/explore/hospital` - Hospital demo dashboard
- `/explore/insurer` - Insurer demo dashboard
- `/login` - Login page
- `/onboard-corporate` - Corporate onboarding form

### Patient Portal (`/patient`)
- `/patient/dashboard` - Main patient dashboard
- `/patient/claims` - View and submit claims
- `/patient/profile` - Manage personal information
- `/patient/history` - Claim history

### Corporate Portal (`/corporate`)
- `/corporate/dashboard` - Corporate dashboard
- `/corporate/claims` - Employee claims management
- `/corporate/employees` - Employee management
- `/corporate/plans` - Insurance plans overview
- `/corporate/profile` - Company profile

### Hospital Portal (`/hospital`)
- `/hospital/dashboard` - Hospital dashboard
- `/hospital/claims` - Claims processing
- `/hospital/patients` - Patient records
- `/hospital/profile` - Hospital profile

### Insurer Portal (`/insurer`)
- `/insurer/dashboard` - Insurer dashboard
- `/insurer/claims` - Claims review and processing
- `/insurer/hospitals` - Network hospitals management
- `/insurer/corporates` - Corporate clients management
- `/insurer/profile` - Insurer profile

## 🎨 Components Structure

### Layouts (`src/components/layouts/`)
- `Sidebar.tsx` - Dynamic sidebar for all user roles
- `Topbar.tsx` - Top navigation bar
- `DashboardLayout.tsx` - Main dashboard layout wrapper

### Dashboards (`src/components/dashboards/`)
- `PatientDashboard.tsx` - Patient dashboard component
- `CorporateDashboard.tsx` - Corporate dashboard component
- `HospitalDashboard.tsx` - Hospital dashboard component
- `InsurerDashboard.tsx` - Insurer dashboard component

### Claims (`src/components/claims/`)
- `ClaimTable.tsx` - Reusable claims table
- `ClaimCard.tsx` - Claim card component
- `ClaimStatusBadge.tsx` - Status badge component

### Shared (`src/components/shared/`)
- `Button.tsx` - Reusable button component (existing)
- `Card.tsx` - Generic card component
- `Modal.tsx` - Modal dialog component

### Chatbot (`src/components/chatbot/`)
- `ChatWidget.tsx` - Support chatbot widget

## 📊 Data Structure (`src/data/`)

Mock data for development and testing:
- `claims.json` - Sample claims data
- `patients.json` - Sample patient data
- `corporate.json` - Sample corporate data
- `insurer.json` - Sample insurer data

## 🛠️ Lib Structure

### Hooks (`src/lib/hooks/`)
- `useFetchClaims.ts` - Custom hook for fetching claims
- `useAuth.ts` - Authentication hook (existing)
- `useWebSocket.ts` - WebSocket hook (existing)

### Utils (`src/lib/`)
- `apiClient.ts` - Centralized API client
- `utils/index.ts` - Utility functions (existing)
- `auth/session.ts` - Session management (existing)
- `websocket/client.ts` - WebSocket client (existing)

## 📝 Types Structure (`src/types/`)

Type definitions for TypeScript:
- `claims.d.ts` - Claim-related types
- `user.d.ts` - User and role types
- `common.d.ts` - Common shared types
- `index.ts` - Type exports (existing)

## 🔌 API Routes (`src/app/api/`)

Next.js API routes for backend communication:
- `auth/route.ts` - Authentication endpoints
- `claims/route.ts` - Claims CRUD operations
- `users/route.ts` - User management endpoints

## 🧹 Cleanup

The following old structure has been removed:
- ❌ `(auth)/` folder and all its contents
  - `(auth)/login/` - Replaced with `/login`
  - `(auth)/register/` - Will be integrated into role-specific onboarding
  - `(auth)/forgot-password/` - Can be added to login page if needed
  - `(auth)/layout.tsx` - No longer needed

> **Note:** Empty `(auth)` directories may remain. You can safely delete the `client/src/app/(auth)` folder manually if it still exists.

## 🚀 Next Steps

1. **Testing**: Test all new routes and components
2. **Integration**: Connect components to API routes
3. **Styling**: Enhance UI/UX with Tailwind CSS
4. **Authentication**: Implement proper authentication flow
5. **Data Fetching**: Replace mock data with real API calls
6. **State Management**: Consider adding state management (Redux/Zustand) if needed

## 📦 Key Features

- ✅ Role-based portal architecture
- ✅ Comprehensive dashboard components
- ✅ Reusable UI components
- ✅ Type-safe development with TypeScript
- ✅ Mock data for development
- ✅ API route structure ready
- ✅ Modular and scalable architecture

---

**Last Updated:** October 6, 2025  
**Structure Version:** 1.0  
**Status:** ✅ Complete

