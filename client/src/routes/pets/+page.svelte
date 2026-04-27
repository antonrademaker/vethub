<script lang="ts">
	import { getPets } from '$lib/api/pet/PetController';
	import type { PetResponse } from '$lib/api/models';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import * as Table from '$lib/components/ui/table';
	import { PawPrint, Search, ExternalLink } from 'lucide-svelte';
	import { toast } from 'svelte-sonner';

	let pets = $state<PetResponse[]>([]);
	let loading = $state(true);
	let searchQuery = $state('');
	let birthDateQuery = $state('');

	const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

	// Filtered pets based on search query and birth date
	let filteredPets = $derived(() => {
		let result = pets;

		if (searchQuery.trim()) {
			const query = searchQuery.toLowerCase();
			result = result.filter(
				(pet) =>
					pet.name?.toLowerCase().includes(query) ||
					pet.type?.name?.toLowerCase().includes(query)
			);
		}

		if (birthDateQuery && DATE_REGEX.test(birthDateQuery)) {
			result = result.filter((pet) => pet.birthDate === birthDateQuery);
		}

		return result;
	});

	async function loadPets() {
		loading = true;
		try {
			pets = await getPets();
		} catch (err) {
			toast.error('Failed to load pets');
			console.error('Error loading pets:', err);
		} finally {
			loading = false;
		}
	}

	// Load pets on mount
	$effect(() => {
		loadPets();
	});
</script>

<svelte:head>
	<title>Pets | VetHub</title>
</svelte:head>

<div class="container mx-auto px-4 py-8">
	<!-- Header -->
	<div class="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
		<div class="flex items-center gap-3">
			<div class="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
				<PawPrint class="h-6 w-6 text-primary" />
			</div>
			<div>
				<h1 class="text-2xl font-bold text-foreground">Pets</h1>
				<p class="text-sm text-muted-foreground">Browse all registered patients</p>
			</div>
		</div>
	</div>

	<!-- Search -->
	<div class="mb-6 flex flex-col gap-3 sm:flex-row">
		<div class="relative max-w-md flex-1">
			<Search class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
			<Input
				type="search"
				placeholder="Search by name or type..."
				bind:value={searchQuery}
				class="pl-10"
			/>
		</div>
		<div class="relative max-w-xs">
			<Input
				type="date"
				placeholder="Filter by birth date"
				bind:value={birthDateQuery}
			/>
		</div>
	</div>

	<!-- Table -->
	{#if loading}
		<div class="card p-12 text-center">
			<div class="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
			<p class="text-muted-foreground">Loading pets...</p>
		</div>
	{:else if filteredPets().length === 0}
		<div class="card p-12 text-center">
			<PawPrint class="mx-auto mb-4 h-12 w-12 text-muted-foreground/50" />
			{#if searchQuery || birthDateQuery}
				<p class="text-muted-foreground">No pets found matching "{searchQuery || birthDateQuery}"</p>
			{:else}
				<p class="text-muted-foreground">No pets registered yet</p>
			{/if}
		</div>
	{:else}
		<div class="card overflow-hidden">
			<Table.Root>
				<Table.Header>
					<Table.Row>
						<Table.Head>Name</Table.Head>
						<Table.Head>Type</Table.Head>
						<Table.Head>Birth Date</Table.Head>
						<Table.Head class="w-[100px]">Actions</Table.Head>
					</Table.Row>
				</Table.Header>
				<Table.Body>
					{#each filteredPets() as pet (pet.id)}
						<Table.Row class="hover:bg-muted/50">
							<Table.Cell>
								{#if pet.ownerId}
									<a
										href="/owners/{pet.ownerId}/pets/{pet.id}"
										class="font-medium text-foreground hover:text-primary"
									>
										{pet.name}
									</a>
								{:else}
									<span class="font-medium text-foreground">{pet.name}</span>
								{/if}
							</Table.Cell>
							<Table.Cell>{pet.type?.name ?? '—'}</Table.Cell>
							<Table.Cell>{pet.birthDate ?? '—'}</Table.Cell>
						<Table.Cell>
							<Button variant="ghost" size="sm" href="/pets/{pet.id}" title="View pet detail">
								<ExternalLink class="h-4 w-4" />
							</Button>
						</Table.Cell>
						</Table.Row>
					{/each}
				</Table.Body>
			</Table.Root>
		</div>
		<p class="mt-4 text-sm text-muted-foreground">
			Showing {filteredPets().length} of {pets.length} pets
		</p>
	{/if}
</div>
