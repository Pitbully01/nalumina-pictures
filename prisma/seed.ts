import { PrismaClient, Role } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL
  const adminPassword = process.env.ADMIN_PASSWORD
  const adminName = process.env.ADMIN_NAME || 'Administrator'

  if (!adminEmail || !adminPassword) {
    console.log('⚠️  ADMIN_EMAIL oder ADMIN_PASSWORD nicht in .env gesetzt. Administrator wird nicht erstellt.')
    return
  }

  // Prüfen ob Administrator bereits existiert
  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail }
  })

  if (existingAdmin) {
    console.log(`✅ Administrator mit Email ${adminEmail} existiert bereits.`)
    return
  }

  // Passwort hashen
  const saltRounds = 12
  const passwordHash = await bcrypt.hash(adminPassword, saltRounds)

  // Administrator erstellen
  const admin = await prisma.user.create({
    data: {
      email: adminEmail,
      name: adminName,
      role: 'ADMIN' as Role,
      passwordHash: passwordHash
    }
  })

  console.log(`🎉 Administrator erstellt:`)
  console.log(`   Email: ${admin.email}`)
  console.log(`   Name: ${admin.name}`)
  console.log(`   Rolle: ${admin.role}`)
  console.log(`   ID: ${admin.id}`)
}

main()
  .catch((e) => {
    console.error('❌ Fehler beim Erstellen des Administrators:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

main()
  .catch((e) => {
    console.error('❌ Fehler beim Erstellen des Administrators:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
