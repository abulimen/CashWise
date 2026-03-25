const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

function bytesToBase64(bytes: Uint8Array): string {
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(bytes).toString('base64');
  }
  let binary = '';
  bytes.forEach((b) => {
    binary += String.fromCharCode(b);
  });
  return btoa(binary);
}

function base64ToBytes(value: string): Uint8Array {
  if (typeof Buffer !== 'undefined') {
    return Uint8Array.from(Buffer.from(value, 'base64'));
  }
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
}

export async function generateDekBase64(): Promise<string> {
  const key = await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, ['encrypt', 'decrypt']);
  const exported = await crypto.subtle.exportKey('raw', key);
  return bytesToBase64(new Uint8Array(exported));
}

export async function encryptWithDekBase64(payload: unknown, dekBase64: string): Promise<{ encryptedBlob: string; iv: string }> {
  const dekBytes = base64ToBytes(dekBase64);
  const key = await crypto.subtle.importKey('raw', toArrayBuffer(dekBytes), 'AES-GCM', false, ['encrypt']);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    textEncoder.encode(JSON.stringify(payload))
  );

  return {
    encryptedBlob: bytesToBase64(new Uint8Array(ciphertext)),
    iv: bytesToBase64(iv),
  };
}

export async function decryptWithDekBase64(encryptedBlob: string, iv: string, dekBase64: string): Promise<string> {
  const dekBytes = base64ToBytes(dekBase64);
  const key = await crypto.subtle.importKey('raw', toArrayBuffer(dekBytes), 'AES-GCM', false, ['decrypt']);
  const plaintext = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: toArrayBuffer(base64ToBytes(iv)) },
    key,
    toArrayBuffer(base64ToBytes(encryptedBlob))
  );

  return textDecoder.decode(plaintext);
}

export async function wrapDekForUser(userId: string, dekBase64: string): Promise<string> {
  const serverSecret = process.env.CACHE_WRAP_SECRET || 'cashwise-demo-wrap-secret';
  const digest = await crypto.subtle.digest('SHA-256', textEncoder.encode(`${userId}:${serverSecret}`));
  const wrappingKey = await crypto.subtle.importKey('raw', digest, 'AES-GCM', false, ['encrypt']);
  const iv = new Uint8Array(12);
  const wrapped = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    wrappingKey,
    toArrayBuffer(base64ToBytes(dekBase64))
  );
  return bytesToBase64(new Uint8Array(wrapped));
}

export async function unwrapDekForUser(userId: string, wrappedDek: string): Promise<string> {
  const serverSecret = process.env.CACHE_WRAP_SECRET || 'cashwise-demo-wrap-secret';
  const digest = await crypto.subtle.digest('SHA-256', textEncoder.encode(`${userId}:${serverSecret}`));
  const wrappingKey = await crypto.subtle.importKey('raw', digest, 'AES-GCM', false, ['decrypt']);
  const iv = new Uint8Array(12);
  const dek = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    wrappingKey,
    toArrayBuffer(base64ToBytes(wrappedDek))
  );
  return bytesToBase64(new Uint8Array(dek));
}
