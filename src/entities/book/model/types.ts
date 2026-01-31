import { z } from 'zod';

export const BookSchema = z.object({
  isbn: z.string(),
  title: z.string(),
  author: z.string().optional(),
  publisher: z.string().optional(),
  publishYear: z.string().optional(),
  bookImageURL: z.string().optional(),
  className: z.string().optional(),
  classNo: z.string().optional(),
  vol: z.string().optional(),
  loanCnt: z.number().optional(),
  ranking: z.number().optional(),
  isVerified: z.boolean().optional(),
  tags: z.array(z.string()).optional(),
});

export type Book = z.infer<typeof BookSchema>;

export interface BookAcquisitionOptions {
  library: {
    status: 'loading' | 'success' | 'error';
    libraryCount: number;
    libraries: Array<{
      name: string;
      homepage: string;
      address: string;
    }>;
  };
  daangn: {
    webUrl: string;
    searchQuery: string;
  };
  aladin: {
    status: 'loading' | 'success' | 'error';
    offlineStock: Array<{
      storeName: string;
      price?: number;
    }>;
    onlineUsed: {
      minPrice: number;
      link: string;
    } | null;
  };
  newBook: {
    price: number;
    link: string;
  } | null;
}

export interface AgeGroup {
  id: string;
  label: string;
  minAge: number;
  maxAge: number;
  description: string;
}

export const AGE_GROUPS: AgeGroup[] = [
  { id: '0-2', label: '0-2세', minAge: 0, maxAge: 2, description: '영아기' },
  { id: '3-4', label: '3-4세', minAge: 3, maxAge: 4, description: '유아기' },
  { id: '5-6', label: '5-6세', minAge: 5, maxAge: 6, description: '취학 전' },
  { id: '7-8', label: '7-8세', minAge: 7, maxAge: 8, description: '초등 저학년' },
];
