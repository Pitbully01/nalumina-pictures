import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

// ===== USER REGISTRATION =====
export async function POST(req: Request) {
  const { email, name, password } = await req.json();
  
  if (!email || !password) {
    return new Response("Missing email or password", { status: 400 });
  }
  
  const normalizedEmail = email.toLowerCase().trim();
  const passwordHash = await bcrypt.hash(password, 10);
  
  const user = await prisma.user.upsert({
    where: { email: normalizedEmail },
    update: { name, passwordHash },
    create: { 
      email: normalizedEmail, 
      name, 
      passwordHash 
    },
  });
  
  return Response.json({ 
    id: user.id, 
    email: user.email 
  });
}