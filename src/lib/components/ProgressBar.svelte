<script lang="ts">
	let { value, class: klass = '' }: { value: number; class?: string } = $props();
	const pct = $derived(Math.max(0, Math.min(100, value)));
</script>

<div class="h-2 w-full overflow-hidden rounded-full bg-secondary {klass}" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
	<div class="h-full rounded-full {pct === 100 ? 'bg-done' : 'bg-doing'}" style="width: {pct}%"></div>
</div>
