import type { IncomingMessage, ServerResponse } from 'node:http';

import {
  type ChatRequest,
  chatRequestSchema,
} from '../src/entities/chat/model.ts';
import { ChatApiError, createGeminiProvider } from './gemini.ts';

export function createChatService(fetcher: typeof fetch = fetch) {
  let active = 0,
    used = 0,
    start = 0;
  return async (input: ChatRequest, key: string, model?: string) => {
    if (!key.trim()) throw new ChatApiError(503, 'NOT_CONFIGURED');
    if (Date.now() - start >= 60000) {
      start = Date.now();
      used = 0;
    }
    if (used >= 6 || active >= 2) throw new ChatApiError(429, 'RATE_LIMITED');
    used++;
    active++;
    try {
      return await createGeminiProvider(key, model, fetcher).sendMessage(input);
    } finally {
      active--;
    }
  };
}
const service = createChatService();
export async function handleChatRequest(
  req: IncomingMessage & { body?: unknown },
  res: ServerResponse,
  key: string,
  model?: string,
  run = service
) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  try {
    if (req.method !== 'POST') {
      res.setHeader('Allow', 'POST');
      throw new ChatApiError(405, 'INVALID_REQUEST');
    }
    if (
      !req.headers['content-type']?.toLowerCase().startsWith('application/json')
    )
      throw new ChatApiError(415, 'INVALID_REQUEST');
    if (req.headers['sec-fetch-site'] === 'cross-site')
      throw new ChatApiError(403, 'INVALID_REQUEST');
    if (Number(req.headers['content-length'] ?? 0) > 65536)
      throw new ChatApiError(413, 'INVALID_REQUEST');
    let raw: string;
    if (req.body !== undefined)
      raw = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
    else {
      const chunks: Buffer[] = [];
      let size = 0;
      for await (const chunk of req) {
        const bytes = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
        size += bytes.length;
        if (size > 65536) throw new ChatApiError(413, 'INVALID_REQUEST');
        chunks.push(bytes);
      }
      raw = Buffer.concat(chunks).toString('utf8');
    }
    if (Buffer.byteLength(raw) > 65536)
      throw new ChatApiError(413, 'INVALID_REQUEST');
    let body: unknown;
    try {
      body = JSON.parse(raw);
    } catch {
      throw new ChatApiError(400, 'INVALID_REQUEST');
    }
    const parsed = chatRequestSchema.safeParse(body);
    if (!parsed.success) throw new ChatApiError(400, 'INVALID_REQUEST');
    const response = await run(parsed.data, key, model);
    res.statusCode = 200;
    res.end(JSON.stringify(response));
  } catch (error) {
    const safe =
      error instanceof ChatApiError
        ? error
        : new ChatApiError(500, 'INTERNAL_ERROR');
    if (safe.code === 'RATE_LIMITED') res.setHeader('Retry-After', '60');
    res.statusCode = safe.status;
    res.end(JSON.stringify({ error: safe.code }));
  }
}
