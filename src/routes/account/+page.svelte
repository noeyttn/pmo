<script lang="ts">
	import { enhance } from '$app/forms';
	import { Button } from '#lib/components/ui/button/index.js';
	import { Input } from '#lib/components/ui/input/index.js';
	import { Label } from '#lib/components/ui/label/index.js';
	import * as Card from '#lib/components/ui/card/index.js';
	import type { PageProps } from './$types';

	let { form }: PageProps = $props();
</script>

<h1 class="mb-6 text-2xl font-semibold">เปลี่ยนรหัสผ่าน</h1>
<Card.Root class="max-w-md">
	<Card.Content>
		<form method="POST" use:enhance class="space-y-4">
			<div class="space-y-2">
				<Label for="current">รหัสผ่านปัจจุบัน</Label>
				<Input id="current" name="current" type="password" required autocomplete="current-password" />
			</div>
			<div class="space-y-2">
				<Label for="next">รหัสผ่านใหม่ (อย่างน้อย 8 ตัว)</Label>
				<Input id="next" name="next" type="password" required minlength={8} autocomplete="new-password" />
			</div>
			{#if form?.message}<p class="text-sm text-destructive">{form.message}</p>{/if}
			{#if form?.ok}<p class="text-sm text-emerald-700">เปลี่ยนรหัสผ่านเรียบร้อย</p>{/if}
			<Button type="submit">บันทึก</Button>
		</form>
	</Card.Content>
</Card.Root>
