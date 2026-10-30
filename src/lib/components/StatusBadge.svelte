<script lang="ts">
	import { STATUS_CLASS, STATUS_LABEL } from '#lib/tasks.js';
	let { status }: { status: keyof typeof STATUS_LABEL } = $props();
</script>

<span class="inline-flex rounded-full px-2 py-0.5 text-xs font-medium {STATUS_CLASS[status]}">{STATUS_LABEL[status]}</span>
