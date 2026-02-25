import { createClient } from '@libsql/client';

const url = import.meta.env.VITE_TURSO_DATABASE_URL;
const authToken = import.meta.env.VITE_TURSO_AUTH_TOKEN;

if (!url) {
    throw new Error('Missing VITE_TURSO_DATABASE_URL environment variable.');
}

export const turso = createClient({
    url,
    authToken,
});
