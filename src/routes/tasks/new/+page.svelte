<script lang="ts">
	import { enhance } from '$app/forms';
	import { page } from '$app/state';
	import { Button } from '#lib/components/ui/button/index.js';
	import * as Card from '#lib/components/ui/card/index.js';
	import TaskFields from '#lib/components/TaskFields.svelte';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();
	const projectId = $derived(Number(page.url.searchParams.get('project')) || undefined);
</script>

<h1 class="mb-6 text-2xl font-semibold">เพิ่มงานใหม่</h1>
<Card.Root class="max-w-3xl">
	<Card.Content>
		<form method="POST" use:enhance class="space-y-4">
			<TaskFields
				admin
				values={{ projectId }}
				people={data.people.filter((p) => p.active)}
				projects={data.projects.filter((p) => !p.archived)}
			/>
			{#if form?.message}<p class="text-sm text-destructive">{form.message}</p>{/if}
			<div class="flex gap-2">
				<Button type="submit">สร้างงาน</Button>
				<Button variant="ghost" href="/tasks">ยกเลิก</Button>
			</div>
		</form>
	</Card.Content>
</Card.Root>
