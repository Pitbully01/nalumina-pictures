# Administrator Setup Anleitung

## Übersicht
Ihr System ist jetzt so konfiguriert, dass Sie einen Standard-Administrator über Umgebungsvariablen erstellen können.

## Was wurde eingerichtet:

### 1. Prisma Schema erweitert
- Die `Role` enum wurde um `ADMIN` erweitert
- Migration wurde erstellt und angewendet

### 2. Umgebungsvariablen hinzugefügt
In Ihrer `.env` Datei können Sie folgende Variablen setzen:
```env
ADMIN_EMAIL="admin@nalumina.com"
ADMIN_PASSWORD="admin123456"
ADMIN_NAME="System Administrator"
```

### 3. Seed Script erstellt
Das Script `prisma/seed.ts`:
- Liest die Administrator-Daten aus den Umgebungsvariablen
- Erstellt automatisch einen Administrator-Account
- Prüft, ob bereits ein Administrator mit der Email existiert
- Hasht das Passwort sicher mit bcryptjs

## Verwendung:

### Administrator erstellen/aktualisieren:
1. Passen Sie die Administrator-Daten in der `.env` Datei an:
   ```env
   ADMIN_EMAIL="ihre-email@domain.com"
   ADMIN_PASSWORD="ihr-sicheres-passwort"
   ADMIN_NAME="Ihr Name"
   ```

2. Führen Sie das Seed Script aus:
   ```bash
   npm run db:seed
   ```

### Bei jeder Migration:
Das Seed Script wird auch automatisch bei `prisma migrate dev` ausgeführt, da es in der `package.json` konfiguriert ist.

### Manueller Aufruf:
```bash
# Mit npm script
npm run db:seed

# Oder direkt
npx tsx prisma/seed.ts
```

## Sicherheitshinweise:
1. Verwenden Sie ein starkes Passwort für den Administrator
2. Ändern Sie das Standard-Passwort nach der ersten Anmeldung
3. Die `.env` Datei sollte nie in die Versionskontrolle eingecheckt werden
4. Verwenden Sie die `.env.example` als Vorlage für neue Installationen

## Administrator-Rolle:
Der Administrator hat die Rolle `ADMIN` und kann in Ihrer Anwendung entsprechend privilegierte Aktionen ausführen.
