<script lang="ts">
	import './layout.css';
	import favicon from '#lib/assets/favicon.svg';
	import { page } from '$app/state';
	import { enhance } from '$app/forms';
	import { afterNavigate } from '$app/navigation';
	import type { LayoutProps } from './$types';
	import LayoutDashboard from '@lucide/svelte/icons/layout-dashboard';
	import Kanban from '@lucide/svelte/icons/square-kanban';
	import ListTodo from '@lucide/svelte/icons/list-todo';
	import FolderKanban from '@lucide/svelte/icons/folder-kanban';
	import Users from '@lucide/svelte/icons/users';
	import History from '@lucide/svelte/icons/history';
	import LogOut from '@lucide/svelte/icons/log-out';
	import KeyRound from '@lucide/svelte/icons/key-round';
	import Menu from '@lucide/svelte/icons/menu';
	import X from '@lucide/svelte/icons/x';

	let { children, data }: LayoutProps = $props();
	let drawerOpen = $state(false);

	// Close the phone drawer whenever a link is followed.
	afterNavigate(() => (drawerOpen = false));

	const nav = $derived([
		{ href: '/', label: 'Dashboard', icon: LayoutDashboard },
		{ href: '/board', label: 'Kanban', icon: Kanban },
		{ href: '/tasks', label: 'งานทั้งหมด', icon: ListTodo },
		{ href: '/projects', label: 'โปรเจกต์', icon: FolderKanban },
		{ href: '/activity', label: 'ประวัติการแก้ไข', icon: History },
		...(data.user?.role === 'admin' ? [{ href: '/employees', label: 'พนักงาน', icon: Users }] : [])
	]);
	const isActive = (href: string) =>
		href === '/' ? page.url.pathname === '/' : page.url.pathname.startsWith(href);
	const current = $derived(nav.find((n) => isActive(n.href))?.label ?? 'PMO Tracking');
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>PMO · Project Tracking</title>
</svelte:head>

<svelte:window onkeydown={(e) => e.key === 'Escape' && (drawerOpen = false)} />

{#snippet brand()}
	<a href="/" class="flex items-center gap-2.5" title="PMO Tracking">
		<span class="grid size-10 shrink-0 place-items-center rounded-xl bg-primary text-sm font-bold text-primary-foreground">
			PM
		</span>
		<span>
			<span class="block leading-tight font-semibold" style="font-family: var(--font-display)">PMO Tracking</span>
			<span class="block text-xs text-muted-foreground">ทีมการตลาดดิจิทัล</span>
		</span>
	</a>
{/snippet}

{#snippet sidebarBody()}
	<nav class="flex flex-1 flex-col gap-1 overflow-y-auto px-3">
		{#each nav as item (item.href)}
			<a
				href={item.href}
				aria-current={isActive(item.href) ? 'page' : undefined}
				class="flex items-center gap-3 rounded-xl px-3 py-3 text-[15px] transition-colors md:py-2.5 md:text-sm {isActive(
					item.href
				)
					? 'bg-primary text-primary-foreground shadow-sm'
					: 'text-secondary-foreground/80 hover:bg-accent hover:text-accent-foreground'}"
			>
				<item.icon class="size-5 shrink-0 md:size-4" />
				{item.label}
			</a>
		{/each}
	</nav>

	<div class="border-t border-border p-4">
		<div class="mb-2 flex items-center gap-2.5">
			<span class="grid size-9 shrink-0 place-items-center rounded-full bg-accent text-sm font-semibold text-accent-foreground">
				{data.user!.name.slice(0, 1)}
			</span>
			<span class="min-w-0">
				<span class="block truncate text-sm font-medium">{data.user!.name}</span>
				<span class="block text-xs text-muted-foreground">
					{data.user!.role === 'admin' ? 'Admin / หัวหน้าทีม' : 'พนักงาน'}
				</span>
			</span>
		</div>
		<div class="flex items-center justify-between">
			<a href="/account" class="flex items-center gap-1 rounded-md p-1.5 text-xs text-muted-foreground hover:bg-accent hover:text-foreground">
				<KeyRound class="size-3.5" /> เปลี่ยนรหัสผ่าน
			</a>
			<form method="POST" action="/logout" use:enhance>
				<button class="flex items-center gap-1 rounded-md p-1.5 text-xs text-muted-foreground hover:bg-accent hover:text-foreground">
					<LogOut class="size-3.5" /> ออกจากระบบ
				</button>
			</form>
		</div>
	</div>
{/snippet}

{#if data.user}
	<div class="min-h-dvh md:flex">
		<!-- Desktop / tablet: fixed left sidebar -->
		<aside class="no-print sticky top-0 hidden h-dvh w-60 shrink-0 flex-col border-r bg-sidebar md:flex">
			<div class="px-4 py-5">{@render brand()}</div>
			{@render sidebarBody()}
		</aside>

		<!-- Phone: top bar + slide-in drawer from the left -->
		<header
			class="no-print sticky top-0 z-30 flex items-center gap-3 border-b bg-sidebar/90 px-3 py-2 backdrop-blur md:hidden"
			style="padding-top: max(0.5rem, env(safe-area-inset-top))"
		>
			<button
				class="grid size-10 place-items-center rounded-xl hover:bg-accent"
				aria-label="เปิดเมนู"
				aria-expanded={drawerOpen}
				aria-controls="mobile-drawer"
				onclick={() => (drawerOpen = true)}
			>
				<Menu class="size-5" />
			</button>
			<span class="flex-1 truncate font-semibold" style="font-family: var(--font-display)">{current}</span>
			<span class="grid size-9 place-items-center rounded-full bg-accent text-sm font-semibold text-accent-foreground" title={data.user.name}>
				{data.user.name.slice(0, 1)}
			</span>
		</header>

		{#if drawerOpen}
			<button
				class="fixed inset-0 z-40 bg-foreground/30 backdrop-blur-[2px] md:hidden"
				aria-label="ปิดเมนู"
				onclick={() => (drawerOpen = false)}
			></button>
		{/if}
		<aside
			id="mobile-drawer"
			class="fixed inset-y-0 left-0 z-50 flex w-72 max-w-[85vw] flex-col bg-sidebar shadow-xl transition-transform duration-200 md:hidden {drawerOpen
				? 'translate-x-0'
				: '-translate-x-full'}"
			aria-hidden={!drawerOpen}
			inert={!drawerOpen}
		>
			<div class="flex items-center justify-between px-4 py-4">
				{@render brand()}
				<button class="grid size-10 place-items-center rounded-xl hover:bg-accent" aria-label="ปิดเมนู" onclick={() => (drawerOpen = false)}>
					<X class="size-5" />
				</button>
			</div>
			{@render sidebarBody()}
		</aside>

		<main class="min-w-0 flex-1 px-4 py-5 md:p-8" style="padding-bottom: max(1.25rem, env(safe-area-inset-bottom))">
			{@render children()}
		</main>
	</div>
{:else}
	{@render children()}
{/if}
