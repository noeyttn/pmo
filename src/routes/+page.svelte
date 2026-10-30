<script lang="ts">
	import * as Card from '#lib/components/ui/card/index.js';
	import * as Table from '#lib/components/ui/table/index.js';
	import { Button } from '#lib/components/ui/button/index.js';
	import ActivityList from '#lib/components/ActivityList.svelte';
	import Donut from '#lib/components/charts/Donut.svelte';
	import StatusChips from '#lib/components/charts/StatusChips.svelte';
	import Legend from '#lib/components/charts/Legend.svelte';
	import { STATUS_SERIES, type StatusCounts } from '#lib/components/charts/series.js';
	import { formatDate } from '#lib/tasks.js';
	import Printer from '@lucide/svelte/icons/printer';
	import TriangleAlert from '@lucide/svelte/icons/triangle-alert';
	import Clock from '@lucide/svelte/icons/clock';
	import Sparkles from '@lucide/svelte/icons/sparkles';
	import CircleCheck from '@lucide/svelte/icons/circle-check';
	import Loader from '@lucide/svelte/icons/loader';
	import Hourglass from '@lucide/svelte/icons/hourglass';
	import UsersRound from '@lucide/svelte/icons/users-round';
	import FolderHeart from '@lucide/svelte/icons/folder-heart';
	import Timer from '@lucide/svelte/icons/timer';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	const t = $derived(data.totals);
	const pct = (n: number) => `${Math.round(n * 100)}%`;

	const statusSlices = (c: StatusCounts) =>
		STATUS_SERIES.map((s) => ({ key: s.key, label: s.label, value: c[s.key], color: s.color }));
	const hoursSlices = (est: number, actual: number) => [
		{ key: 'actual', label: 'ชั่วโมงจริง', value: actual, color: 'var(--series-actual)' },
		{ key: 'left', label: 'เหลือจากแผน', value: Math.max(0, est - actual), color: 'var(--secondary)', muted: true }
	];
	const progressSlices = (p: number) => [
		{ key: 'p', label: 'ความคืบหน้า', value: p, color: p === 100 ? 'var(--series-done)' : 'var(--series-doing)' },
		{ key: 'rest', label: 'คงเหลือ', value: 100 - p, color: 'var(--secondary)', muted: true }
	];

	const people = $derived([...data.byPerson].sort((a, b) => b.total - a.total));
	const projects = $derived([...data.byProject].sort((a, b) => b.total - a.total));

	const kpis = $derived([
		{ label: 'เสร็จแล้ว', value: t.done, sub: `จาก ${t.total} งาน`, icon: CircleCheck, tint: 'bg-emerald-50 text-emerald-700' },
		{ label: 'กำลังทำ', value: t.doing, sub: `ยังไม่เริ่ม ${t.todo} งาน`, icon: Loader, tint: 'bg-violet-50 text-violet-700' },
		{ label: 'เกินกำหนด', value: t.overdue, sub: 'ยังไม่เสร็จและเลยกำหนด', icon: TriangleAlert, tint: 'bg-red-50 text-red-700', href: '/tasks?status=overdue' },
		{ label: 'ใกล้ครบกำหนด', value: t.soon, sub: 'เหลือไม่เกิน 3 วัน', icon: Clock, tint: 'bg-amber-50 text-amber-700', href: '/tasks?status=soon' }
	]);
</script>

