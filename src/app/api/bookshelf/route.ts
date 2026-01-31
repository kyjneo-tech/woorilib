import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/shared/lib/prisma';
import { createClient } from '@/shared/lib/supabase/server';

// GET /api/bookshelf - 내 책장 목록 조회
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const status = request.nextUrl.searchParams.get('status');

    const books = await prisma.bookshelf.findMany({
      where: {
        userId: user.id,
        ...(status && { status }),
      },
      orderBy: { addedAt: 'desc' },
    });

    return NextResponse.json({ books });
  } catch (error) {
    console.error('[Bookshelf API] GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/bookshelf - 책장에 추가
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { isbn, title, author, bookImage, status = 'want_to_read', domain } = body;

    if (!isbn || !title) {
      return NextResponse.json({ error: 'isbn and title are required' }, { status: 400 });
    }

    // Upsert - 이미 있으면 상태 업데이트
    const book = await prisma.bookshelf.upsert({
      where: {
        userId_isbn: {
          userId: user.id,
          isbn,
        },
      },
      update: {
        status,
        domain: domain || undefined,
        finishedAt: status === 'finished' ? new Date() : null,
      },
      create: {
        userId: user.id,
        isbn,
        title,
        author,
        bookImage,
        status,
        domain,
        finishedAt: status === 'finished' ? new Date() : null,
      },
    });

    return NextResponse.json({ book });
  } catch (error) {
    console.error('[Bookshelf API] POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/bookshelf?isbn=xxx - 책장에서 삭제
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const isbn = request.nextUrl.searchParams.get('isbn');

    if (!isbn) {
      return NextResponse.json({ error: 'isbn is required' }, { status: 400 });
    }

    await prisma.bookshelf.delete({
      where: {
        userId_isbn: {
          userId: user.id,
          isbn,
        },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Bookshelf API] DELETE error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH /api/bookshelf - 상태 변경
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { isbn, status } = body;

    if (!isbn || !status) {
      return NextResponse.json({ error: 'isbn and status are required' }, { status: 400 });
    }

    const book = await prisma.bookshelf.update({
      where: {
        userId_isbn: {
          userId: user.id,
          isbn,
        },
      },
      data: {
        status,
        finishedAt: status === 'finished' ? new Date() : null,
      },
    });

    return NextResponse.json({ book });
  } catch (error) {
    console.error('[Bookshelf API] PATCH error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
