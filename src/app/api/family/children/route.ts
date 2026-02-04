import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/shared/lib/supabase/server";
import { prisma } from "@/shared/lib/prisma";

// GET: List Children
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const children = await prisma.childProfile.findMany({
      where: { userId: user.id },
      orderBy: { birthYear: 'asc' }
    });

    return NextResponse.json({ children });

  } catch (error) {
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}

// POST: Add Child
export async function POST(request: NextRequest) {
    try {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
  
      if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  
      const body = await request.json();
      const { name, birthYear, emoji } = body;
  
      const child = await prisma.childProfile.create({
          data: {
              id: crypto.randomUUID(), // Explicitly provide ID to satisfy TS
              userId: user.id,
              name,
              birthYear: parseInt(birthYear),
              emoji: emoji || '👶'
          }
      });
  
      return NextResponse.json({ child });
  
    } catch (error) {
      return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}

// DELETE: Remove Child (need ID)
export async function DELETE(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
    
        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { searchParams } = new URL(request.url);
        const childId = searchParams.get('id');

        if (!childId) return NextResponse.json({ error: "Missing ID" }, { status: 400 });

        // Verify ownership
        const child = await prisma.childProfile.findUnique({ where: { id: childId } });
        if (!child || child.userId !== user.id) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        await prisma.childProfile.delete({ where: { id: childId } });

        return NextResponse.json({ success: true });
    
      } catch (error) {
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
      }
}
