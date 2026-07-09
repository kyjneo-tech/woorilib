
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/shared/lib/prisma';
import { requireAdmin, AuthError } from '@/shared/lib/auth-server';
import { revalidateTag } from 'next/cache';
import { z } from 'zod';

// Schema for validation
const RuleSchema = z.object({
    name: z.string().min(1),
    type: z.string().min(1),
    keywords: z.array(z.string()),
    metadata: z.record(z.string(), z.any()).optional(),

});

export async function GET(request: NextRequest) {
    try {
        await requireAdmin();

        const rules = await prisma.classificationRule.findMany({
            orderBy: [
                { type: 'asc' },
                { name: 'asc' }
            ]
        });

        return NextResponse.json(rules);
    } catch (error) {
        if (error instanceof AuthError) {
            return NextResponse.json({ error: error.message }, { status: error.statusCode });
        }
        console.error('Get Rules Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        await requireAdmin();

        const body = await request.json();
        const validation = RuleSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json({ error: 'Invalid Request', details: validation.error.format() }, { status: 400 });
        }

        const { name, type, keywords, metadata } = validation.data;

        const newRule = await prisma.classificationRule.create({
            data: {
                name,
                type,
                keywords,
                metadata: (metadata as any) || {},
            }
        });

        // Invalidate cache
        // revalidateTag('classification-rules');

        return NextResponse.json(newRule);
    } catch (error) {
        if (error instanceof AuthError) {
            return NextResponse.json({ error: error.message }, { status: error.statusCode });
        }
        console.error('Create Rule Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function PUT(request: NextRequest) {
    try {
        await requireAdmin();

        const body = await request.json();
        // ID is required for update
        const { id, ...data } = body;

        if (!id) {
            return NextResponse.json({ error: 'ID is required' }, { status: 400 });
        }

        const validation = RuleSchema.partial().safeParse(data);

        if (!validation.success) {
            return NextResponse.json({ error: 'Invalid Request', details: validation.error.format() }, { status: 400 });
        }

        const updatedRule = await prisma.classificationRule.update({
            where: { id },
            data: validation.data
        });

        // Invalidate cache
        // revalidateTag('classification-rules');

        return NextResponse.json(updatedRule);
    } catch (error) {
        if (error instanceof AuthError) {
            return NextResponse.json({ error: error.message }, { status: error.statusCode });
        }
        console.error('Update Rule Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest) {
    try {
        await requireAdmin();

        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'ID is required' }, { status: 400 });
        }

        await prisma.classificationRule.delete({
            where: { id }
        });

        // Invalidate cache
        // revalidateTag('classification-rules');

        return NextResponse.json({ success: true });
    } catch (error) {
        if (error instanceof AuthError) {
            return NextResponse.json({ error: error.message }, { status: error.statusCode });
        }
        console.error('Delete Rule Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
