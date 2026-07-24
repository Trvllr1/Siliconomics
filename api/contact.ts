import type { VercelRequest, VercelResponse } from '@vercel/node';
import { z } from 'zod';

const contactSchema = z.object({
  type: z.enum(['design-partner', 'founder-demo', 'investor', 'general']),
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(254),
  company: z.string().trim().min(2).max(160),
  role: z.string().trim().min(2).max(120),
  message: z.string().trim().min(20).max(4_000),
  website: z.string().max(0).optional(),
  startedAt: z.number().int().positive(),
});

const MIN_COMPLETION_MS = 1_500;

function formatLeadText(lead: z.infer<typeof contactSchema>) {
  return [
    `Lead type: ${lead.type}`,
    `Name: ${lead.name}`,
    `Email: ${lead.email}`,
    `Company: ${lead.company}`,
    `Role: ${lead.role}`,
    '',
    'Program context:',
    lead.message,
  ].join('\n');
}

export async function handleContactRequest(body: unknown) {
  const parsed = contactSchema.safeParse(body);
  if (!parsed.success) {
    return { status: 400, body: { error: 'Please complete all required fields.' } };
  }

  const lead = parsed.data;
  if (lead.website || Date.now() - lead.startedAt < MIN_COMPLETION_MS) {
    return { status: 202, body: { ok: true } };
  }

  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.LEADS_TO_EMAIL;
  const from = process.env.LEADS_FROM_EMAIL;
  if (!apiKey || !to || !from) {
    return {
      status: 503,
      body: { error: 'Online submissions are temporarily unavailable. Please use the email link below.' },
    };
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: [to],
      reply_to: lead.email,
      subject: `[Siliconomics] ${lead.type} inquiry from ${lead.company}`,
      text: formatLeadText(lead),
    }),
  });

  if (!response.ok) {
    return { status: 502, body: { error: 'We could not deliver your submission. Please use the email link below.' } };
  }

  return { status: 201, body: { ok: true } };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const result = await handleContactRequest(req.body);
    return res.status(result.status).json(result.body);
  } catch {
    return res.status(500).json({ error: 'Unable to process your submission. Please use the email link below.' });
  }
}