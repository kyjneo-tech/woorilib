
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface BookFilter {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
}

export class AdminBooksService {
  static async getBooks(filter: BookFilter) {
    const page = filter.page || 1;
    const limit = filter.limit || 20;
    const skip = (page - 1) * limit;

    const whereCondition: any = {};

    if (filter.search) {
      whereCondition.OR = [
        { title: { contains: filter.search, mode: 'insensitive' } },
        { author: { contains: filter.search, mode: 'insensitive' } },
        { isbn13: { contains: filter.search } }
      ];
    }

    if (filter.status && filter.status !== 'ALL') {
      whereCondition.verification_status = filter.status;
    }

    const [books, total] = await Promise.all([
      prisma.verified_books.findMany({
        where: whereCondition,
        skip,
        take: limit,
        orderBy: { created_at: 'desc' }
      }),
      prisma.verified_books.count({ where: whereCondition })
    ]);

    return {
      data: books,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  static async updateBook(isbn: string, data: any) {
    return await prisma.verified_books.update({
      where: { isbn13: isbn },
      data: {
        ...data,
        updated_at: new Date()
      }
    });
  }

  static async deleteBook(isbn: string) {
    // Soft delete logic could be applied here (e.g. status = 'deleted')
    // But for admin, hard delete is often expected or soft delete.
    // Let's use hard delete for now as per plan, or status='deleted'
    // Plan said Delete. Let's do delete.
    return await prisma.verified_books.delete({
      where: { isbn13: isbn }
    });
  }
}
