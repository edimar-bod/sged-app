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

---

# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
