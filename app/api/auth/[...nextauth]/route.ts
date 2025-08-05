import { handlers } from '@/auth';

// Forzar Node.js Runtime (no Edge Runtime)
export const runtime = 'nodejs';

export const { GET, POST } = handlers;