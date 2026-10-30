<script lang="ts" module>
	export type TipRow = { label: string; value: string | number; color?: string };
	export type Tip = { x: number; y: number; title: string; rows: TipRow[] } | null;

	/** Build a tip anchored to the pointer (mouse) or to the element (keyboard focus). */
	export function tipAt(e: PointerEvent | FocusEvent, title: string, rows: TipRow[]): Tip {
		if ('clientX' in e) return { x: e.clientX, y: e.clientY, title, rows };
		const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
		return { x: r.left + r.width / 2, y: r.top, title, rows };
	}
</script>

<script lang="ts">
	let { tip }: { tip: Tip } = $props();
</script>

{#if tip}
	<div
		role="tooltip"
		class="pointer-events-none fixed z-50 min-w-36 -translate-x-1/2 -translate-y-[calc(100%+12px)] rounded-lg border bg-popover px-3 py-2 text-xs shadow-lg"
		style="left: {tip.x}px; top: {tip.y}px"
	>
		<p class="mb-1 font-medium text-muted-foreground">{tip.title}</p>
		{#each tip.rows as r (r.label)}
			<p class="flex items-center gap-2">
				{#if r.color}<span class="h-0.5 w-3 rounded-full" style="background: {r.color}"></span>{/if}
				<span class="font-semibold text-foreground tabular-nums">{r.value}</span>
				<span class="text-muted-foreground">{r.label}</span>
			</p>
		{/each}
	</div>
{/if}
