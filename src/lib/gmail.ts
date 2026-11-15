/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

const GMAIL_API_BASE = 'https://gmail.googleapis.com/gmail/v1/users/me';

export const BASIC_IDENTITY_SCOPES = ['openid', 'email', 'profile'] as const;

export const GMAIL_SCOPES = [
  'https://mail.google.com/',
  'https://www.googleapis.com/auth/gmail.addons.current.action.compose',
  'https://www.googleapis.com/auth/gmail.addons.current.message.action',
  'https://www.googleapis.com/auth/gmail.addons.current.message.metadata',
  'https://www.googleapis.com/auth/gmail.addons.current.message.readonly',
  'https://www.googleapis.com/auth/gmail.compose',
  'https://www.googleapis.com/auth/gmail.insert',
  'https://www.googleapis.com/auth/gmail.labels',
  'https://www.googleapis.com/auth/gmail.metadata',
  'https://www.googleapis.com/auth/gmail.modify',
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/gmail.settings.basic',
  'https://www.googleapis.com/auth/gmail.settings.sharing',
] as const;

export const SCOPES: string[] = [...BASIC_IDENTITY_SCOPES, ...GMAIL_SCOPES];

export interface GmailLabel {
  id: string;
  name: string;
  type?: string;
}

export interface GmailMessageSummary {
  id: string;
  threadId: string;
  labelIds: string[];
  snippet: string;
  subject: string;
  from: string;
  to: string;
  date: string;
  bodyText: string;
  isUnread: boolean;
}

export class GmailApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'GmailApiError';
    this.status = status;
  }
}

interface RawGmailHeader {
  name?: string;
  value?: string;
}

interface RawGmailPart {
  mimeType?: string;
  body?: { data?: string };
  parts?: RawGmailPart[];
}

interface RawGmailMessage {
  id: string;
  threadId?: string;
  labelIds?: string[];
  snippet?: string;
  payload?: {
    headers?: RawGmailHeader[];
    mimeType?: string;
    body?: { data?: string };
    parts?: RawGmailPart[];
  };
}

export function decodeBase64UrlUtf8(encoded: string): string {
  if (!encoded) return '';
  const base64 = encoded.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new TextDecoder().decode(bytes);
}

