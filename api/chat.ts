import type { IncomingMessage, ServerResponse } from 'node:http';
import { env } from 'node:process';

import { handleChatRequest } from '../server/chat.ts';
export default function handler(
  req: IncomingMessage & { body?: unknown },
  res: ServerResponse
) {
  return handleChatRequest(
    req,
    res,
    env.GEMINI_API_KEY ?? '',
    env.GEMINI_MODEL || undefined
  );
}
export const config = { maxDuration: 30 };
