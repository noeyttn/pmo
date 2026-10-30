// PBKDF2 via Web Crypto — works in Node and on Cloudflare Workers (no native deps).
const ITERATIONS = 100_000;

const toHex = (buf: ArrayBuffer | Uint8Array<ArrayBuffer>) =>
	[...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
const fromHex = (hex: string) => Uint8Array.from(hex.match(/.{2}/g)!, (h) => parseInt(h, 16));

async function derive(password: string, salt: Uint8Array<ArrayBuffer>, iterations: number) {
	const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, [
		'deriveBits'
	]);
	return crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations }, key, 256);
}

export async function hashPassword(password: string): Promise<string> {
	const salt = crypto.getRandomValues(new Uint8Array(16));
	const hash = await derive(password, salt, ITERATIONS);
	return `pbkdf2$${ITERATIONS}$${toHex(salt)}$${toHex(hash)}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
	const [algo, iter, saltHex, hashHex] = stored.split('$');
	if (algo !== 'pbkdf2') return false;
	const hash = toHex(await derive(password, fromHex(saltHex), Number(iter)));
	// constant-time compare
	let diff = hash.length ^ hashHex.length;
	for (let i = 0; i < hash.length; i++) diff |= hash.charCodeAt(i) ^ hashHex.charCodeAt(i);
	return diff === 0;
}
