<script lang="ts" module>
	export type Slice = { key: string; label: string; value: number; color: string; muted?: boolean };

	const TAU = Math.PI * 2;
	const pt = (c: number, r: number, a: number) => [c + r * Math.sin(a), c - r * Math.cos(a)] as const;

	/** Annulus sector from angle a0 to a1 (radians, clockwise from 12 o'clock). */
	function arc(c: number, r0: number, r1: number, a0: number, a1: number) {
		const large = a1 - a0 > Math.PI ? 1 : 0;
		const [x0, y0] = pt(c, r1, a0);
		const [x1, y1] = pt(c, r1, a1);
		const [x2, y2] = pt(c, r0, a1);
		const [x3, y3] = pt(c, r0, a0);
		return `M${x0} ${y0}A${r1} ${r1} 0 ${large} 1 ${x1} ${y1}L${x2} ${y2}A${r0} ${r0} 0 ${large} 0 ${x3} ${y3}Z`;
	}
</script>

<script lang="ts">
	import type { Snippet } from 'svelte';
	import ChartTooltip, { tipAt, type Tip } from './ChartTooltip.svelte';

	let {
		slices,
		size = 160,
		thickness = 0.3,
		labels = true,
		title = '',
		ariaLabel,
		center
	}: {
		slices: Slice[];
		size?: number;
		/** ring width as a share of the radius */
		thickness?: number;
		/** print each slice's count on the slice when it fits */
		labels?: boolean;
		title?: string;
		ariaLabel?: string;
		center?: Snippet;
	} = $props();

	const VB = 200;
	const C = VB / 2;
	const R1 = 96;
	const R0 = $derived(R1 * (1 - thickness));
	const PAD = 0.035; // surface gap between slices (radians)

	const total = $derived(slices.reduce((s, x) => s + x.value, 0));
	const arcs = $derived.by(() => {
		const visible = slices.filter((s) => s.value > 0);
		let a = 0;
		return visible.map((s) => {
			const span = (s.value / total) * TAU;
			const pad = visible.length > 1 ? PAD : 0;
			const a0 = a + pad / 2;
			const a1 = a + span - pad / 2;
			a += span;
			const mid = (a0 + a1) / 2;
			const [lx, ly] = pt(C, (R0 + R1) / 2, mid);
			return {
				...s,
				d: visible.length === 1 ? null : arc(C, R0, R1, a0, a1),
				lx,
				ly,
				// only label slices wide enough to hold the number
				fits: span > 0.42 && R1 - R0 >= 22,
				pct: Math.round((s.value / total) * 100)
			};
		});
	});

	let tip = $state<Tip>(null);
	let hovered = $state<string | null>(null);
	const show = (e: PointerEvent | FocusEvent, s: (typeof arcs)[number]) => {
		hovered = s.key;
		tip = tipAt(e, title || s.label, [{ label: `${s.label} · ${s.pct}%`, value: s.value, color: s.color }]);
	};
	const hide = () => ((tip = null), (hovered = null));
</script>

<div class="relative shrink-0" style="width: {size}px; height: {size}px">
	<svg viewBox="0 0 {VB} {VB}" class="size-full overflow-visible" role="img" aria-label={ariaLabel ?? title}>
		{#if total === 0}
			<circle cx={C} cy={C} r={(R0 + R1) / 2} fill="none" stroke="var(--secondary)" stroke-width={R1 - R0} />
		{/if}
		{#each arcs as s (s.key)}
			<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
			<g
				class="cursor-pointer outline-none transition-transform duration-150"
				style="transform-origin: {C}px {C}px; transform: scale({hovered === s.key && !s.muted ? 1.04 : 1})"
				role="graphics-symbol"
				tabindex={s.muted ? -1 : 0}
				aria-label="{s.label} {s.value} ({s.pct}%)"
				onpointermove={(e) => !s.muted && show(e, s)}
				onfocus={(e) => show(e, s)}
				onpointerleave={hide}
				onblur={hide}
			>
				{#if s.d}
					<path d={s.d} fill={s.color} stroke={s.color} stroke-width="3" stroke-linejoin="round" />
				{:else}
					<circle cx={C} cy={C} r={(R0 + R1) / 2} fill="none" stroke={s.color} stroke-width={R1 - R0} />
				{/if}
				{#if labels && s.fits && !s.muted}
					<text
						x={s.lx}
						y={s.ly}
						text-anchor="middle"
						dominant-baseline="central"
						class="pointer-events-none fill-white text-[22px] font-semibold"
						style="font-family: var(--font-display)">{s.value}</text
					>
				{/if}
			</g>
		{/each}
	</svg>
	{#if center}
		<div class="pointer-events-none absolute inset-0 grid place-items-center text-center">
			<div>{@render center()}</div>
		</div>
	{/if}
</div>
<ChartTooltip {tip} />
