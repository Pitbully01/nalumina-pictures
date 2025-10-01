# Nalumina Pictures

Eine moderne Web-Anwendung für die Verwaltung und Freigabe von Fotogalerien.

## Features

- 📸 **Galerie-Management**: Erstellen und verwalten von Fotogalerien
- 🔒 **Flexible Sichtbarkeit**: Private, Link-basierte oder PIN-geschützte Galerien
- ☁️ **Cloud Storage**: AWS S3 Integration für sichere Bildspeicherung
- 👥 **Benutzerrollen**: Photographer und Client Rollen
- 💬 **Interaktion**: Kommentare und Reaktionen (Like, Reject, Star)
- 📱 **Responsive Design**: Optimiert für alle Geräte

## Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL mit Prisma ORM
- **Storage**: AWS S3
- **Deployment**: Docker ready

## Installation

1. Repository klonen:
```bash
git clone <repository-url>
cd nalumina-pictures
```

2. Dependencies installieren:
```bash
npm install
```

3. Environment variables einrichten:
```bash
cp .env.example .env.local
# Füge deine AWS S3 und Database Credentials hinzu
```

4. Database setup:
```bash
npx prisma migrate dev
```

5. Development server starten:
```bash
npm run dev
```

## Environment Variables

```env
DATABASE_URL="postgresql://..."
AWS_REGION="eu-central-1"
AWS_ACCESS_KEY_ID="..."
AWS_SECRET_ACCESS_KEY="..."
S3_BUCKET_NAME="..."
```

## API Endpoints

- `GET /api/galleries` - Alle Galerien abrufen
- `GET /api/galleries/[id]/images` - Bilder einer Galerie
- `GET /api/images/[id]` - Einzelnes Bild abrufen
- `POST /api/uploads/s3-url` - Presigned URL für Upload

## Scripts

- `npm run dev` - Development server mit Turbopack
- `npm run build` - Production build
- `npm start` - Production server starten
- `npm run lint` - Code linting

## License

Private Project
