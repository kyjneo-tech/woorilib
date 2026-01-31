import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/shared/lib/supabase/server";
import { ReadingRecordService } from "@/features/reading-record/lib/record-service";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const childId = searchParams.get('childId');

    const history = await ReadingRecordService.getHistory(user.id, childId || undefined);
    return NextResponse.json({ records: history });

  } catch (error) {
    console.error('[ReadingRecord] API Error:', error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient(); // Await because createClient is async
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error('[API/Records] Auth Failed:', authError);
      return NextResponse.json({ error: "Unauthorized", details: authError }, { status: 401 });
    }

    const body = await request.json();
    console.log('[API/Records] Request Body:', body);

    if (!body.isbn || !body.title) {
        return NextResponse.json({ error: "Missing Required Fields (isbn, title)" }, { status: 400 });
    }

    const result = await ReadingRecordService.addRecord(user.id, body);

    return NextResponse.json(result);

  } catch (error) {
    console.error('[ReadingRecord] API Error:', error);
    // Return the actual error message for debugging
    return NextResponse.json({ error: "Internal Server Error", details: String(error) }, { status: 500 });
  }
}
