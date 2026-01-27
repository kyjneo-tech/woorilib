'use client';

import { Book } from '@/entities/book/model/types';

export type BookshelfStatus = 'want_to_read' | 'reading' | 'finished';

export interface BookshelfItem {
  id: string;
  isbn: string;
  title: string;
  author?: string;
  bookImageUrl?: string;
  status: BookshelfStatus;
  addedAt: string;
  finishedAt?: string;
}

class BookshelfService {
  private baseUrl = '/api/bookshelf';

  /**
   * Add a book to user's bookshelf
   */
  async addBook(book: Book, status: BookshelfStatus = 'want_to_read'): Promise<BookshelfItem | null> {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          isbn: book.isbn,
          title: book.title,
          author: book.author,
          bookImage: book.bookImageURL,
          status,
        }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          console.warn('[BookshelfService] User not authenticated');
          return null;
        }
        throw new Error('Failed to add book');
      }

      const data = await response.json();
      return this.mapToItem(data.book);
    } catch (error) {
      console.error('[BookshelfService] Add book error:', error);
      return null;
    }
  }

  /**
   * Remove a book from user's bookshelf
   */
  async removeBook(isbn: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}?isbn=${encodeURIComponent(isbn)}`, {
        method: 'DELETE',
      });

      return response.ok;
    } catch (error) {
      console.error('[BookshelfService] Remove book error:', error);
      return false;
    }
  }

  /**
   * Update book status
   */
  async updateStatus(isbn: string, status: BookshelfStatus): Promise<boolean> {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isbn, status }),
      });

      return response.ok;
    } catch (error) {
      console.error('[BookshelfService] Update status error:', error);
      return false;
    }
  }

  /**
   * Get all books in user's bookshelf
   */
  async getMyBooks(status?: BookshelfStatus): Promise<BookshelfItem[]> {
    try {
      const url = status ? `${this.baseUrl}?status=${status}` : this.baseUrl;
      const response = await fetch(url);

      if (!response.ok) {
        if (response.status === 401) return [];
        throw new Error('Failed to get books');
      }

      const data = await response.json();
      return data.books.map(this.mapToItem);
    } catch (error) {
      console.error('[BookshelfService] Get books error:', error);
      return [];
    }
  }

  /**
   * Check if a book is in user's bookshelf
   */
  async isBookSaved(isbn: string): Promise<BookshelfItem | null> {
    try {
      const books = await this.getMyBooks();
      return books.find(b => b.isbn === isbn) || null;
    } catch (error) {
      console.error('[BookshelfService] Check book error:', error);
      return null;
    }
  }

  private mapToItem(row: any): BookshelfItem {
    return {
      id: row.id,
      isbn: row.isbn,
      title: row.title,
      author: row.author,
      bookImageUrl: row.bookImage,
      status: row.status,
      addedAt: row.addedAt,
      finishedAt: row.finishedAt,
    };
  }
}

export const bookshelfService = new BookshelfService();
