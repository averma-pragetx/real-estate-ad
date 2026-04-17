# Frontend

The actual running frontend code lives in the project root under `src/` because this app is a Vite + React SPA and Vite expects that location.

This `frontend/` folder is kept as a logical pointer per the requested project layout.

- App entry: `../src/main.tsx`
- Pages: `../src/pages/`
- Components: `../src/components/`
- Backend wrapper (Gemini): `../backend/`

## Configure backend URL

The frontend calls the backend via `VITE_BACKEND_URL`. If unset, it defaults to `http://localhost:8787`.

Create a `.env` (or set the env var) at the project root:

```
VITE_BACKEND_URL=https://your-deployed-backend.example.com
```
