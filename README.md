# Nalumina Pictures

Eine moderne Web-Anwendung für die Verwaltung und Freigabe von Fotogalerien mit professionellem Workflow für Fotografen und Kunden.

## Features

- 📸 **Galerie-Management**: Erstellen und verwalten von Fotogalerien mit SEO-freundlichen Slugs
- 🌐 **Öffentliche Galerien**: Automatische Cover-Generierung mit Mosaik oder manuellen Covers
- 🔒 **Flexible Sichtbarkeit**: Private und öffentliche Galerien mit isPublic-Flag
- 🔗 **Intelligente URL-Struktur**: Slug-basierte URLs mit automatischen Weiterleitungen
- ☁️ **Cloud Storage**: AWS S3/MinIO Integration für sichere Bildspeicherung
- 🖼️ **Automatische Bildverarbeitung**: Sharp-basierte Bildoptimierung mit WebP-Konvertierung
- 👥 **Benutzerrollen**: Admin, Photographer und Client Rollen mit NextAuth.js
- 🔧 **Administrator-Setup**: Automatische Administrator-Erstellung über Umgebungsvariablen
- 💬 **Interaktion**: Kommentare und Reaktionen (Like, Dislike)
- 🔐 **Sichere Authentifizierung**: Bcrypt-basierte Passwort-Hashes
- 📱 **Responsive Design**: Optimiert für alle Geräte mit professionellem Image Viewer
- ⚡ **Performance**: Turbopack für schnelle Entwicklung und Builds
- 🐳 **Container-Ready**: Docker Compose für einfache Entwicklung
- 🎯 **Erweiterte Navigation**: Hierarchische Galerien mit Parent-Child-Beziehungen
- 🔄 **Automatische Weiterleitungen**: SEO-optimiert bei Slug-Änderungen

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

# Administrator-Setup (optional)
ADMIN_EMAIL="admin@example.com"
ADMIN_PASSWORD="admin123"
ADMIN_NAME="Administrator"
```

5. Database setup:
```bash
npx prisma migrate dev
npx prisma generate

# Administrator erstellen (falls ADMIN_* Variablen gesetzt sind)
npm run db:seed
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

## Administrator Setup

Das System unterstützt die automatische Erstellung eines Standard-Administrators über Umgebungsvariablen.

### Konfiguration
Fügen Sie folgende Variablen in Ihre `.env` Datei hinzu:

```env
# Administrator-Setup
ADMIN_EMAIL="admin@example.com"
ADMIN_PASSWORD="sicheres-passwort"
ADMIN_NAME="Administrator"
```

### Administrator erstellen
```bash
# Einmalig oder bei Änderungen ausführen
npm run db:seed
```

Das Script:
- ✅ Erstellt automatisch einen Administrator mit den angegebenen Daten
- ✅ Prüft, ob bereits ein User mit der Email existiert (keine Duplikate)
- ✅ Hasht das Passwort sicher mit bcryptjs
- ✅ Weist die `ADMIN` Rolle zu

### Verwendung
- **Erste Installation**: Administrator wird automatisch bei `npm run db:seed` erstellt
- **Passwort ändern**: Neue Werte in `.env` setzen und `npm run db:seed` erneut ausführen
- **Produktionsumgebung**: Starke Passwörter verwenden und `.env` nie in Git einchecken

## Roadmap

### M1 – Untergalerien & Slugs ✅
- [x] Hierarchische Galerien mit Parent-Child-Beziehungen
- [x] SEO-freundliche Slug-basierte URLs
- [x] Automatische Slug-Weiterleitungen
- [ ] Catch-all Routing für verschachtelte Pfade
- [ ] Breadcrumb-Navigation
- [ ] Parent-Galerie Auswahl/Änderung im Admin
- [ ] Grid-Ansicht zeigt Untergalerien + Bilder kombiniert

### M2 – Feedback ⚠️
- [x] Grundlegende Like/Dislike Funktionalität
- [x] Kommentar-System (Basic CRUD)
- [x] Farb-Labels für Bilder (RED, YELLOW, GREEN, BLUE, PURPLE)
- [ ] Aggregierte Like/Dislike Anzeige
- [ ] Kommentar-Moderation für Admins
- [ ] Filter nach Farb-Labels
- [ ] Erweiterte Reaktions-Statistiken

### M3 – Sharing 🔄
- [x] Basis öffentliche Galerien (`isPublic` Flag)
- [ ] Share-Links mit verschiedenen Modi (LINK/PIN/Expiry)
- [ ] PIN-geschützte Galerien
- [ ] Ablaufende Share-Links
- [ ] Public-Ansicht Sicherheitshärtung
- [ ] Settings UI für Share-Konfiguration
- [ ] Eingeladene Benutzer per Email

### M4 – Pipeline 📋
- [x] Sharp-basierte Bildverarbeitung
- [x] WebP-Konvertierung
- [x] Drei Bildgrößen (Original, Large, Thumbnail)
- [ ] EXIF-Daten Extraktion und Anzeige
- [ ] Automatische Bildrotation basierend auf EXIF
- [ ] Asynchrone Thumbnail-Generierung mit Queue
- [ ] Retry-Mechanismus für fehlgeschlagene Verarbeitung
- [ ] Fehler-UI für Upload/Verarbeitung

