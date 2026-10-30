<script lang="ts">
	import { daysLeft, timeState } from '#lib/tasks.js';
	let { task }: { task: { status: string; dueDate: string | null } } = $props();
	const state = $derived(timeState(task));
	const d = $derived(daysLeft(task.dueDate));
</script>

{#if state === 'overdue'}
	<span class="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">เลย {-d!} วัน</span>
{:else if state === 'soon'}
	<span class="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
		{d === 0 ? 'ครบกำหนดวันนี้' : `อีก ${d} วัน`}
	</span>
{/if}
