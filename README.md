# SGED - Sistema de Gestión de Evento Deportivo

A modern web app for managing sports tournaments, built with React, Vite, and Firebase. Features include:

- Team, group, match, and calendar CRUD
- Standings table
- Firebase Authentication (admin/viewer roles)
- Admin-only editing and user management
- Responsive, mobile-friendly UI

## Features

- Secure login/logout (email/password)
- Admin role management
- Jornada and Calendario CRUD
- Real-time Firestore sync
- Professional, responsive design

## Getting Started

1. Clone the repo
2. Copy `.env.example` to `.env` and add your Firebase config
3. Run `npm install`
4. Run `npm run dev` for local development
5. Deploy with Firebase Hosting

## License

See [LICENSE](LICENSE).

## Deploy checklist (Firebase Hosting)

Before deploying to production, verify these steps to avoid auth/invalid-api-key and similar issues:

1. Environment variables (.env)

- Ensure `.env` exists (not committed) with the following keys:
  - `VITE_FIREBASE_API_KEY`
  - `VITE_FIREBASE_AUTH_DOMAIN`
  - `VITE_FIREBASE_PROJECT_ID`
  - `VITE_FIREBASE_STORAGE_BUCKET` (must end with `.appspot.com`)
  - `VITE_FIREBASE_MESSAGING_SENDER_ID`
  - `VITE_FIREBASE_APP_ID`
  - `VITE_FIREBASE_MEASUREMENT_ID` (optional)
- The build will run a precheck and fail if something is missing or malformed.

2. Authorized domains (Firebase Auth)

- Firebase Console → Authentication → Settings → Authorized domains:
  - Add `your-project.web.app`
  - Add `your-project.firebaseapp.com`
  - Add any custom domain you use

3. Build and Deploy

```sh
npm run build
firebase deploy --only hosting
```

Or use the combined script:

```sh
npm run deploy
```

4. Troubleshooting

- If you see `auth/invalid-api-key` in production:
  - Rebuild after updating `.env` (Vite injects env at build time).
  - Confirm the API key starts with `AIza` and belongs to the same Google Cloud project as this Firebase app.
  - If API key restrictions are enabled (HTTP referrers), include both `*.web.app` and `*.firebaseapp.com` (and any custom domain).

5. Security

- Never commit `.env`. It is ignored via `.gitignore`.
- Rotate exposed API keys immediately and redeploy.
