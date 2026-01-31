import { prisma } from "@/shared/lib/prisma";
import { CreateRecordDTO } from "@/entities/reading-record/model/types";
import { ClassificationService } from "@/features/classification/lib/classification.service";

export class ReadingRecordService {
  
  static async addRecord(userId: string, data: CreateRecordDTO) {
    // 1. Smart Default: If childId is missing check if user has only 1 child
    let targetChildId = data.childId;

    if (!targetChildId) {
       const children = await prisma.childProfile.findMany({
         where: { userId },
         select: { id: true }
       });
       
       if (children.length === 1) {
         targetChildId = children[0].id;
       }
    }

    // 2. Classify Domain
    const { domain } = ClassificationService.classify(data.title);

    // 3. Transaction: Record History + Sync Bookshelf
    const result = await prisma.$transaction(async (tx) => {
        // A. Insert Record
        const record = await tx.reading_records.create({
            data: {
                user_id: userId,
                child_id: targetChildId,
                isbn: data.isbn,
                book_title: data.title,
                book_author: data.author,
                book_cover: data.cover,
                read_date: new Date(), 
                domain: domain,
            }
        });

        // B. Upsert to Bookshelf (Mark as Finished)
        await tx.bookshelf.upsert({
            where: {
                userId_isbn: {
                    userId,
                    isbn: data.isbn
                }
            },
            update: {
                status: 'finished',
                finishedAt: new Date(),
                domain: domain,
            },
            create: {
                userId,
                isbn: data.isbn,
                title: data.title,
                author: data.author,
                bookImage: data.cover,
                status: 'finished',
                finishedAt: new Date(),
                domain: domain,
            }
        });

        return record;
    });

    return result;
  }



  static async getHistory(userId: string, childId?: string) {
    return prisma.reading_records.findMany({
      where: { 
        user_id: userId,
        ...(childId ? { child_id: childId } : {})
      },
      orderBy: { read_date: 'desc' },
      take: 20
    });
  }
}
