export interface ReadingRecord {
  id: string;
  userId: string;
  childId?: string;
  isbn: string;
  bookTitle: string;
  bookAuthor?: string;
  bookCover?: string;
  readDate: string; // ISO Date
  created_at: string;
}

export interface CreateRecordDTO {
  isbn: string;
  title: string;
  author?: string;
  cover?: string;
  childId?: string; // Optional (if not selected, defaults to family/user record)
}
