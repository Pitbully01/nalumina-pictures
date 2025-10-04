import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

// === POST - Register or update user ===
export async function POST(req: Request) {
  const { email, name, password } = await req.json();

  // Validate required fields
  if (!email || !password) {
    return new Response("Missing email or password", { status: 400 });
  }

  // Normalize email and hash password
  const normalizedEmail = email.toLowerCase().trim();
  const passwordHash = await bcrypt.hash(password, 10);

  // Create or update user
  const user = await prisma.user.upsert({
    where: { email: normalizedEmail },
    update: { 
      name, 
      passwordHash 
    },
    create: {
      email: normalizedEmail,
      name,
      passwordHash
    },
  });

  // Return sanitized user data
  return Response.json({
    id: user.id,
    email: user.email
  });
}