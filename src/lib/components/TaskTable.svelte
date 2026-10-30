<script lang="ts">
	import * as Table from '#lib/components/ui/table/index.js';
	import * as Card from '#lib/components/ui/card/index.js';
	import StatusBadge from './StatusBadge.svelte';
	import DueBadge from './DueBadge.svelte';
	import { PRIORITY_CLASS, PRIORITY_LABEL, formatDate } from '#lib/tasks.js';
	import type { TaskRow } from '#lib/server/queries.js';

	let { tasks, showProject = true }: { tasks: TaskRow[]; showProject?: boolean } = $props();
</script>

<!-- Phone: one card per task -->
<ul class="space-y-2.5 md:hidden">
	{#each tasks as t (t.id)}
		<li>
			<a href="/tasks/{t.id}" class="block rounded-3xl bg-card p-4 shadow-[0_4px_16px_-8px_oklch(0.5_0.12_305/0.25)] ring-1 ring-foreground/5 active:bg-secondary/60">
				<div class="mb-1 flex items-center justify-between gap-2 text-xs text-muted-foreground">
					<span class="font-mono">{t.code}</span>
					{#if showProject}<span class="truncate">{t.projectName}</span>{/if}
				</div>
				<p class="font-medium leading-snug">{t.title}</p>
				<div class="mt-2 flex flex-wrap items-center gap-1.5">
					<StatusBadge status={t.status} />
					<span class="rounded-full px-2 py-0.5 text-xs {PRIORITY_CLASS[t.priority]}">{PRIORITY_LABEL[t.priority]}</span>
					<DueBadge task={t} />
				</div>
				<div class="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
					<span class="font-medium text-foreground">{t.assigneeName ?? '-'}</span>
					<span class="ml-auto">กำหนด {formatDate(t.dueDate)}</span>
					<span class="w-10 text-right font-semibold text-foreground tabular-nums">{t.progress}%</span>
				</div>
				<div class="mt-1.5 h-1.5 overflow-hidden rounded-full bg-secondary">
					<div class="h-full rounded-full {t.progress === 100 ? 'bg-done' : 'bg-doing'}" style="width: {t.progress}%"></div>
				</div>
			</a>
		</li>
	{:else}
		<li class="py-8 text-center text-sm text-muted-foreground">ไม่พบงาน</li>
	{/each}
</ul>

<!-- Tablet / desktop: table -->
<Card.Root class="hidden py-0 md:flex">
	<Table.Root>
		<Table.Header>
			<Table.Row>
				<Table.Head>รหัส</Table.Head>
				<Table.Head>ชื่องาน</Table.Head>
				{#if showProject}<Table.Head>โครงการ</Table.Head>{/if}
				<Table.Head>ผู้รับผิดชอบ</Table.Head>
				<Table.Head>ความสำคัญ</Table.Head>
				<Table.Head>สถานะ</Table.Head>
				<Table.Head>กำหนดส่ง</Table.Head>
				<Table.Head class="text-right">คืบหน้า</Table.Head>
			</Table.Row>
		</Table.Header>
		<Table.Body>
			{#each tasks as t (t.id)}
				<Table.Row class="cursor-pointer" onclick={() => (location.href = `/tasks/${t.id}`)}>
					<Table.Cell class="font-mono text-xs text-muted-foreground">{t.code}</Table.Cell>
					<Table.Cell class="max-w-[22rem] whitespace-normal">
						<a href="/tasks/{t.id}" class="font-medium hover:underline">{t.title}</a>
					</Table.Cell>
					{#if showProject}<Table.Cell class="text-muted-foreground">{t.projectName}</Table.Cell>{/if}
					<Table.Cell>{t.assigneeName ?? '-'}</Table.Cell>
					<Table.Cell>
						<span class="rounded-full px-2 py-0.5 text-xs {PRIORITY_CLASS[t.priority]}">{PRIORITY_LABEL[t.priority]}</span>
					</Table.Cell>
					<Table.Cell><StatusBadge status={t.status} /></Table.Cell>
					<Table.Cell>
						<div class="flex flex-col items-start gap-1">
							<span class="text-sm">{formatDate(t.dueDate)}</span>
							<DueBadge task={t} />
						</div>
					</Table.Cell>
					<Table.Cell class="text-right tabular-nums">{t.progress}%</Table.Cell>
				</Table.Row>
			{:else}
				<Table.Row>
					<Table.Cell colspan={8} class="py-8 text-center text-muted-foreground">ไม่พบงาน</Table.Cell>
				</Table.Row>
			{/each}
		</Table.Body>
	</Table.Root>
</Card.Root>