### M5 – Robustheit & Performance 🔧
- [ ] Input-Validation für alle API-Endpoints
- [ ] Rate-Limiting für Uploads und API-Calls
- [ ] Application-Monitoring und Logging
- [ ] Client-side Caching mit SWR/React Query
- [ ] Server-side Caching für häufige Abfragen
- [ ] Custom `next/image` Loader für S3/MinIO
- [ ] Optimistische Updates für bessere UX

### M6 – Operations & Deployment 🚀
- [ ] Automatische Datenbank-Backups
- [ ] Backup/Restore-Mechanismus für S3-Daten
- [ ] CI/CD Pipeline mit automatisierten Tests
- [ ] Unit & Integration Tests
- [ ] CDN-Integration für Bild-Delivery
- [ ] HTTPS Deployment mit SSL-Zertifikaten
- [ ] Container-Orchestrierung (Kubernetes/Docker Swarm)
- [ ] Monitoring & Alerting (Prometheus/Grafana)

### Legende
- ✅ **Komplett**: Alle Features implementiert
- ⚠️ **Teilweise**: Grundfunktionen vorhanden, Erweiterungen geplant
- 🔄 **In Arbeit**: Aktuelle Entwicklung
- 📋 **Geplant**: Nächste Priorität
- 🔧 **Backlog**: Zukünftige Verbesserungen
- 🚀 **Vision**: Langfristige Ziele

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

# Administrator-Setup (optional)
ADMIN_EMAIL="admin@example.com"
ADMIN_PASSWORD="admin123"
ADMIN_NAME="Administrator"
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

