import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import test from 'node:test';

import { createChatService, handleChatRequest } from '../server/chat.ts';
import { createGeminiProvider, geminiPayload } from '../server/gemini.ts';
import {
  chatInventory,
  chatRequestSchema,
  recentConversation,
} from '../src/entities/chat/model.ts';
import { productSchema } from '../src/entities/product/model.ts';

const input = {
  language: 'ru' as const,
  today: '2026-10-03',
  fridge: [
    { name: 'fresh', expiresAt: '2026-10-03' },
    { name: 'expired', expiresAt: '2026-10-02' },
  ],
  messages: [{ role: 'user' as const, text: 'Test fixture' }],
};
const reply = {
  candidates: [
    {
      finishReason: 'STOP',
      content: {
        parts: [
          { text: 'private reasoning', thought: true },
          { text: 'Test reply' },
        ],
      },
    },
  ],
};
const mockFetch: typeof fetch = async () => new Response(JSON.stringify(reply));
test('client context excludes expired products and strips inventory IDs and API names', () => {
  const base = {
    id: '1',
    name: 'fixture',
    apiName: 'fixture',
    type: 'other',
    fridgeZone: 'door',
    addedAt: '2026-10-03',
  };
  const products = [
    productSchema.parse(base),
    productSchema.parse({ ...base, id: '2', expiresAt: '2026-10-02' }),
  ];
  const data = chatInventory(products, new Date(2026, 9, 3));
  assert.equal(data.fridge.length, 1);
  assert.equal('id' in data.fridge[0], false);
  assert.equal('apiName' in data.fridge[0], false);
});
test('server independently excludes expired items and preserves current inventory rules', () => {
  const payload = geminiPayload(input);
  const system = payload.systemInstruction.parts[0].text;
  assert.equal(system.includes('"name":"expired"'), false);
  assert.ok(system.includes('"name":"fresh"'));
  assert.ok(system.includes('Russian'));
  assert.ok(system.includes('Only water and salt'));
  assert.ok(system.includes('only authority'));
});
test('chat schema rejects invalid role order, excessive prompt and oversized inventory', () => {
  assert.equal(chatRequestSchema.safeParse(input).success, true);
  assert.equal(
    chatRequestSchema.safeParse({
      ...input,
      messages: [{ role: 'assistant', text: 'x' }],
    }).success,
    false
  );
  assert.equal(
    chatRequestSchema.safeParse({
      ...input,
      messages: [{ role: 'user', text: 'x'.repeat(2001) }],
    }).success,
    false
  );
  assert.equal(
    chatRequestSchema.safeParse({ ...input, today: '2026-02-30' }).success,
    false
  );
  assert.equal(
    chatRequestSchema.safeParse({
      ...input,
      fridge: Array(101).fill({ name: 'fixture' }),
    }).success,
    false
  );
  assert.equal(
    chatRequestSchema.safeParse({ ...input, systemInstruction: 'override' })
      .success,
    false
  );
});
test('recent history is bounded in complete user/assistant pairs', () => {
  const history = Array.from({ length: 40 }, (_, i) => ({
    role: (i % 2 ? 'assistant' : 'user') as 'user' | 'assistant',
    text: 'x'.repeat(i % 2 ? 10000 : 1000),
  }));
  const recent = recentConversation(history, 'next');
  assert.equal(recent[0].role, 'user');
  assert.equal(recent.at(-1)?.text, 'next');
  assert.ok(recent.reduce((n, m) => n + m.text.length, 0) <= 24000);
  assert.ok(recent.length <= 21);
});
test('Gemini uses header auth, fixed endpoint and maps history roles, filtering thoughts', async () => {
  const provider = createGeminiProvider(
    'test-secret',
    'gemini-3.5-flash',
    async (url, options) => {
      assert.equal(
        String(url),
        'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent'
      );
      assert.equal(
        new Headers(options?.headers).get('x-goog-api-key'),
        'test-secret'
      );
      assert.equal(String(options?.body).includes('test-secret'), false);
      return mockFetch(url, options);
    }
  );
  assert.deepEqual(await provider.sendMessage(input), { text: 'Test reply' });
  const payload = geminiPayload({
    ...input,
    messages: [
      { role: 'user', text: 'one' },
      { role: 'assistant', text: 'two' },
      { role: 'user', text: 'three' },
    ],
  });
  assert.deepEqual(
    payload.contents.map((m) => m.role),
    ['user', 'model', 'user']
  );
});
test('quota, access and model errors are safe; blocked and truncated replies are not displayed', async () => {
  for (const [status, code] of [
    [429, 'QUOTA_EXCEEDED'],
    [403, 'PROVIDER_ACCESS'],
    [404, 'MODEL_UNAVAILABLE'],
    [500, 'PROVIDER_UNAVAILABLE'],
  ] as const) {
    await assert.rejects(
      createGeminiProvider(
        'secret',
        undefined,
        async () => new Response('secret', { status })
      ).sendMessage(input),
      new RegExp(code)
    );
  }
  for (const [finishReason, code] of [
    ['SAFETY', 'BLOCKED'],
    ['MAX_TOKENS', 'INCOMPLETE_RESPONSE'],
  ] as const) {
    await assert.rejects(
      createGeminiProvider(
        'secret',
        undefined,
        async () =>
          new Response(
            JSON.stringify({
              candidates: [
                { finishReason, content: { parts: [{ text: 'partial' }] } },
              ],
            })
          )
      ).sendMessage(input),
      new RegExp(code)
    );
  }
  await assert.rejects(
    createGeminiProvider('').sendMessage(input),
    /NOT_CONFIGURED/
  );
  await assert.rejects(
    createGeminiProvider('secret', '../invalid', mockFetch).sendMessage(input),
    /MODEL_UNAVAILABLE/
  );
});
test('chat throttle bounds uncached requests per instance', async () => {
  const run = createChatService(mockFetch);
  for (let i = 0; i < 6; i++) await run(input, 'test');
  await assert.rejects(run(input, 'test'), /RATE_LIMITED/);
});
test('HTTP chat handler validates method, JSON and size without contacting Gemini', async () => {
  const server = createServer((req, res) => {
    void handleChatRequest(req, res, '');
  });
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  assert.ok(address && typeof address !== 'string');
  const url = `http://127.0.0.1:${address.port}`;
  try {
    assert.equal((await fetch(url)).status, 405);
    const missing = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
    assert.equal(missing.status, 503);
    assert.deepEqual(await missing.json(), { error: 'NOT_CONFIGURED' });
    assert.equal(
      (
        await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: 'x'.repeat(70000),
        })
      ).status,
      413
    );
  } finally {
    server.closeAllConnections();
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
});
