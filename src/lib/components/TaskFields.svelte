<script lang="ts">
	import { Input } from '#lib/components/ui/input/index.js';
	import { Label } from '#lib/components/ui/label/index.js';
	import { Textarea } from '#lib/components/ui/textarea/index.js';
	import { PRIORITY_LABEL, STATUS_LABEL } from '#lib/tasks.js';

	type Opt = { id: number; name: string };
	type Values = {
		title?: string;
		projectId?: number;
		assigneeId?: number | null;
		priority?: string;
		status?: string;
		startDate?: string | null;
		dueDate?: string | null;
		estHours?: number;
		actualHours?: number;
		progress?: number;
		note?: string | null;
	};
	let {
		values = {},
		people,
		projects,
		admin
	}: { values?: Values; people: Opt[]; projects: Opt[]; admin: boolean } = $props();
</script>

<div class="grid gap-4 sm:grid-cols-2">
	{#if admin}
		<div class="space-y-2 sm:col-span-2">
			<Label for="title">ชื่องาน *</Label>
			<Input id="title" name="title" required value={values.title ?? ''} />
		</div>
		<div class="space-y-2">
			<Label for="projectId">โครงการ *</Label>
			<select id="projectId" name="projectId" class="select" required value={String(values.projectId ?? '')}>
				<option value="" disabled>เลือกโครงการ</option>
				{#each projects as p (p.id)}<option value={String(p.id)}>{p.name}</option>{/each}
			</select>
		</div>
		<div class="space-y-2">
			<Label for="assigneeId">ผู้รับผิดชอบ</Label>
			<select id="assigneeId" name="assigneeId" class="select" value={String(values.assigneeId ?? '')}>
				<option value="">— ยังไม่มอบหมาย —</option>
				{#each people as u (u.id)}<option value={String(u.id)}>{u.name}</option>{/each}
			</select>
		</div>
		<div class="space-y-2">
			<Label for="priority">ความสำคัญ</Label>
			<select id="priority" name="priority" class="select" value={values.priority ?? 'medium'}>
				{#each Object.entries(PRIORITY_LABEL) as [k, v] (k)}<option value={k}>{v}</option>{/each}
			</select>
		</div>
		<div class="space-y-2">
			<Label for="estHours">ชั่วโมงประเมิน</Label>
			<Input id="estHours" name="estHours" type="number" min="0" step="0.5" value={values.estHours ?? 0} />
		</div>
		<div class="space-y-2">
			<Label for="startDate">วันเริ่ม</Label>
			<Input id="startDate" name="startDate" type="date" value={values.startDate ?? ''} />
		</div>
		<div class="space-y-2">
			<Label for="dueDate">กำหนดส่ง</Label>
			<Input id="dueDate" name="dueDate" type="date" value={values.dueDate ?? ''} />
		</div>
	{/if}
	<div class="space-y-2">
		<Label for="status">สถานะ</Label>
		<select id="status" name="status" class="select" value={values.status ?? 'todo'}>
			{#each Object.entries(STATUS_LABEL) as [k, v] (k)}<option value={k}>{v}</option>{/each}
		</select>
	</div>
	<div class="space-y-2">
		<Label for="progress">% ความคืบหน้า</Label>
		<Input id="progress" name="progress" type="number" min="0" max="100" step="5" value={values.progress ?? 0} />
	</div>
	<div class="space-y-2">
		<Label for="actualHours">ชั่วโมงที่ใช้จริง</Label>
		<Input id="actualHours" name="actualHours" type="number" min="0" step="0.5" value={values.actualHours ?? 0} />
	</div>
	<div class="space-y-2 sm:col-span-2">
		<Label for="note">หมายเหตุ / อัปเดตล่าสุด</Label>
		<Textarea id="note" name="note" rows={3} value={values.note ?? ''} />
	</div>
</div>
