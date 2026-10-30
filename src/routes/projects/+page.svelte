<script lang="ts">
	import { enhance } from '$app/forms';
	import { Button } from '#lib/components/ui/button/index.js';
	import { Input } from '#lib/components/ui/input/index.js';
	import { Label } from '#lib/components/ui/label/index.js';
	import * as Card from '#lib/components/ui/card/index.js';
	import ProgressBar from '#lib/components/ProgressBar.svelte';
	import { formatDate } from '#lib/tasks.js';
	import Plus from '@lucide/svelte/icons/plus';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();
	let showForm = $state(false);
	let showArchived = $state(false);
	const isAdmin = $derived(data.user?.role === 'admin');
	const visible = $derived(data.projects.filter((p) => showArchived || !p.archived));
</script>

<div class="mb-6 flex flex-wrap items-center justify-between gap-3">
	<div>
		<h1 class="text-2xl font-semibold">โปรเจกต์</h1>
		<p class="text-sm text-muted-foreground">ลูกค้า / โครงการทั้งหมด {data.projects.length} รายการ</p>
	</div>
	<div class="flex items-center gap-3">
		<label class="flex items-center gap-2 text-sm text-muted-foreground">
			<input type="checkbox" bind:checked={showArchived} /> แสดงที่เก็บถาวร
		</label>
		{#if isAdmin}
			<Button onclick={() => (showForm = !showForm)}><Plus /> โปรเจกต์ใหม่</Button>
		{/if}
	</div>
</div>

{#if isAdmin && (showForm || form?.message)}
	<Card.Root class="mb-6">
		<Card.Content>
			<form
				method="POST"
				action="?/create"
				class="grid gap-4 sm:grid-cols-[1fr_2fr_auto] sm:items-end"
				use:enhance={() => async ({ update, result }) => {
					await update();
					if (result.type === 'success') showForm = false;
				}}
			>
				<div class="space-y-2">
					<Label for="pname">ชื่อโปรเจกต์ / ลูกค้า</Label>
					<Input id="pname" name="name" required />
				</div>
				<div class="space-y-2">
					<Label for="pdesc">รายละเอียด</Label>
					<Input id="pdesc" name="description" />
				</div>
				<Button type="submit">สร้าง</Button>
				{#if form?.message}<p class="text-sm text-destructive sm:col-span-3">{form.message}</p>{/if}
			</form>
		</Card.Content>
	</Card.Root>
{/if}

<div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
	{#each visible as p (p.id)}
		<a href="/projects/{p.id}" class="block">
			<Card.Root class="h-full transition-shadow hover:shadow-md {p.archived ? 'opacity-60' : ''}">
				<Card.Header>
					<Card.Title class="flex items-center justify-between gap-2">
						<span>{p.name}</span>
						{#if p.overdue}
							<span class="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
								เกินกำหนด {p.overdue}
							</span>
						{/if}
					</Card.Title>
					{#if p.description}<Card.Description>{p.description}</Card.Description>{/if}
				</Card.Header>
				<Card.Content class="space-y-3">
					<div class="flex justify-between text-sm">
						<span class="text-muted-foreground">เสร็จ {p.done}/{p.total} งาน</span>
						<span class="font-medium tabular-nums">{p.avgProgress}%</span>
					</div>
					<ProgressBar value={p.avgProgress} />
					<div class="flex justify-between text-xs text-muted-foreground">
						<span>กำลังทำ {p.doing}</span>
						<span>กำหนดถัดไป {formatDate(p.nextDue)}</span>
					</div>
				</Card.Content>
			</Card.Root>
		</a>
	{/each}
</div>