# Administrator-Setup (optional)
ADMIN_EMAIL="admin@your-domain.com"
ADMIN_PASSWORD="secure-admin-password"
ADMIN_NAME="Administrator"
```

## API Endpoints

### Authentifizierung
- `POST /api/auth/signin` - Benutzer-Login
- `POST /api/auth/signout` - Benutzer-Logout
- `POST /api/register` - Neuen Benutzer registrieren

### Galerien
- `GET /api/galleries` - Alle Galerien abrufen (Admin-Übersicht)
- `POST /api/galleries` - Neue Galerie erstellen mit Slug-Generierung
- `GET /api/galleries/[id]` - Einzelne Galerie per ID abrufen
- `DELETE /api/galleries/[id]` - Galerie und alle Bilder löschen
- `GET /api/galleries/by-slug/[slug]` - Galerie per Slug abrufen (öffentlicher Zugang)
- `PATCH /api/galleries/by-slug/[slug]` - Galerie-Einstellungen aktualisieren
- `GET /api/galleries/redirect/[oldSlug]` - Slug-Weiterleitung auflösen
- `GET /api/public-galleries` - Öffentliche Galerien mit Cover-URLs
- `GET /api/galleries/[id]/images` - Bilder einer Galerie abrufen

### Bilder
- `GET /api/images` - Alle Bilder abrufen
- `POST /api/images` - Neuen Bilddatensatz erstellen
- `GET /api/images/[id]` - Einzelnes Bild abrufen
- `POST /api/images/[id]/process` - Bildverarbeitung (Resize, WebP-Konvertierung)

### Upload
- `POST /api/uploads/s3-url` - Presigned URL für S3/MinIO Upload generieren

## Datenmodell

### Gallery
- **URL-System**: SEO-freundliche Slugs mit automatischer Generierung aus Titeln
- **Sichtbarkeit**: `isPublic` Boolean für öffentliche/private Galerien
- **Cover-System**: Automatische Mosaik-Generierung oder manuell hochgeladene Cover
- **Hierarchie**: Parent-Child-Beziehungen für verschachtelte Galerien
- **Weiterleitungen**: Automatische SlugRedirect-Erstellung bei URL-Änderungen
- **Einstellungen**: `showIndexOverlay` für Lightroom-ähnliche Bildnummerierung
- **Beziehungen**: Owner (User), Images, SlugRedirects, Children/Parent

### Image
- **Speicherung**: Original, Large (2048px), Thumbnail (400px) mit optionalen Keys
- **Format**: Automatische WebP-Konvertierung mit Sharp
- **Metadaten**: Breite, Höhe, optionale Bildindizes und Farbmarkierungen
- **S3 Keys**: keyOriginal, keyLarge (optional), keyThumb (optional)
- **Interaktionen**: Comments, Reactions
- **Erweiterte Felder**: imageIndex, colorLabel (RED, YELLOW, GREEN, BLUE, PURPLE)

### User
- **Rolle**: `ADMIN`, `PHOTOGRAPHER` (Standard), `CLIENT`
- **Authentifizierung**: Email, Name, bcrypt-Hash für Passwort
- **Beziehungen**: Galerien (Owner), Kommentare, Reaktionen
- **Administrator**: Automatische Erstellung über Umgebungsvariablen

### Comment
- **Vereinfacht**: Direkter Bezug zu User und Image
- **Inhalt**: Einfaches Text-Feld statt Body

### Reaction
- **Typen**: `LIKE`, `DISLIKE` (vereinfacht von Like/Reject/Star)
- **Eindeutigkeit**: Ein Reaction pro User und Image
- **Tracking**: Direkte User-Zuordnung

### SlugRedirect
- **SEO-Optimierung**: Automatische Weiterleitungen bei Slug-Änderungen
- **Beziehungen**: Verweist auf aktuelle Galerie via galleryId

## Scripts

- `npm run dev` - Development server mit Turbopack
- `npm run build` - Production build mit Turbopack
- `npm start` - Production server starten
- `npm run lint` - Code linting mit ESLint 9
- `npm run version:patch` - Patch Version erhöhen
- `npm run version:minor` - Minor Version erhöhen
- `npm run version:major` - Major Version erhöhen
- `npm run db:seed` - Administrator und Seed-Daten erstellen

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

### Neue Features (v0.1.2)
- **Slug-basierte URLs**: SEO-optimierte Galerie-URLs mit automatischen Weiterleitungen
- **Öffentliche Galerien**: Homepage mit automatischen Cover-Mosaiken
- **Erweiterte Navigation**: Hierarchische Galerien und verbesserte Benutzerführung
- **Professioneller Image Viewer**: Zoom, Pan, Keyboard-Navigation
- **Verbesserte API-Struktur**: Konsistente Endpoint-Organisation und Fehlerbehandlung
- **Error Boundaries**: Professionelle 404/403/500 Fehlerseiten
- **Middleware-basierte Authentifizierung**: Schutz sensibler Bereiche

### Bildverarbeitung
- Automatische WebP-Konvertierung für bessere Performance
- Drei Bildgrößen: Original, Large (2048px), Thumbnail (400px)
- Optionale S3-Keys für flexible Speicherstrategien
- Presigned URLs für sichere S3-Uploads

### Sicherheit
- bcryptjs für Passwort-Hashing
- NextAuth.js für Session-Management
- Middleware-basierte Route-Protection
- Flexible Galerie-Sichtbarkeit (öffentlich/privat)

## Projektstruktur

```
app/
├── api/                           # Next.js API Routes
│   ├── auth/                     # NextAuth.js Authentifizierung
│   │   └── [...nextauth]/        # NextAuth.js Handler
│   ├── galleries/                # Galerie-Management APIs
│   │   ├── route.ts             # CRUD für Galerien (Admin)
│   │   ├── [id]/                # Galerie per ID
│   │   │   └── route.ts         # GET/DELETE einzelne Galerie
│   │   ├── by-slug/             # Slug-basierter Zugang
│   │   │   └── [slug]/          # Öffentlicher Galerie-Zugang
│   │   │       └── route.ts     # GET/PATCH Galerie per Slug
│   │   └── redirect/            # URL-Weiterleitungen
│   │       └── [oldSlug]/       # Alte Slug-Auflösung
│   │           └── route.ts     # Redirect-Lookup
│   ├── images/                   # Bildverarbeitung APIs
│   │   ├── route.ts             # POST neues Bild
│   │   └── [id]/               # Spezifische Bild APIs
│   │       ├── route.ts        # GET einzelnes Bild
│   │       └── process/        # Bildverarbeitung
│   │           └── route.ts    # POST Bildoptimierung
│   ├── public-galleries/         # Öffentliche Galerie-API
│   │   └── route.ts             # GET öffentliche Galerien mit Covers
│   ├── register/                 # Benutzerregistrierung
│   │   └── route.ts             # POST User-Erstellung
│   └── uploads/                  # Upload-Management
│       └── s3-url/              # S3 Presigned URLs
│           └── route.ts         # POST Upload-URL-Generierung
├── galleries/                    # Frontend Galerie-Seiten
│   ├── page.tsx                 # Admin: Alle Galerien
│   └── [slug]/                  # Galerie-Detail
│       ├── page.tsx             # Galerie-Ansicht mit Viewer
│       └── settings/            # Galerie-Einstellungen
│           └── page.tsx         # Admin: Galerie konfigurieren
├── layout.tsx                   # App Root Layout mit Navigation
├── page.tsx                     # Homepage mit öffentlichen Galerien
├── providers.tsx                # App Providers (Auth, etc.)
├── error.tsx                    # Globale Error Boundary
├── not-found.tsx               # 404 Fehlerseite
├── unauthorized.tsx            # 403 Zugriff verweigert
└── globals.css                 # Globale Styles

lib/
├── prisma.ts                   # Prisma Database Client
├── s3.ts                      # AWS S3/MinIO Client mit Operationen
└── slug.ts                    # Slug-Generierung und Eindeutigkeit

prisma/
├── schema.prisma              # Erweitertes Datenbank Schema
└── migrations/                # Datenbank Migrationen
    ├── 20251003235705_add_gallery_fields_and_social_v1npx/
    ├── 20251004143742_add_show_index_overlay/
    └── 20251004154339_add_slug_redirects/

middleware.ts                  # NextAuth Route Protection
docker-compose.yml            # Entwicklungsumgebung
next.config.ts               # Next.js Konfiguration
eslint.config.mjs           # ESLint Konfiguration
```

