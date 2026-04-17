# Backend — Gemini Wrapper

A minimal Node.js (Express) wrapper around Google's Gemini `gemini-2.5-flash-image` (Nano Banana) image generation API. Keeps your `GEMINI_API_KEY` server-side; the frontend never sees it.

## Why a wrapper?

- **Security**: `GEMINI_API_KEY` stays on the server.
- **Prompt control**: We craft a high-quality real-estate ad prompt server-side from form fields.
- **Image input handling**: Accepts uploaded property photos and forwards them to Gemini as inline image parts.

## Files

- `server.js` — Express server exposing `POST /api/generate-ad`
- `gemini.js` — Gemini API call helper
- `package.json` — dependencies

## Run locally

```bash
cd backend
npm install
export GEMINI_API_KEY=your_key_here
npm start
# server on http://localhost:8787
```

Then in the project root, set `VITE_BACKEND_URL=http://localhost:8787` and run the frontend.

## Deploy

Deploy `backend/` to any Node host (Render, Railway, Fly, your own VPS, Cloud Run, etc.). Set `GEMINI_API_KEY` as an env var on the host. Then point the frontend at the deployed URL via `VITE_BACKEND_URL`.

## API

### `POST /api/generate-ad`

**Body (JSON)**:
```json
{
  "companyName": "Skyline Realty",
  "agentName": "Jane Doe",
  "agentPhone": "+1 555 123 4567",
  "propertyType": "Apartment",
  "listingType": "For Sale",
  "price": "$1,250,000",
  "location": "Downtown Manhattan, NY",
  "size": "1,800 sq ft",
  "bedrooms": 3,
  "bathrooms": 2,
  "highlights": ["Rooftop pool", "City view", "Smart home"],
  "description": "Luxury 3BR with floor-to-ceiling windows...",
  "format": "square",        // "square" | "portrait" | "landscape"
  "style": "luxury-modern",   // optional style hint
  "photos": [                  // optional, base64 data URLs
    "data:image/jpeg;base64,...."
  ]
}
```

**Response**:
```json
{
  "image": "data:image/png;base64,....",
  "mimeType": "image/png"
}
```
