# Nalumina Pictures

Eine moderne Web-Anwendung für die Verwaltung und Freigabe von Fotogalerien.

## Features

- 📸 **Galerie-Management**: Erstellen und verwalten von Fotogalerien
- 🔒 **Flexible Sichtbarkeit**: Private, Link-basierte oder PIN-geschützte Galerien
- ☁️ **Cloud Storage**: AWS S3 Integration für sichere Bildspeicherung
- �️ **Automatische Bildverarbeitung**: Sharp-basierte Bildoptimierung mit WebP-Konvertierung
- �👥 **Benutzerrollen**: Photographer und Client Rollen
- 💬 **Interaktion**: Kommentare und Reaktionen (Like, Reject, Star)
- 📱 **Responsive Design**: Optimiert für alle Geräte
- ⚡ **Performance**: Turbopack für schnelle Entwicklung und Builds

## Tech Stack

- **Frontend**: Next.js 15.5.4, React 19.1.0, TypeScript 5, Tailwind CSS 4
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL mit Prisma ORM 6.16.3
- **Storage**: AWS S3 mit SDK v3
- **Bildverarbeitung**: Sharp 0.34.4
- **Development**: Turbopack, ESLint 9
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
```env
# .env.local erstellen mit folgenden Variablen:
DATABASE_URL="postgresql://username:password@localhost:5432/nalumina_pictures"
AWS_REGION="eu-central-1"
AWS_ACCESS_KEY_ID="your-access-key"
AWS_SECRET_ACCESS_KEY="your-secret-key"
S3_BUCKET_NAME="your-bucket-name"
```

4. Database setup:
```bash
npx prisma migrate dev
npx prisma generate
```

5. Development server starten:
```bash
npm run dev
```

Die Anwendung ist dann unter `http://localhost:3000` verfügbar.

## Environment Variables

```env
DATABASE_URL="postgresql://..."
AWS_REGION="eu-central-1"
AWS_ACCESS_KEY_ID="..."
AWS_SECRET_ACCESS_KEY="..."
S3_BUCKET_NAME="..."
```

## API Endpoints

### Galerien
- `GET /api/galleries` - Alle Galerien abrufen
- `POST /api/galleries` - Neue Galerie erstellen
- `GET /api/galleries/[id]/images` - Bilder einer Galerie abrufen

### Bilder
- `GET /api/images/[id]` - Einzelnes Bild abrufen
- `POST /api/images/[id]/process` - Bildverarbeitung (Resize, WebP-Konvertierung)

### Upload
- `POST /api/uploads/s3-url` - Presigned URL für S3 Upload generieren

## Datenmodell

### Gallery
- **Visibility**: `PRIVATE`, `LINK`, `PIN`
- **Beziehungen**: Owner (User), Images, Optional: PIN-Hash, Share-Expires

### Image
- **Speicherung**: Original, Large (2048px), Thumbnail (400px)
- **Format**: Automatische WebP-Konvertierung
- **Metadaten**: Breite, Höhe, EXIF-Daten
- **Interaktionen**: Comments, Reactions

### User & Reaktionen
- **Rollen**: `PHOTOGRAPHER`, `CLIENT`
- **Reaktionen**: `LIKE`, `REJECT`, `STAR`

## Scripts

- `npm run dev` - Development server mit Turbopack
- `npm run build` - Production build mit Turbopack
- `npm start` - Production server starten
- `npm run lint` - Code linting mit ESLint 9
- `npm run version:patch` - Patch Version erhöhen
- `npm run version:minor` - Minor Version erhöhen
- `npm run version:major` - Major Version erhöhen

## Docker Deployment

```bash
# Mit Docker Compose
docker-compose up -d
```

## Entwicklung

Das Projekt nutzt moderne Web-Technologien:

- **Turbopack** für extrem schnelle Builds und Hot Reloads
- **Sharp** für hochperformante Bildverarbeitung
- **Prisma** für type-safe Database Operations
- **AWS S3 SDK v3** für optimierte Cloud Storage
- **TypeScript 5** für bessere Developer Experience

## Projektstruktur

```
app/
├── api/               # API Routes
│   ├── galleries/     # Galerie-Management
│   ├── images/        # Bildverarbeitung
│   └── uploads/       # S3 Upload URLs
├── layout.tsx         # App Layout
└── page.tsx          # Homepage
lib/
├── prisma.ts         # Database Client
└── s3.ts            # AWS S3 Client
prisma/
├── schema.prisma     # Datenbank Schema
└── migrations/       # DB Migrationen
```

