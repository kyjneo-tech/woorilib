
import { PrismaClient } from '@prisma/client';
import fs from 'fs';

const prisma = new PrismaClient();

// Read JSON from stdin
async function readStdin(): Promise<string> {
  return new Promise((resolve, reject) => {
    let data = '';
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', chunk => {
      data += chunk;
    });
    process.stdin.on('end', () => {
      resolve(data);
    });
    process.stdin.on('error', reject);
  });
}

async function main() {
  try {
    const inputData = await readStdin();
    if (!inputData) {
      console.error('No input data provided');
      process.exit(1);
    }

    // Clean up: Remove lines starting with [dotenv
    const cleanInput = inputData.replace(/^\[dotenv.*$/gm, '').trim();

    // Find the JSON array
    const startIndex = cleanInput.indexOf('[');
    const endIndex = cleanInput.lastIndexOf(']');
    
    if (startIndex === -1 || endIndex === -1) {
        console.error('No valid JSON array found in input.');
        console.error('Cleaned Input:', cleanInput.substring(0, 200) + '...');
        process.exit(1);
    }

    const finalJson = cleanInput.substring(startIndex, endIndex + 1);
    
    let books;
    try {
        books = JSON.parse(finalJson);
    } catch (e) {
        console.error('❌ JSON Parse Error:', e);
        console.error('--- DEBUG INFO ---');
        console.error('Final String Head:', finalJson.substring(0, 200));
        process.exit(1);
    }
    
    // Ensure it's an array
    const bookList = Array.isArray(books) ? books : [books];

    console.error(`[Save] Processing ${bookList.length} verified books...`);

        for (const book of bookList) {

          try {

            if (!book.isbn13) {

              console.error(`Skipping book without ISBN: ${book.title}`);

              continue;

            }

    

            // 1. Normalize ISBN (Remove hyphens)

            const normalizedIsbn = book.isbn13.replace(/-/g, '');

    

            // 2. Check Existing Book

            const existingBook = await prisma.verified_books.findUnique({

              where: { isbn13: normalizedIsbn }

            });

    

                    // 3. Smart Merge Logic

    

                    let finalTags = book.tags || [];

    

                    let finalDevAreas = book.developmental_areas || [];

    

                    let finalKeywords = book.emotional_keywords || [];

    

                    let finalSubComps = book.sub_competencies || []; // New

    

                    let finalPens = book.compatible_pens || [];

    

            

    

                    if (existingBook) {

    

                       finalTags = Array.from(new Set([...existingBook.tags, ...finalTags]));

    

                       finalDevAreas = Array.from(new Set([...existingBook.developmental_areas, ...finalDevAreas]));

    

                       finalKeywords = Array.from(new Set([...existingBook.emotional_keywords, ...finalKeywords]));

    

                       finalSubComps = Array.from(new Set([...existingBook.sub_competencies, ...finalSubComps])); // Merge

    

                       finalPens = Array.from(new Set([...existingBook.compatible_pens, ...finalPens]));

    

                    }

    

            

    

                    // Prepare Payload

    

                    const payload = {

    

                      // ... (Existing fields)

    

                      isbn13: normalizedIsbn,

    

                      title: book.title,

    

                      author: book.author || existingBook?.author,

    

                      publisher: book.publisher || existingBook?.publisher,

    

                      pub_date: book.pubDate ? new Date(book.pubDate) : existingBook?.pub_date,

    

                      cover_url: book.cover || existingBook?.cover_url,

    

                      cover_url_naver: book.cover_url_naver || existingBook?.cover_url_naver,

    

                      description: (book.description && book.description.length > (existingBook?.description?.length || 0)) 

    

                                   ? book.description 

    

                                   : existingBook?.description,

    

                      price_standard: book.priceStandard || existingBook?.price_standard,

    

                      price_used_min: book.price_used_min || existingBook?.price_used_min,

    

                      type: book.categoryName?.includes('전집') ? 'series' : 'single',

    

                      

    

                      target_months_min: book.target_months_min || existingBook?.target_months_min,

    

                      target_months_max: book.target_months_max || existingBook?.target_months_max,

    

                      energy_level: book.energy_level ?? existingBook?.energy_level,

    

                      volume_number: book.volume_number || existingBook?.volume_number,

    

                      ai_comment: book.ai_comment || existingBook?.ai_comment,

    

            

    

                      developmental_areas: finalDevAreas,

    

                      sub_competencies: finalSubComps, // Save new field

    

                      emotional_keywords: finalKeywords,

    

                      curation_points: book.curation_points || existingBook?.curation_points || [],

    

                      compatible_pens: finalPens,

    

                      tags: finalTags,

    

                      

    

                      verification_status: book.verification_status || existingBook?.verification_status || 'pending',

    

                      confidence_score: book.confidence_score || existingBook?.confidence_score || 80,

    

                      audit_log: book.audit_log || [],

    

                      source: 'aladin-agent',

    

                      is_verified: true,

    

                    };

    

            // 4. Save

            if (existingBook) {

                await prisma.verified_books.update({

                    where: { isbn13: normalizedIsbn },

                    data: payload

                });

                console.error(`🔄 Merged & Updated: ${book.title}`);

            } else {

                await prisma.verified_books.create({

                    data: payload

                });

                console.error(`✅ Created New: ${book.title}`);

            }

    

          } catch (innerError) {

            console.error(`❌ Failed to save book: ${book.title}`, innerError);

          }

        }
  } catch (error) {
    console.error('Failed to save verified books:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
