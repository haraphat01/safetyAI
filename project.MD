# Product Requirements Document (PRD): SafeGuard AI Safety App (Expo)


## 1. Overview
**Product Vision**: SafeGuard is a cross-platform (iOS/Android) mobile app built with Expo, delivering AI-driven personal safety through real-time threat detection and instant emergency response. Powered by Supabase for secure backend services, it offers a freemium model with core safety features free and premium features via subscription.

**Problem Statement**: Urban users need discreet, proactive safety tools for risky environments. Existing apps lack Expo’s cross-platform efficiency, robust AI integration, or strong privacy protections.

**Objectives**:
- Launch MVP by October 23, 2025, targeting 10,000 active users in 6 months.
- Achieve 4.5+ app store rating, 60% retention, and $50,000 MRR in 12 months.
- Ensure GDPR/CCPA/SOC 2 compliance using Expo and Supabase.

**Success Metrics**:
- 70% MAU of downloads, <2s threat alert latency, <1s SOS dispatch.
- 90% user satisfaction with emergency features (in-app surveys).
- 20% free-to-premium conversion rate.

## 2. Target Audience
- **Primary Persona**: Sarah, 28, urban professional needing discreet safety alerts.
- **Secondary Persona**: James, 45, parent monitoring family safety.
- **Tertiary Persona**: Maria, 22, budget-conscious student seeking affordable security.
- **Market**: 1M urban users in US/UK/Canada within 2 years (SAM: 50M).

## 3. Shippable Chunks
### Chunk 1: Foundation & Authentication (Weeks 1-2)
**Goal**: Set up Expo app and Supabase authentication.
- **Features**:
  - Initialize Expo (React Native, TypeScript) with Expo Router and React Native Elements.
  - Configure Supabase (Auth, Postgres, Storage).
  - Email/OAuth (Google/Apple) login via Supabase Auth; sessions in Expo SecureStore.
  - Basic profile (name, email) in Supabase Postgres with Row Level Security.
  - Onboarding UI with Expo SplashScreen.
- **Deliverables**: App with login/signup; deployable via Expo Go.
- **Success Criteria**: <30s signup/login, 100% secure auth.
- **Dependencies**: Expo CLI, Supabase, Google/Apple developer accounts.
- **Effort**: 2 weeks.

### Chunk 2: Core AI Safety Monitor (Weeks 3-5)
**Goal**: Build AI-driven threat detection using Expo Sensors.
- **Features**:
  - Use Expo Sensors (`DeviceMotion`, `Location`, `Audio`) for threat detection (falls, loud noises).
  - On-device TensorFlow Lite model for alerts via Expo Notifications (<2s latency).
  - Static crime data warnings (mock API).
  - Local processing with opt-in consent in Expo SecureStore.
- **Deliverables**: App detects simulated threats, sends vibration alerts.
- **Success Criteria**: 90% AI accuracy, <5% battery/hour.
- **Dependencies**: TensorFlow Lite, Expo Sensors.
- **Effort**: 3 weeks.

### Chunk 3: Emergency Contact System (Weeks 6-8)
**Goal**: Implement SOS and check-ins with Supabase Realtime.
- **Features**:
  - One-tap SOS with GPS (Expo Location) to 3 contacts via Supabase Realtime (<1s).
  - Voice-activated SOS (Expo Speech-to-Text, background via Expo Background Tasks).
  - 1/day check-ins; non-response alerts (Supabase Realtime).
  - Offline queuing (Expo AsyncStorage).
  - Profile: Add 3 contacts, medical info (Supabase Postgres).
  - Crime data API (Crimeometer) via Supabase Edge Functions.
- **Deliverables**: SOS/check-in system, profile UI, beta build.
- **Success Criteria**: <1s SOS delivery, 90% risk warning coverage.
- **Dependencies**: Crimeometer API, Expo permissions.
- **Effort**: 3 weeks.

### Chunk 4: Premium Features & Subscription (Weeks 9-11)
**Goal**: Add premium AI, family safety, and billing.
- **Features**:
  - Advanced AI (OpenAI CLIP via Supabase Edge Functions); video analysis (Expo Camera).
  - Family safety: Location sharing (Expo Location + Supabase Realtime).
  - Incident logging (Supabase Storage).
  - Stripe subscriptions ($4.99/mo, $49.99/yr) via BuildShip.
  - Free: Core AI, SOS, 1 check-in. Premium: Advanced AI, unlimited check-ins, 10 contacts.
- **Deliverables**: Premium feature toggles, Stripe flow, test build.
- **Success Criteria**: 90% AI accuracy, 95% payment success.
- **Dependencies**: Stripe, OpenAI API.
- **Effort**: 3 weeks.

### Chunk 5: Testing, Polish & Launch (Weeks 12-16)
**Goal**: Finalize, test, and launch app.
- **Features**:
  - Unit tests (AI, 90% coverage), integration tests (Supabase).
  - UI polish: Onboarding tutorial, safety tips (Expo Notifications).
  - Beta test (100 users), iterate on feedback.
  - Analytics (Expo Analytics/Supabase logs).
  - Deploy via Expo EAS Build to App Store/Google Play.
  - Marketing: ASO, X/Instagram ads, campus partnerships.
- **Deliverables**: Production app, marketing assets, in-app survey.
- **Success Criteria**: 4.5+ rating, <1% crash rate, 1,000 downloads in 2 weeks.
- **Dependencies**: App store accounts, marketing budget.
- **Effort**: 4 weeks.

## 4. Technical Specifications
- **Tech Stack**:
  - **Frontend**: Expo (React Native, TypeScript), Expo Router, React Native Elements, Expo Image Picker.
  - **Backend**: Supabase (Auth, Postgres, Storage, Realtime, Edge Functions).
  - **AI**: TensorFlow Lite (free), OpenAI CLIP (premium).
  - **Payments**: Stripe via BuildShip.
  - **APIs**: Crimeometer.
- **Architecture**: Expo app processes sensors locally, syncs with Supabase for alerts/storage. Realtime SOS via Supabase; Edge Functions for APIs. Offline support via Expo AsyncStorage.
- **Non-Functional**:
  - **Performance**: <2s alerts, <1s SOS, battery-efficient.
  - **Security**: End-to-end encryption, GDPR/CCPA/SOC 2.
  - **Scalability**: 100,000 users via Supabase.
  - **Reliability**: 99.9% uptime, offline queuing.

