# Nalumina Pictures

Eine moderne Web-Anwendung für die Verwaltung und Freigabe von Fotogalerien mit professionellem Workflow für Fotografen und Kunden.

## Features

- 📸 **Galerie-Management**: Erstellen und verwalten von Fotogalerien
- 🔒 **Flexible Sichtbarkeit**: Private, Link-basierte oder PIN-geschützte Galerien
- ☁️ **Cloud Storage**: AWS S3/MinIO Integration für sichere Bildspeicherung
- 🖼️ **Automatische Bildverarbeitung**: Sharp-basierte Bildoptimierung mit WebP-Konvertierung
- 👥 **Benutzerrollen**: Photographer und Client Rollen mit NextAuth.js
- 💬 **Interaktion**: Kommentare und Reaktionen (Like, Reject, Star)
- 🔐 **Sichere Authentifizierung**: Bcrypt-basierte Passwort-Hashes
- 📱 **Responsive Design**: Optimiert für alle Geräte
- ⚡ **Performance**: Turbopack für schnelle Entwicklung und Builds
- 🐳 **Container-Ready**: Docker Compose für einfache Entwicklung

## Tech Stack

- **Frontend**: Next.js 15.5.4, React 19.1.0, TypeScript 5, Tailwind CSS 4
- **Backend**: Next.js API Routes, NextAuth.js 4.24.11
- **Database**: PostgreSQL 16 mit Prisma ORM 6.16.3
- **Storage**: AWS S3 SDK v3.899.0 oder MinIO (lokal)
- **Bildverarbeitung**: Sharp 0.34.4
- **Authentifizierung**: NextAuth.js mit bcryptjs
- **Development**: Turbopack, ESLint 9
- **Deployment**: Docker Compose

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

3. Entwicklungsumgebung mit Docker starten:
```bash
docker-compose up -d
```
Dies startet:
- PostgreSQL 16 Datenbank (Port 5432)
- MinIO S3-kompatible Storage (Port 9000, Console: 9001)

4. Environment variables einrichten:
```env
# .env.local erstellen mit folgenden Variablen:
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/picdrop"
AWS_REGION="us-east-1"
AWS_ACCESS_KEY_ID="minio"
AWS_SECRET_ACCESS_KEY="minio12345"
S3_BUCKET_NAME="nalumina-pictures"
S3_ENDPOINT="http://localhost:9000"
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"
```

5. Database setup:
```bash
npx prisma migrate dev
npx prisma generate
```

6. MinIO Bucket erstellen:
   - Öffne http://localhost:9001
   - Login: minio / minio12345
   - Erstelle Bucket "nalumina-pictures"

7. Development server starten:
```bash
npm run dev
```

Die Anwendung ist dann unter `http://localhost:3000` verfügbar.

## Environment Variables

### Lokale Entwicklung (mit Docker Compose)
```env
# .env.local
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/picdrop"
AWS_REGION="us-east-1"
AWS_ACCESS_KEY_ID="minio"
AWS_SECRET_ACCESS_KEY="minio12345"
S3_BUCKET_NAME="nalumina-pictures"
S3_ENDPOINT="http://localhost:9000"
NEXTAUTH_SECRET="your-nextauth-secret"
NEXTAUTH_URL="http://localhost:3000"
```

### Produktion (AWS S3)
```env
# .env.local
DATABASE_URL="postgresql://username:password@host:5432/database"
AWS_REGION="eu-central-1"
AWS_ACCESS_KEY_ID="your-aws-access-key"
AWS_SECRET_ACCESS_KEY="your-aws-secret-key"
S3_BUCKET_NAME="your-s3-bucket"
NEXTAUTH_SECRET="your-production-secret"
NEXTAUTH_URL="https://your-domain.com"
```

## API Endpoints

### Authentifizierung
- `POST /api/auth/signin` - Benutzer-Login
- `POST /api/auth/signout` - Benutzer-Logout
- `POST /api/register` - Neuen Benutzer registrieren

### Galerien
- `GET /api/galleries` - Alle Galerien abrufen
- `POST /api/galleries` - Neue Galerie erstellen
- `GET /api/galleries/[id]` - Einzelne Galerie abrufen
- `GET /api/galleries/[id]/images` - Bilder einer Galerie abrufen

### Bilder
- `GET /api/images` - Alle Bilder abrufen
- `GET /api/images/[id]` - Einzelnes Bild abrufen
- `POST /api/images/[id]/process` - Bildverarbeitung (Resize, WebP-Konvertierung)

