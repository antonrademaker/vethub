<script lang="ts">
	import { Palette, Check } from 'lucide-svelte';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import { Button } from '$lib/components/ui/button';
	import { themeStore, THEMES } from '$lib/stores/theme.svelte';

	const PRIDE_GRADIENT = 'linear-gradient(90deg, #E40303, #FF8C00, #FFED00, #008026, #004DFF, #750787)';
</script>

<DropdownMenu.Root>
	<DropdownMenu.Trigger>
		{#snippet child({ props })}
			<Button
				{...props}
				variant="ghost"
				size="icon"
				aria-label="Pick a theme"
				title="Pick a theme"
			>
				<Palette class="h-5 w-5" />
			</Button>
		{/snippet}
	</DropdownMenu.Trigger>

	<DropdownMenu.Content align="end" class="w-44">
		<DropdownMenu.Label class="text-xs text-muted-foreground">Theme</DropdownMenu.Label>
		<DropdownMenu.Separator />
		{#each THEMES as theme (theme.id)}
			<DropdownMenu.Item
				class="flex cursor-pointer items-center gap-3"
				onclick={() => themeStore.set(theme.id)}
			>
				<!-- Colour swatch -->
				<span
					class="inline-block h-4 w-4 shrink-0 rounded-sm border border-border"
					style={theme.id === 'pride'
						? `background: ${PRIDE_GRADIENT}`
						: `background-color: ${theme.swatch}`}
				></span>
				<span class="flex-1 text-sm">{theme.label}</span>
				{#if themeStore.current === theme.id}
					<Check class="h-3.5 w-3.5 text-primary" />
				{/if}
			</DropdownMenu.Item>
		{/each}
	</DropdownMenu.Content>
</DropdownMenu.Root>
