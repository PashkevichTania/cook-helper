import { z } from 'zod';

import {
  availableProducts,
  localDate,
  type Product,
  productSchema,
} from '../product/model.ts';

export const chatMessageSchema = z
  .object({
    role: z.enum(['user', 'assistant']),
    text: z.string().trim().min(1).max(12000),
  })
  .strict();
export const chatProductSchema = productSchema.pick({
  name: true,
  quantity: true,
  unit: true,
  expiresAt: true,
});
export const chatRequestSchema = z
  .object({
    language: z.enum(['ru', 'en']),
    today: productSchema.shape.expiresAt.unwrap(),
    fridge: z.array(chatProductSchema).max(100),
    messages: z.array(chatMessageSchema).min(1).max(21),
  })
  .strict()
  .superRefine((input, ctx) => {
    if (
      input.messages.some(
        (m, i) => m.role !== (i % 2 === 0 ? 'user' : 'assistant')
      ) ||
      input.messages.at(-1)?.role !== 'user'
    )
      ctx.addIssue({ code: 'custom', message: 'Invalid conversation order' });
    if (
      input.messages.some((m) => m.role === 'user' && m.text.length > 2000) ||
      input.messages.reduce((n, m) => n + m.text.length, 0) > 24000
    )
      ctx.addIssue({ code: 'custom', message: 'Conversation too long' });
  });
export const chatResponseSchema = z.object({
  text: z.string().trim().min(1).max(12000),
});
export type ChatMessage = z.infer<typeof chatMessageSchema>;
export type ChatRequest = z.infer<typeof chatRequestSchema>;
export function chatInventory(products: Product[], now = new Date()) {
  return {
    today: localDate(now),
    fridge: availableProducts(products, now).map((p) => ({
      name: p.name,
      quantity: p.quantity,
      unit: p.unit,
      expiresAt: p.expiresAt,
    })),
  };
}
export function recentConversation(
  messages: ChatMessage[],
  text: string
): ChatMessage[] {
  const history = messages.slice(-20);
  while (history.reduce((n, m) => n + m.text.length, 0) + text.length > 24000)
    history.splice(0, 2);
  return [...history, { role: 'user', text }];
}
