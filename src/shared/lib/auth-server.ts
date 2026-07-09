import { createClient } from './supabase/server';

export class AuthError extends Error {
    constructor(message: string, public statusCode: number = 401) {
        super(message);
        this.name = 'AuthError';
    }
}

export async function requireAdmin() {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user || !user.email) {
        throw new AuthError('Unauthorized: Please log in.', 401);
    }

    const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || '')
        .split(',')
        .map(email => email.trim())
        .filter(Boolean);

    if (!ADMIN_EMAILS.includes(user.email)) {
        throw new AuthError('Forbidden: You do not have admin access.', 403);
    }

    return user;
}