{#snippet bubble(Icon: typeof Sparkles, tint: string)}
	<span class="grid size-9 shrink-0 place-items-center rounded-2xl {tint}"><Icon class="size-4.5" /></span>
{/snippet}

<div class="mb-6 flex flex-wrap items-end justify-between gap-3">
	<div>
		<h1 class="flex items-center gap-2 text-2xl"><Sparkles class="size-5 text-primary" /> Dashboard</h1>
		<p class="text-sm text-muted-foreground">สรุปสถานะงาน ณ วันที่ {formatDate(data.today)} — อัปเดตอัตโนมัติจากข้อมูลล่าสุด</p>
	</div>
	<Button variant="outline" class="no-print" onclick={() => window.print()}><Printer /> พิมพ์ / PDF รายงานสัปดาห์</Button>
</div>

<!-- Overview: big donut + KPI tiles -->
<div class="mb-6 grid gap-6 xl:grid-cols-5">
	<Card.Root class="xl:col-span-2">
		<Card.Header class="flex items-center gap-3">
			{@render bubble(Sparkles, 'bg-accent text-accent-foreground')}
			<div>
				<Card.Title>ภาพรวมสถานะงาน</Card.Title>
				<Card.Description>To do / Doing / Done ของทั้งทีม</Card.Description>
			</div>
		</Card.Header>
		<Card.Content class="flex flex-col items-center gap-5 sm:flex-row sm:justify-center">
			<Donut slices={statusSlices(t)} size={210} thickness={0.36} title="สถานะงานทั้งหมด">
				{#snippet center()}
					<p class="text-4xl leading-none font-semibold text-primary" style="font-family: var(--font-display)">{pct(t.doneRate)}</p>
					<p class="mt-1 text-xs text-muted-foreground">เสร็จแล้ว</p>
				{/snippet}
			</Donut>
			<ul class="grid w-full max-w-52 gap-2">
				{#each STATUS_SERIES as s (s.key)}
					<li class="flex items-center gap-2.5 rounded-2xl bg-secondary/60 px-3 py-2">
						<span class="size-3 rounded-full" style="background: {s.color}"></span>
						<span class="flex-1 text-sm">{s.label}</span>
						<span class="text-lg font-semibold" style="font-family: var(--font-display)">{t[s.key]}</span>
						<span class="w-9 text-right text-xs text-muted-foreground tabular-nums">
							{t.total ? Math.round((t[s.key] / t.total) * 100) : 0}%
						</span>
					</li>
				{/each}
				<li class="flex items-center justify-between px-3 pt-1 text-sm text-muted-foreground">
					รวมทั้งหมด <span class="font-semibold text-foreground">{t.total} งาน</span>
				</li>
			</ul>
		</Card.Content>
	</Card.Root>

	<div class="grid grid-cols-2 gap-3 sm:gap-4 xl:col-span-3">
		{#each kpis as k (k.label)}
			<Card.Root class="justify-between gap-3 py-5">
				<Card.Content class="flex flex-col items-start gap-2 px-4 sm:flex-row sm:gap-3 sm:px-5">
					{@render bubble(k.icon, k.tint)}
					<div class="min-w-0">
						<p class="text-sm text-muted-foreground">{k.label}</p>
						{#if k.href}
							<a href={k.href} class="text-4xl font-semibold hover:underline" style="font-family: var(--font-display)">{k.value}</a>
						{:else}
							<p class="text-4xl font-semibold" style="font-family: var(--font-display)">{k.value}</p>
						{/if}
						<p class="text-xs text-muted-foreground">{k.sub}</p>
					</div>
				</Card.Content>
			</Card.Root>
		{/each}
	</div>
</div>

<!-- Per person: one donut each -->
<Card.Root class="mb-6">
	<Card.Header class="flex flex-wrap items-center gap-3">
		{@render bubble(UsersRound, 'bg-violet-50 text-violet-700')}
		<div class="flex-1">
			<Card.Title>สถานะงานรายบุคคล</Card.Title>
			<Card.Description>ตัวเลขกลางวง = งานทั้งหมดของแต่ละคน · คลิกชื่อเพื่อดูงาน</Card.Description>
		</div>
		<Legend items={STATUS_SERIES} />
	</Card.Header>
	<Card.Content>
		<div class="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-6">
			{#each people as p (p.id)}
				<div class="flex flex-col items-center gap-2 rounded-3xl bg-secondary/40 px-2 py-4 transition-colors hover:bg-secondary/80">
					<Donut slices={statusSlices(p)} size={112} thickness={0.42} title={p.name}>
						{#snippet center()}
							<p class="text-2xl leading-none font-semibold" style="font-family: var(--font-display)">{p.total}</p>
							<p class="text-[10px] text-muted-foreground">งาน</p>
						{/snippet}
					</Donut>
					<a href="/tasks?assignee={p.id}" class="max-w-full truncate text-sm font-medium hover:underline">{p.name}</a>
					<p class="-mt-2 max-w-full truncate text-[11px] text-muted-foreground">{p.position ?? ''}</p>
					<StatusChips counts={p} />
					{#if p.overdue}
						<span class="flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-medium text-red-700">
							<TriangleAlert class="size-3" /> เกินกำหนด {p.overdue}
						</span>
					{/if}
				</div>
			{/each}
		</div>
		<details class="mt-4 text-sm">
			<summary class="cursor-pointer text-muted-foreground hover:text-foreground">ดูข้อมูลแบบตาราง</summary>
			<Table.Root class="mt-2">
				<Table.Header>
					<Table.Row>
						<Table.Head>ผู้รับผิดชอบ</Table.Head>
						<Table.Head class="text-right">To do</Table.Head>
						<Table.Head class="text-right">Doing</Table.Head>
						<Table.Head class="text-right">Done</Table.Head>
						<Table.Head class="text-right">เกินกำหนด</Table.Head>
						<Table.Head class="text-right">ชม. จริง/ประเมิน</Table.Head>
						<Table.Head class="text-right">% เสร็จ</Table.Head>
					</Table.Row>
				</Table.Header>
				<Table.Body>
					{#each people as p (p.id)}
						<Table.Row>
							<Table.Cell>{p.name}</Table.Cell>
							<Table.Cell class="text-right tabular-nums">{p.todo}</Table.Cell>
							<Table.Cell class="text-right tabular-nums">{p.doing}</Table.Cell>
							<Table.Cell class="text-right tabular-nums">{p.done}</Table.Cell>
							<Table.Cell class="text-right tabular-nums">{p.overdue}</Table.Cell>
							<Table.Cell class="text-right tabular-nums">{p.actualHours}/{p.estHours}</Table.Cell>
							<Table.Cell class="text-right tabular-nums">{pct(p.doneRate)}</Table.Cell>
						</Table.Row>
					{/each}
				</Table.Body>
			</Table.Root>
		</details>
	</Card.Content>
</Card.Root>

<!-- Per project: one donut each -->
<Card.Root class="mb-6">
	<Card.Header class="flex flex-wrap items-center gap-3">
		{@render bubble(FolderHeart, 'bg-fuchsia-50 text-fuchsia-700')}
		<div class="flex-1">
			<Card.Title>สถานะงานรายโปรเจกต์</Card.Title>
			<Card.Description>ตัวเลขกลางวง = ความคืบหน้าเฉลี่ย · ใต้วง = จำนวนงานแต่ละสถานะ</Card.Description>
		</div>
		<Legend items={STATUS_SERIES} />
	</Card.Header>
	<Card.Content>
		<div class="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-7">
			{#each projects as p (p.id)}
				<a href="/projects/{p.id}" class="flex flex-col items-center gap-2 rounded-3xl bg-secondary/40 px-2 py-4 transition-colors hover:bg-secondary/80">
					<Donut slices={statusSlices(p)} size={112} thickness={0.42} title={p.name}>
						{#snippet center()}
							<p class="text-xl leading-none font-semibold" style="font-family: var(--font-display)">{p.avgProgress}%</p>
							<p class="text-[10px] text-muted-foreground">{p.total} งาน</p>
						{/snippet}
					</Donut>
					<span class="max-w-full truncate px-1 text-center text-sm font-medium">{p.name}</span>
					<StatusChips counts={p} />
					{#if p.overdue}
						<span class="flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-medium text-red-700">
							<TriangleAlert class="size-3" /> เกินกำหนด {p.overdue}
						</span>
					{/if}
				</a>
			{/each}
		</div>
	</Card.Content>
</Card.Root>

<!-- Deadlines -->
<div class="mb-6 grid gap-6 xl:grid-cols-2">
	{#each [{ title: 'งานที่เลยกำหนด', list: data.overdue, icon: TriangleAlert, tint: 'bg-red-50 text-red-700', badge: 'bg-red-100 text-red-700', empty: 'ไม่มีงานเกินกำหนด เยี่ยมมาก 🎉', overdue: true }, { title: 'ใกล้ครบกำหนด (ภายใน 3 วัน)', list: data.soon, icon: Hourglass, tint: 'bg-amber-50 text-amber-700', badge: 'bg-amber-100 text-amber-800', empty: 'ไม่มีงานใกล้ครบกำหนด', overdue: false }] as box (box.title)}
		<Card.Root>
			<Card.Header class="flex items-center gap-3">
				{@render bubble(box.icon, box.tint)}
				<div>
					<Card.Title>{box.title} ({box.list.length})</Card.Title>
					<Card.Description>วงกลมเล็ก = ความคืบหน้าของงาน · คลิกเพื่อเปิดงาน</Card.Description>
				</div>
			</Card.Header>
			<Card.Content class="space-y-2">
				{#each box.list as task (task.id)}
					{@const days = Math.abs(task.daysLeft!)}
					<a href="/tasks/{task.id}" class="flex items-center gap-3 rounded-2xl bg-secondary/40 p-2.5 transition-colors hover:bg-secondary/80">
						<span class="grid size-12 shrink-0 place-items-center rounded-2xl text-center leading-none {box.badge}">
							<span>
								<span class="block text-lg font-semibold" style="font-family: var(--font-display)">{days}</span>
								<span class="text-[10px]">{box.overdue ? 'วันที่เลย' : days === 0 ? 'วันนี้' : 'วันเหลือ'}</span>
							</span>
						</span>
						<span class="min-w-0 flex-1">
							<span class="block truncate text-sm font-medium">{task.title}</span>
							<span class="block truncate text-xs text-muted-foreground">{task.code} · {task.assigneeName ?? '-'} · {task.projectName}</span>
						</span>
						<Donut slices={progressSlices(task.progress)} size={44} thickness={0.32} labels={false} title={task.code}>
							{#snippet center()}<span class="text-[10px] font-semibold">{task.progress}%</span>{/snippet}
						</Donut>
					</a>
				{:else}
					<p class="py-6 text-center text-sm text-muted-foreground">{box.empty}</p>
				{/each}
			</Card.Content>
		</Card.Root>
	{/each}
</div>

<!-- Hours: ring per person = actual vs estimate -->
<Card.Root class="mb-6">
	<Card.Header class="flex flex-wrap items-center gap-3">
		{@render bubble(Timer, 'bg-violet-50 text-violet-700')}
		<div class="flex-1">
			<Card.Title>ชั่วโมงใช้จริงเทียบแผน</Card.Title>
			<Card.Description>
				ทั้งทีมใช้ไป {t.actualHours} จาก {t.estHours} ชม. ({pct(t.estHours ? t.actualHours / t.estHours : 0)}) · วงม่วง = ชั่วโมงจริง, วงจาง = ที่เหลือตามแผน
			</Card.Description>
		</div>
	</Card.Header>
	<Card.Content>
		<div class="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6 2xl:grid-cols-11">
			{#each people as p (p.id)}
				<div class="flex flex-col items-center gap-1.5 text-center">
					<Donut slices={hoursSlices(p.estHours, p.actualHours)} size={84} thickness={0.28} labels={false} title={p.name}>
						{#snippet center()}
							<span class="text-sm font-semibold" style="font-family: var(--font-display)">
								{p.estHours ? Math.round((p.actualHours / p.estHours) * 100) : 0}%
							</span>
						{/snippet}
					</Donut>
					<span class="max-w-full truncate text-xs font-medium">{p.name}</span>
					<span class="text-[11px] text-muted-foreground tabular-nums">{p.actualHours}/{p.estHours} ชม.</span>
				</div>
			{/each}
		</div>
	</Card.Content>
</Card.Root>

<Card.Root class="no-print">
	<Card.Header class="flex items-center justify-between">
		<Card.Title>ความเคลื่อนไหวล่าสุด</Card.Title>
		<a href="/activity" class="text-sm text-muted-foreground hover:underline">ดูทั้งหมด</a>
	</Card.Header>
	<Card.Content>
		<ActivityList entries={data.recent} people={data.people} projects={data.projects} />
	</Card.Content>
</Card.Root>
