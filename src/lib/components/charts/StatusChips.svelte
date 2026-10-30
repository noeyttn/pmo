<script lang="ts">
	// Every count spelled out under a donut, so no number depends on hover or on fitting inside a slice.
	import { STATUS_SERIES, type StatusCounts } from './series.js';
	let { counts }: { counts: StatusCounts } = $props();
</script>

<div class="flex justify-center gap-1.5">
	{#each STATUS_SERIES as s (s.key)}
		<span class="flex items-center gap-1 rounded-full bg-secondary/70 px-2 py-0.5 text-xs" title={s.label}>
			<span class="size-2 rounded-full" style="background: {s.color}"></span>
			<span class="font-semibold tabular-nums">{counts[s.key]}</span>
		</span>
	{/each}
</div>
