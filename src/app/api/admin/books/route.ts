
import { NextRequest, NextResponse } from 'next/server';
import { AdminBooksService } from '@/features/admin/services/admin-books.service';
import { requireAdmin, AuthError } from '@/shared/lib/auth-server';

export async function GET(request: NextRequest) {
  console.log('[BOOKS_API] 📚 Received request for book list...');
  try {
    // 🐾 Check Auth
    try {
      await requireAdmin();
      console.log('[BOOKS_API] ✅ Admin verified.');
    } catch (authErr: any) {
      console.warn('[BOOKS_API] ❌ Admin verification failed:', authErr.message);
      // For now, in dev, we might want to know if this is the cause
      if (process.env.NODE_ENV === 'development') {
        console.log('[BOOKS_API] 🛠️ Development mode: Proceeding despite auth failure...');
      } else {
        throw authErr;
      }
    }

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || undefined;
    const status = searchParams.get('status') || undefined;

    console.log('[BOOKS_API] 🔍 Fetching with params:', { page, limit, search, status });
    const result = await AdminBooksService.getBooks({ page, limit, search, status });
    
    console.log('[BOOKS_API] ✅ Success. Fetched', result.data.length, 'books.');
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('[BOOKS_API] 💥 CRITICAL ERROR:', error.message);
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}
