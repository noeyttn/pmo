<script lang="ts">
	import { enhance } from '$app/forms';
	import { Button } from '#lib/components/ui/button/index.js';
	import { Input } from '#lib/components/ui/input/index.js';
	import { Label } from '#lib/components/ui/label/index.js';
	import * as Card from '#lib/components/ui/card/index.js';
	import EmployeeFields from '#lib/components/EmployeeFields.svelte';
	import ArrowLeft from '@lucide/svelte/icons/arrow-left';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();
	const e = $derived(data.employee);
</script>

<a href="/employees" class="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
	<ArrowLeft class="size-4" /> กลับไปรายชื่อพนักงาน
</a>
<div class="mb-6 flex flex-wrap items-center gap-3">
	<h1 class="text-2xl font-semibold">{e.name}</h1>
	{#if !e.active}<span class="rounded-full bg-zinc-200 px-2 py-0.5 text-xs">ปิดใช้งาน</span>{/if}
	<a href="/activity?entity=user&id={e.id}" class="ml-auto text-sm text-muted-foreground underline">ดูประวัติ</a>
</div>

<div class="grid gap-6 lg:grid-cols-3">
	<Card.Root class="lg:col-span-2">
		<Card.Header><Card.Title>ข้อมูลพนักงาน</Card.Title></Card.Header>
		<Card.Content>
			<form method="POST" action="?/update" use:enhance={() => ({ update }) => update({ reset: false })} class="space-y-4">
				<EmployeeFields values={form?.values ?? e} />
				{#if form?.message}<p class="text-sm text-destructive">{form.message}</p>{/if}
				{#if form?.saved}<p class="text-sm text-emerald-700">บันทึกแล้ว</p>{/if}
				<Button type="submit">บันทึกการแก้ไข</Button>
			</form>
		</Card.Content>
	</Card.Root>

	<div class="space-y-6">
		<Card.Root>
			<Card.Header><Card.Title>รีเซ็ตรหัสผ่าน</Card.Title></Card.Header>
			<Card.Content>
				<form method="POST" action="?/resetPassword" use:enhance class="space-y-3">
					<Label for="pw">รหัสผ่านใหม่ (≥ 8 ตัว)</Label>
					<Input id="pw" name="password" type="text" minlength={8} required autocomplete="off" />
					{#if form?.pwMessage}<p class="text-sm text-destructive">{form.pwMessage}</p>{/if}
					{#if form?.pwSaved}<p class="text-sm text-emerald-700">รีเซ็ตแล้ว (ออกจากระบบทุกอุปกรณ์)</p>{/if}
					<Button type="submit" variant="outline">รีเซ็ต</Button>
				</form>
			</Card.Content>
		</Card.Root>

		<Card.Root>
			<Card.Header>
				<Card.Title>ลดพนักงาน</Card.Title>
				<Card.Description>
					มีงานที่รับผิดชอบ {data.taskCount} งาน — แนะนำให้ “ปิดการใช้งาน” เพื่อเก็บประวัติไว้
				</Card.Description>
			</Card.Header>
			<Card.Content class="flex flex-wrap gap-2">
				<form method="POST" action="?/toggleActive" use:enhance>
					<Button type="submit" variant="outline">{e.active ? 'ปิดการใช้งาน' : 'เปิดใช้งานอีกครั้ง'}</Button>
				</form>
				<form
					method="POST"
					action="?/delete"
					use:enhance={({ cancel }) => {
						if (!confirm(`ลบ ${e.name} ถาวร?`)) cancel();
					}}
				>
					<Button type="submit" variant="destructive">ลบถาวร</Button>
				</form>
			</Card.Content>
		</Card.Root>
	</div>
</div>
