<script lang="ts">
	import { enhance } from '$app/forms';
	import { Button } from '#lib/components/ui/button/index.js';
	import { Badge } from '#lib/components/ui/badge/index.js';
	import * as Card from '#lib/components/ui/card/index.js';
	import * as Table from '#lib/components/ui/table/index.js';
	import EmployeeFields from '#lib/components/EmployeeFields.svelte';
	import UserPlus from '@lucide/svelte/icons/user-plus';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();
	let showForm = $state(false);
	$effect(() => {
		if (form?.created) showForm = false;
	});
</script>

<div class="mb-6 flex flex-wrap items-center justify-between gap-3">
	<div>
		<h1 class="text-2xl font-semibold">จัดการพนักงาน</h1>
		<p class="text-sm text-muted-foreground">เพิ่ม / แก้ไข / ปิดการใช้งานบัญชีพนักงาน</p>
	</div>
	<Button onclick={() => (showForm = !showForm)}><UserPlus /> เพิ่มพนักงาน</Button>
</div>

{#if form?.created}
	<p class="mb-4 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">เพิ่ม {form.created} เรียบร้อย</p>
{/if}

{#if showForm || form?.message}
	<Card.Root class="mb-6">
		<Card.Header><Card.Title>เพิ่มพนักงานใหม่</Card.Title></Card.Header>
		<Card.Content>
			<form method="POST" action="?/create" use:enhance class="space-y-4">
				<EmployeeFields values={form?.values} showPassword />
				{#if form?.message}<p class="text-sm text-destructive">{form.message}</p>{/if}
				<div class="flex gap-2">
					<Button type="submit">บันทึก</Button>
					<Button variant="ghost" type="button" onclick={() => (showForm = false)}>ยกเลิก</Button>
				</div>
			</form>
		</Card.Content>
	</Card.Root>
{/if}

<!-- Phone: card per employee -->
<ul class="space-y-2.5 md:hidden">
	{#each data.employees as e (e.id)}
		<li>
			<a
				href="/employees/{e.id}"
				class="flex items-center gap-3 rounded-3xl bg-card p-4 shadow-[0_4px_16px_-8px_oklch(0.5_0.12_305/0.25)] ring-1 ring-foreground/5 active:bg-secondary/60 {e.active ? '' : 'opacity-50'}"
			>
				<span class="grid size-11 shrink-0 place-items-center rounded-full bg-accent font-semibold text-accent-foreground">{e.name.slice(0, 1)}</span>
				<span class="min-w-0 flex-1">
					<span class="flex items-center gap-2">
						<span class="truncate font-medium">{e.name}</span>
						{#if e.role === 'admin'}<Badge>Admin</Badge>{/if}
						{#if !e.active}<Badge variant="secondary">ปิดใช้งาน</Badge>{/if}
					</span>
					<span class="block truncate text-xs text-muted-foreground">{e.position ?? '-'}</span>
					<span class="block truncate text-xs text-muted-foreground">{e.email}</span>
				</span>
				<span class="text-center">
					<span class="block text-lg leading-none font-semibold" style="font-family: var(--font-display)">{e.openTasks}</span>
					<span class="text-[10px] text-muted-foreground">งานค้าง</span>
				</span>
			</a>
		</li>
	{/each}
</ul>

<Card.Root class="hidden py-0 md:flex">
	<Table.Root>
		<Table.Header>
			<Table.Row>
				<Table.Head>ชื่อ</Table.Head>
				<Table.Head>ตำแหน่ง</Table.Head>
				<Table.Head>อีเมล</Table.Head>
				<Table.Head>สิทธิ์</Table.Head>
				<Table.Head class="text-right">งานค้าง</Table.Head>
				<Table.Head>สถานะ</Table.Head>
				<Table.Head></Table.Head>
			</Table.Row>
		</Table.Header>
		<Table.Body>
			{#each data.employees as e (e.id)}
				<Table.Row class={e.active ? '' : 'opacity-50'}>
					<Table.Cell class="font-medium">{e.name}</Table.Cell>
					<Table.Cell>{e.position ?? '-'}</Table.Cell>
					<Table.Cell class="text-muted-foreground">{e.email}</Table.Cell>
					<Table.Cell>
						{#if e.role === 'admin'}<Badge>Admin</Badge>{:else}<Badge variant="secondary">พนักงาน</Badge>{/if}
					</Table.Cell>
					<Table.Cell class="text-right tabular-nums">{e.openTasks}</Table.Cell>
					<Table.Cell>{e.active ? 'ใช้งาน' : 'ปิดใช้งาน'}</Table.Cell>
					<Table.Cell class="text-right">
						<Button variant="outline" size="sm" href="/employees/{e.id}">แก้ไข</Button>
					</Table.Cell>
				</Table.Row>
			{/each}
		</Table.Body>
	</Table.Root>
</Card.Root>
