<script lang="ts">
	import '../app.css';
	import { onMount } from 'svelte';
	import { Toaster } from 'svelte-sonner';
	import { Header, Footer } from '$lib/components/layout';
	import { themeStore } from '$lib/stores/theme.svelte';

	let { children } = $props();

	onMount(() => {
		themeStore.init();
	});
</script>

<Toaster position="top-right" richColors closeButton />

<div class="flex min-h-screen flex-col bg-background">
	<Header />

	<main class="flex-1">
		{@render children()}
	</main>

	<Footer />
</div>
