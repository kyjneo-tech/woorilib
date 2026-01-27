import { useState, useEffect } from 'react';
import { bookshelfService, BookshelfItem } from '@/features/bookshelf/lib/bookshelf-service';

export interface Stats {
  total: number;
  finished: number;
  reading: number;
  wantToRead: number;
  thisMonth: number;
  streak: number;
}

export function useStats(isAuthenticated: boolean) {
  const [books, setBooks] = useState<BookshelfItem[]>([]);
  const [stats, setStats] = useState<Stats>({
    total: 0, finished: 0, reading: 0, wantToRead: 0, thisMonth: 0, streak: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isAuthenticated) {
      loadStats();
    }
  }, [isAuthenticated]);

  const loadStats = async () => {
    setLoading(true);
    try {
      const allBooks = await bookshelfService.getMyBooks();
      setBooks(allBooks);

      const now = new Date();
      const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

      const finished = allBooks.filter(b => b.status === 'finished');
      const thisMonthFinished = finished.filter(b =>
        b.finishedAt && new Date(b.finishedAt) >= thisMonthStart
      );

      setStats({
        total: allBooks.length,
        finished: finished.length,
        reading: allBooks.filter(b => b.status === 'reading').length,
        wantToRead: allBooks.filter(b => b.status === 'want_to_read').length,
        thisMonth: thisMonthFinished.length,
        streak: calculateStreak(finished),
      });
    } catch (error) {
      console.error("Failed to load stats", error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStreak = (finishedBooks: BookshelfItem[]): number => {
    if (finishedBooks.length === 0) return 0;

    const now = new Date();
    let streak = 0;
    let checkMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    for (let i = 0; i < 12; i++) {
      const monthStart = new Date(checkMonth);
      const monthEnd = new Date(checkMonth.getFullYear(), checkMonth.getMonth() + 1, 0);

      const hasBook = finishedBooks.some(b => {
        if (!b.finishedAt) return false;
        const finishedDate = new Date(b.finishedAt);
        return finishedDate >= monthStart && finishedDate <= monthEnd;
      });

      if (hasBook) {
        streak++;
        checkMonth.setMonth(checkMonth.getMonth() - 1);
      } else {
        break;
      }
    }
    return streak;
  };

  const getMonthlyData = () => {
    const months: { month: string; count: number }[] = [];
    const now = new Date();

    for (let i = 5; i >= 0; i--) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);

      const count = books.filter(b => {
        if (b.status !== 'finished' || !b.finishedAt) return false;
        const finishedDate = new Date(b.finishedAt);
        return finishedDate >= monthDate && finishedDate <= monthEnd;
      }).length;

      months.push({
        month: `${monthDate.getMonth() + 1}월`,
        count,
      });
    }
    return months;
  };

  return {
    books,
    stats,
    loading,
    getMonthlyData,
    refresh: loadStats
  };
}
