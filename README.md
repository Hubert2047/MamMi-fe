# MamMi POS Frontend

Next.js App Router application using React, shadcn/ui and Tailwind CSS.

## Development

```bash
npm install
npm run dev
```

The app runs at `http://localhost:3000`.

Set these variables in `.env` before starting the app:

- `NEXT_PUBLIC_API_BASE_URL` — backend API URL.
- `NEXTAUTH_SECRET` — long random secret used to sign NextAuth sessions.
- `NEXTAUTH_URL` — app URL, for example `http://localhost:3000`.

## Production

```bash
npm run build
npm start
```