export function encodeBase64UrlUtf8(input: string): string {
  const bytes = new TextEncoder().encode(input);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function stripHtmlTags(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function extractPlainTextFromPayload(payload?: RawGmailMessage['payload']): string {
  if (!payload) return '';
  const findPart = (parts: RawGmailPart[] | undefined, targetMime: string): string | null => {
    if (!parts) return null;
    for (const part of parts) {
      if (part.mimeType === targetMime && part.body?.data) {
        return decodeBase64UrlUtf8(part.body.data);
      }
      if (part.parts) {
        const nested = findPart(part.parts, targetMime);
        if (nested) return nested;
      }
    }
    return null;
  };

  if (payload.mimeType === 'text/plain' && payload.body?.data) {
    return decodeBase64UrlUtf8(payload.body.data);
  }

  const plainPart = findPart(payload.parts, 'text/plain');
  if (plainPart) return plainPart;

  if (payload.mimeType === 'text/html' && payload.body?.data) {
    return stripHtmlTags(decodeBase64UrlUtf8(payload.body.data));
  }

  const htmlPart = findPart(payload.parts, 'text/html');
  if (htmlPart) return stripHtmlTags(htmlPart);

  return '';
}

function getHeader(headers: RawGmailHeader[] | undefined, target: string): string {
  if (!headers) return '';
  const lower = target.toLowerCase();
  const match = headers.find((h) => h.name?.toLowerCase() === lower);
  return match?.value ?? '';
}

async function gmailFetch<T>(
  accessToken: string,
  endpoint: string,
  init: RequestInit = {}
): Promise<T> {
  const response = await fetch(`${GMAIL_API_BASE}${endpoint}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      ...(init.headers || {}),
    },
  });

  if (!response.ok) {
    let errorMessage = `Gmail request failed (${response.status})`;
    try {
      const errJson = (await response.json()) as { error?: { message?: string } };
      if (errJson.error?.message) {
        errorMessage = errJson.error.message;
      }
    } catch {
      // ignore non-json body
    }
    throw new GmailApiError(errorMessage, response.status);
  }

  if (response.status === 204) {
    return {} as T;
  }
  return (await response.json()) as T;
}

export async function listGmailLabels(accessToken: string): Promise<GmailLabel[]> {
  const data = await gmailFetch<{ labels?: GmailLabel[] }>(accessToken, '/labels');
  return data.labels ?? [];
}

export async function listGmailMessages(
  accessToken: string,
  options: { query?: string; labelId?: string; maxResults?: number } = {}
): Promise<GmailMessageSummary[]> {
  const params = new URLSearchParams();
  params.set('maxResults', String(options.maxResults ?? 12));
  if (options.query?.trim()) {
    params.set('q', options.query.trim());
  }
  if (options.labelId && options.labelId !== 'ALL') {
    params.append('labelIds', options.labelId);
  }

  const listData = await gmailFetch<{ messages?: { id: string; threadId: string }[] }>(
    accessToken,
    `/messages?${params.toString()}`
  );
  const refs = listData.messages ?? [];
  if (refs.length === 0) return [];

  const details = await Promise.all(
    refs.map((ref) =>
      gmailFetch<RawGmailMessage>(
        accessToken,
        `/messages/${encodeURIComponent(ref.id)}?format=full`
      )
    )
  );

  return details.map((msg) => {
    const headers = msg.payload?.headers;
    const labelIds = msg.labelIds ?? [];
    return {
      id: msg.id,
      threadId: msg.threadId ?? msg.id,
      labelIds,
      snippet: msg.snippet ?? '',
      subject: getHeader(headers, 'Subject') || '(No Subject)',
      from: getHeader(headers, 'From') || 'Unknown Sender',
      to: getHeader(headers, 'To') || '',
      date: getHeader(headers, 'Date') || '',
      bodyText: extractPlainTextFromPayload(msg.payload) || msg.snippet || '',
      isUnread: labelIds.includes('UNREAD'),
    };
  });
}

export function sanitizeHeaderValue(value: string): string {
  return value.replace(/[\r\n]+/g, ' ').trim();
}

export function buildMimeRaw(to: string, subject: string, body: string): string {
  const cleanTo = sanitizeHeaderValue(to);
  const cleanSubject = sanitizeHeaderValue(subject);
  const mime = [
    `To: ${cleanTo}`,
    `Subject: ${cleanSubject}`,
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset="UTF-8"',
    'Content-Transfer-Encoding: 8bit',
    '',
    body,
  ].join('\r\n');
  return encodeBase64UrlUtf8(mime);
}

export async function sendGmailMessage(
  accessToken: string,
  params: { to: string; subject: string; body: string }
): Promise<{ id: string; threadId: string }> {
  const raw = buildMimeRaw(params.to, params.subject, params.body);
  return gmailFetch<{ id: string; threadId: string }>(accessToken, '/messages/send', {
    method: 'POST',
    body: JSON.stringify({ raw }),
  });
}

export async function createGmailDraft(
  accessToken: string,
  params: { to: string; subject: string; body: string }
): Promise<{ id: string }> {
  const raw = buildMimeRaw(params.to, params.subject, params.body);
  return gmailFetch<{ id: string }>(accessToken, '/drafts', {
    method: 'POST',
    body: JSON.stringify({ message: { raw } }),
  });
}

export async function modifyGmailMessageLabels(
  accessToken: string,
  messageId: string,
  params: { addLabelIds?: string[]; removeLabelIds?: string[] }
): Promise<void> {
  await gmailFetch(accessToken, `/messages/${encodeURIComponent(messageId)}/modify`, {
    method: 'POST',
    body: JSON.stringify({
      addLabelIds: params.addLabelIds ?? [],
      removeLabelIds: params.removeLabelIds ?? [],
    }),
  });
}

export async function trashGmailMessage(accessToken: string, messageId: string): Promise<void> {
  await gmailFetch(accessToken, `/messages/${encodeURIComponent(messageId)}/trash`, {
    method: 'POST',
  });
}

export async function createGmailLabel(accessToken: string, name: string): Promise<GmailLabel> {
  return gmailFetch<GmailLabel>(accessToken, '/labels', {
    method: 'POST',
    body: JSON.stringify({
      name: name.trim(),
      labelListVisibility: 'labelShow',
      messageListVisibility: 'show',
    }),
  });
}
