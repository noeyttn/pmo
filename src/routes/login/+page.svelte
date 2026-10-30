<script lang="ts">
	import { enhance } from '$app/forms';
	import { Button } from '#lib/components/ui/button/index.js';
	import { Input } from '#lib/components/ui/input/index.js';
	import { Label } from '#lib/components/ui/label/index.js';
	import * as Card from '#lib/components/ui/card/index.js';
	import type { PageProps } from './$types';

	let { form }: PageProps = $props();
	let loading = $state(false);
</script>

<svelte:head><title>เข้าสู่ระบบ · PMO Tracking</title></svelte:head>

<div class="flex min-h-screen items-center justify-center bg-muted p-4">
	<Card.Root class="w-full max-w-sm">
		<Card.Header>
			<Card.Title class="text-xl">PMO Project Tracking</Card.Title>
			<Card.Description>เข้าสู่ระบบด้วยบัญชีของคุณ</Card.Description>
		</Card.Header>
		<Card.Content>
			<form
				method="POST"
				class="space-y-4"
				use:enhance={() => {
					loading = true;
					return async ({ update }) => {
						await update();
						loading = false;
					};
				}}
			>
				<div class="space-y-2">
					<Label for="email">อีเมล</Label>
					<Input id="email" name="email" type="email" autocomplete="username" required value={form?.email ?? ''} />
				</div>
				<div class="space-y-2">
					<Label for="password">รหัสผ่าน</Label>
					<Input id="password" name="password" type="password" autocomplete="current-password" required />
				</div>
				{#if form?.message}
					<p class="text-sm text-destructive">{form.message}</p>
				{/if}
				<Button type="submit" class="w-full" disabled={loading}>
					{loading ? 'กำลังเข้าสู่ระบบ…' : 'เข้าสู่ระบบ'}
				</Button>
			</form>
		</Card.Content>
	</Card.Root>
</div>
