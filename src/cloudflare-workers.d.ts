// Minimal typing for the Workers runtime module used by src/lib/server/db/index.ts.
// (Pulling in all of @cloudflare/workers-types would clash with the DOM lib.)
declare module 'cloudflare:workers' {
	export const env: Cloudflare.Env;
}
