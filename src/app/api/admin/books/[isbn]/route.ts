import { NextRequest, NextResponse } from 'next/server';
import { AdminBooksService } from '../../../../../features/admin/services/admin-books.service';

interface Props {
  params: Promise<{ isbn: string }>;
}

export async function PATCH(request: NextRequest, { params }: Props) {
  try {
    const { isbn } = await params;
    const body = await request.json();
    const result = await AdminBooksService.updateBook(isbn, body);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Update Book API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: Props) {
  try {
    const { isbn } = await params;
    await AdminBooksService.deleteBook(isbn);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete Book API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}