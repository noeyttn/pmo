<script lang="ts">
	import { Input } from '#lib/components/ui/input/index.js';
	import { Label } from '#lib/components/ui/label/index.js';

	type Values = {
		name?: string | null;
		email?: string | null;
		role?: string | null;
		position?: string | null;
		duties?: string | null;
		level?: string | null;
		startDate?: string | null;
	};
	let { values = {}, showPassword = false }: { values?: Values; showPassword?: boolean } = $props();
</script>

<div class="grid gap-4 sm:grid-cols-2">
	<div class="space-y-2">
		<Label for="name">ชื่อ *</Label>
		<Input id="name" name="name" required value={values.name ?? ''} />
	</div>
	<div class="space-y-2">
		<Label for="email">อีเมล (ใช้ Login) *</Label>
		<Input id="email" name="email" type="email" required value={values.email ?? ''} />
	</div>
	<div class="space-y-2">
		<Label for="position">ตำแหน่ง</Label>
		<Input id="position" name="position" value={values.position ?? ''} />
	</div>
	<div class="space-y-2">
		<Label for="role">สิทธิ์</Label>
		<select id="role" name="role" class="select" value={values.role ?? 'member'}>
			<option value="member">พนักงาน</option>
			<option value="admin">Admin (หัวหน้า)</option>
		</select>
	</div>
	<div class="space-y-2 sm:col-span-2">
		<Label for="duties">หน้าที่หลัก</Label>
		<Input id="duties" name="duties" value={values.duties ?? ''} />
	</div>
	<div class="space-y-2">
		<Label for="level">ระดับ</Label>
		<Input id="level" name="level" value={values.level ?? ''} placeholder="เช่น ระดับ 3" />
	</div>
	<div class="space-y-2">
		<Label for="startDate">วันเริ่มงาน</Label>
		<Input id="startDate" name="startDate" type="date" value={values.startDate ?? ''} />
	</div>
	{#if showPassword}
		<div class="space-y-2">
			<Label for="password">รหัสผ่านเริ่มต้น * (≥ 8 ตัว)</Label>
			<Input id="password" name="password" type="text" required minlength={8} autocomplete="off" />
		</div>
	{/if}
</div>
