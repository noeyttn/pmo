<script lang="ts">
	let { items }: { items: readonly { label: string; color: string }[] } = $props();
</script>

<ul class="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
	{#each items as it (it.label)}
		<li class="flex items-center gap-1.5">
			<span class="size-2.5 rounded-[3px]" style="background: {it.color}"></span>{it.label}
		</li>
	{/each}
</ul>
