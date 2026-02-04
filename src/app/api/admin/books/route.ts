
import { NextRequest, NextResponse } from 'next/server';
import { AdminBooksService } from '../../../../features/admin/services/admin-books.service';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || undefined;
    const status = searchParams.get('status') || undefined;

    const result = await AdminBooksService.getBooks({ page, limit, search, status });
    return NextResponse.json(result);
  } catch (error) {
    console.error('Books List API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
