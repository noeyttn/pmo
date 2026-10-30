<script lang="ts">
	import { enhance } from '$app/forms';
	import { Button } from '#lib/components/ui/button/index.js';
	import * as Card from '#lib/components/ui/card/index.js';
	import TaskFields from '#lib/components/TaskFields.svelte';
	import ActivityList from '#lib/components/ActivityList.svelte';
	import StatusBadge from '#lib/components/StatusBadge.svelte';
	import DueBadge from '#lib/components/DueBadge.svelte';
	import ProgressBar from '#lib/components/ProgressBar.svelte';
	import { PRIORITY_CLASS, PRIORITY_LABEL, formatDate } from '#lib/tasks.js';
	import ArrowLeft from '@lucide/svelte/icons/arrow-left';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();
	const t = $derived(data.task);
	const isAdmin = $derived(data.user?.role === 'admin');
</script>

<a href="/tasks" class="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
	<ArrowLeft class="size-4" /> งานทั้งหมด
</a>

<div class="mb-6">
	<p class="font-mono text-sm text-muted-foreground">{t.code} · <a class="hover:underline" href="/projects/{t.projectId}">{t.projectName}</a></p>
	<h1 class="mt-1 text-2xl font-semibold">{t.title}</h1>
	<div class="mt-3 flex flex-wrap items-center gap-2 text-sm">
		<StatusBadge status={t.status} />
		<span class="rounded-full px-2 py-0.5 text-xs {PRIORITY_CLASS[t.priority]}">ความสำคัญ{PRIORITY_LABEL[t.priority]}</span>
		<DueBadge task={t} />
		<span class="text-muted-foreground">ผู้รับผิดชอบ: <b class="text-foreground">{t.assigneeName ?? '-'}</b></span>
		<span class="text-muted-foreground">· {formatDate(t.startDate)} → {formatDate(t.dueDate)}</span>
	</div>
	<div class="mt-3 flex max-w-md items-center gap-3">
		<ProgressBar value={t.progress} />
		<span class="text-sm tabular-nums">{t.progress}%</span>
		<span class="shrink-0 text-xs text-muted-foreground">{t.actualHours}/{t.estHours} ชม.</span>
	</div>
</div>

<div class="grid gap-6 lg:grid-cols-5">
	<Card.Root class="lg:col-span-3">
		<Card.Header>
			<Card.Title>{data.canEdit ? 'อัปเดตงาน' : 'รายละเอียดงาน'}</Card.Title>
			{#if !data.canEdit}
				<Card.Description>แก้ไขได้เฉพาะผู้รับผิดชอบงานหรือ Admin</Card.Description>
			{:else if !isAdmin}
				<Card.Description>คุณอัปเดตสถานะ ความคืบหน้า ชั่วโมงจริง และหมายเหตุได้</Card.Description>
			{/if}
		</Card.Header>
		<Card.Content>
			{#if data.canEdit}
				<form method="POST" action="?/update" use:enhance={() => ({ update }) => update({ reset: false })} class="space-y-4">
					{#key t}
						<TaskFields admin={isAdmin} values={t} people={data.people.filter((p) => p.active || p.id === t.assigneeId)} projects={data.projects} />
					{/key}
					{#if form?.saved}<p class="text-sm text-emerald-700">บันทึกแล้ว — บันทึกลงประวัติเรียบร้อย</p>{/if}
					{#if form?.reverted}<p class="text-sm text-purple-700">ย้อนกลับค่าเดิมแล้ว</p>{/if}
					<div class="flex flex-wrap gap-2">
						<Button type="submit">บันทึก</Button>
					</div>
				</form>
				{#if isAdmin}
					<form
						method="POST"
						action="?/delete"
						class="mt-4 border-t pt-4"
						use:enhance={({ cancel }) => {
							if (!confirm(`ลบงาน ${t.code}? (ยังดูข้อมูลเดิมได้ในประวัติ)`)) cancel();
						}}
					>
						<Button type="submit" variant="destructive" size="sm">ลบงานนี้</Button>
					</form>
				{/if}
			{:else}
				<p class="whitespace-pre-wrap text-sm">{t.note ?? 'ไม่มีหมายเหตุ'}</p>
			{/if}
		</Card.Content>
	</Card.Root>

	<Card.Root class="lg:col-span-2">
		<Card.Header>
			<Card.Title>ประวัติการแก้ไข</Card.Title>
			<Card.Description>ใครแก้อะไร เมื่อไร {isAdmin ? '· กดย้อนกลับได้' : ''}</Card.Description>
		</Card.Header>
		<Card.Content>
			<ActivityList
				entries={data.history}
				people={data.people}
				projects={data.projects}
				showEntity={false}
				canRevert={isAdmin}
				revertAction="?/revert"
			/>
		</Card.Content>
	</Card.Root>
</div>
