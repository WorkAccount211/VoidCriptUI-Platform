import crypto from 'node:crypto';

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not configured`);
  return value;
}

function base64Url(input: string | Buffer): string {
  return Buffer.from(input).toString('base64url');
}

function encodeHeader(value: string): string {
  return `=?UTF-8?B?${Buffer.from(value, 'utf8').toString('base64')}?=`;
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (ch) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[ch] ?? ch));
}

async function getAccessToken(): Promise<string> {
  const body = new URLSearchParams({
    client_id: required('GMAIL_CLIENT_ID'),
    client_secret: required('GMAIL_CLIENT_SECRET'),
    refresh_token: required('GMAIL_REFRESH_TOKEN'),
    grant_type: 'refresh_token',
  });

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Gmail OAuth token refresh failed (${response.status}): ${text.slice(0, 400)}`);
  }

  const payload = await response.json() as { access_token?: string };
  if (!payload.access_token) throw new Error('Gmail OAuth response did not include an access token');
  return payload.access_token;
}

function buildMessage(to: string, subject: string, text: string, html?: string): string {
  const from = required('GMAIL_FROM');
  const boundary = `vcu_${crypto.randomBytes(12).toString('hex')}`;

  const headers = [
    `From: ${from}`,
    `To: ${to}`,
    `Subject: ${encodeHeader(subject)}`,
    'MIME-Version: 1.0',
  ];

  if (!html) {
    headers.push('Content-Type: text/plain; charset=UTF-8', 'Content-Transfer-Encoding: 8bit', '', text);
    return base64Url(headers.join('\r\n'));
  }

  const safeHtml = html || `<p>${escapeHtml(text).replace(/\n/g, '<br>')}</p>`;
  const message = [
    ...headers,
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    '',
    `--${boundary}`,
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: 8bit',
    '',
    text,
    `--${boundary}`,
    'Content-Type: text/html; charset=UTF-8',
    'Content-Transfer-Encoding: 8bit',
    '',
    safeHtml,
    `--${boundary}--`,
  ].join('\r\n');

  return base64Url(message);
}

export async function sendMail(to: string, subject: string, text: string, html?: string): Promise<boolean> {
  if (process.env.NODE_ENV !== 'production' && process.env.DEV_MAILER_DRY_RUN === 'true') {
    return true;
  }

  const accessToken = await getAccessToken();
  const raw = buildMessage(to, subject, text, html);

  const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    headers: {
      authorization: `Bearer ${accessToken}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({ raw }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Gmail API send failed (${response.status}): ${body.slice(0, 500)}`);
  }

  return true;
}