### Upload
- `POST /api/uploads/s3-url` - Presigned URL für S3/MinIO Upload generieren

## Datenmodell

### User
- **Rolle**: `PHOTOGRAPHER` (Standard), `CLIENT`
- **Authentifizierung**: Email, Name, bcrypt-Hash für Passwort
- **Beziehungen**: Galerien (Owner), Kommentare

### Gallery
- **Sichtbarkeit**: `PRIVATE`, `LINK`, `PIN`
- **Sicherheit**: Optional PIN-Hash, Share-Expires für zeitliche Begrenzung
- **Beziehungen**: Owner (User), Images, Optional: Invited Email

### Image
- **Speicherung**: Original, Large (2048px), Thumbnail (400px)
- **Format**: Automatische WebP-Konvertierung mit Sharp
- **Metadaten**: Breite, Höhe, EXIF-Daten (JSON)
- **S3 Keys**: keyOriginal, keyLarge, keyThumb
- **Interaktionen**: Comments, Reactions

### Comment
- **Flexibilität**: Autor kann User oder anonymer Name sein
- **Beziehungen**: Image, Optional Author (User)

### Reaction
- **Typen**: `LIKE`, `REJECT`, `STAR`
- **Tracking**: Per Email oder User ID

## Scripts

- `npm run dev` - Development server mit Turbopack
- `npm run build` - Production build mit Turbopack
- `npm start` - Production server starten
- `npm run lint` - Code linting mit ESLint 9
- `npm run version:patch` - Patch Version erhöhen
- `npm run version:minor` - Minor Version erhöhen
- `npm run version:major` - Major Version erhöhen

## Docker Deployment

### Entwicklung
```bash
# Services starten (PostgreSQL + MinIO)
docker-compose up -d

# Services stoppen
docker-compose down

# Mit Daten löschen
docker-compose down -v
```

### Produktion
Das Projekt ist bereit für Container-Deployment. Erstellen Sie ein `Dockerfile` für die Next.js-Anwendung und verwenden Sie externe PostgreSQL- und S3-Services.

## Entwicklung

Das Projekt nutzt moderne Web-Technologien:

- **Turbopack** für extrem schnelle Builds und Hot Reloads
- **Sharp 0.34.4** für hochperformante Bildverarbeitung
- **Prisma 6.16.3** für type-safe Database Operations
- **AWS S3 SDK v3.899.0** für optimierte Cloud Storage
- **NextAuth.js 4.24.11** für sichere Authentifizierung
- **TypeScript 5** für bessere Developer Experience
- **React 19.1.0** mit Server Components
- **Tailwind CSS 4** für modernen, responsive Styling

### Bildverarbeitung
- Automatische WebP-Konvertierung für bessere Performance
- Drei Bildgrößen: Original, Large (2048px), Thumbnail (400px)
- EXIF-Daten Extraktion und Speicherung
- Presigned URLs für sichere S3-Uploads

### Sicherheit
- bcryptjs für Passwort-Hashing
- NextAuth.js für Session-Management
- PIN-geschützte Galerien mit Hash-Verifikation
- Zeitlich begrenzte Galerie-Freigaben

## Projektstruktur

```
app/
├── api/                    # Next.js API Routes
│   ├── auth/              # NextAuth.js Authentifizierung
│   │   └── [...nextauth]/ # NextAuth.js Handler
│   ├── galleries/         # Galerie-Management APIs
│   │   └── [id]/         # Spezifische Galerie APIs
│   │       └── images/   # Galerie-Bilder APIs
│   ├── images/           # Bildverarbeitung APIs
│   │   └── [id]/        # Spezifische Bild APIs
│   │       └── process/ # Bildverarbeitung
│   ├── register/         # Benutzerregistrierung
│   └── uploads/          # Upload-Management
│       └── s3-url/      # S3 Presigned URLs
├── layout.tsx            # App Root Layout
├── page.tsx             # Homepage
├── providers.tsx        # App Providers (Auth, etc.)
└── globals.css          # Globale Styles

lib/
├── prisma.ts            # Prisma Database Client
└── s3.ts               # AWS S3/MinIO Client

prisma/
├── schema.prisma        # Datenbank Schema
└── migrations/          # Datenbank Migrationen

public/                  # Statische Assets
docker-compose.yml       # Entwicklungsumgebung
next.config.ts          # Next.js Konfiguration
tailwind.config.js      # Tailwind CSS Konfiguration
```

