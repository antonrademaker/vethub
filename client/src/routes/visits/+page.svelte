<script lang="ts">
	import { getVisits } from '$lib/api/visit/VisitController';
	import { getPets } from '$lib/api/pet/PetController';
	import { getOwners } from '$lib/api/owner/OwnerController';
	import type { VisitResponse, PetResponse, OwnerResponse } from '$lib/api/models';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import * as Table from '$lib/components/ui/table';
	import { Calendar, Search, Loader2, ExternalLink } from 'lucide-svelte';
	import { toast } from 'svelte-sonner';

	let visits = $state<VisitResponse[]>([]);
	let petMap = $state<Map<number, PetResponse>>(new Map());
	let ownerMap = $state<Map<number, OwnerResponse>>(new Map());
	let loading = $state(true);
	let searchQuery = $state('');

	function petName(petId: number): string {
		return petMap.get(petId)?.name ?? `Pet #${petId}`;
	}

	function ownerName(petId: number): string {
		const pet = petMap.get(petId);
		if (!pet) return '';
		const owner = ownerMap.get(pet.ownerId);
		if (!owner) return '';
		return `${owner.firstName} ${owner.lastName}`;
	}

	const filteredVisits = $derived(
		visits.filter(
			(visit) =>
				visit.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
				visit.date.includes(searchQuery) ||
				petName(visit.petId).toLowerCase().includes(searchQuery.toLowerCase()) ||
				ownerName(visit.petId).toLowerCase().includes(searchQuery.toLowerCase())
		)
	);

	async function loadVisits() {
		loading = true;
		try {
			const [fetchedVisits, fetchedPets, fetchedOwners] = await Promise.all([
				getVisits(),
				getPets(),
				getOwners()
			]);
			visits = fetchedVisits;
			petMap = new Map(fetchedPets.map((p) => [p.id, p]));
			ownerMap = new Map(fetchedOwners.map((o) => [o.id, o]));
		} catch (e) {
			toast.error('Failed to load visits');
			console.error('Error loading visits:', e);
		} finally {
			loading = false;
		}
	}

	$effect(() => {
		loadVisits();
	});
</script>

<svelte:head>
	<title>Visits | VetHub</title>
</svelte:head>

<div class="container mx-auto px-4 py-8">
	<!-- Header -->
	<div class="mb-8">
		<div class="flex items-center gap-3 mb-2">
			<div class="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
				<Calendar class="h-5 w-5 text-primary" />
			</div>
			<h1 class="text-3xl font-bold text-foreground">Visits</h1>
		</div>
		<p class="text-muted-foreground">View all veterinary visits across all pets</p>
	</div>

	<!-- Search -->
	<div class="mb-6">
		<div class="relative max-w-md">
			<Search class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
			<Input
				type="text"
				placeholder="Search by description, date, pet or owner..."
				class="pl-10"
				bind:value={searchQuery}
			/>
		</div>
	</div>

	<!-- Content -->
	{#if loading}
		<div class="flex items-center justify-center py-12">
			<Loader2 class="h-8 w-8 animate-spin text-primary" />
		</div>
	{:else if visits.length === 0}
		<div class="rounded-lg border border-dashed p-12 text-center">
			<Calendar class="mx-auto h-12 w-12 text-muted-foreground/50" />
			<h3 class="mt-4 text-lg font-medium text-foreground">No visits yet</h3>
			<p class="mt-2 text-sm text-muted-foreground">
				Visits will appear here once they are recorded for pets.
			</p>
		</div>
	{:else}
		<div class="rounded-lg border bg-card">
			<Table.Root>
				<Table.Header>
					<Table.Row>
						<Table.Head>Date</Table.Head>
						<Table.Head>Description</Table.Head>
						<Table.Head>Pet</Table.Head>
						<Table.Head>Owner</Table.Head>
						<Table.Head class="w-[100px]">Actions</Table.Head>
					</Table.Row>
				</Table.Header>
				<Table.Body>
					{#each filteredVisits as visit (visit.id)}
						<Table.Row>
							<Table.Cell class="font-medium">
								{new Date(visit.date).toLocaleDateString()}
							</Table.Cell>
							<Table.Cell>{visit.description}</Table.Cell>
							<Table.Cell>{petName(visit.petId)}</Table.Cell>
							<Table.Cell>{ownerName(visit.petId)}</Table.Cell>
							<Table.Cell>
								<Button variant="ghost" size="sm" disabled title="View pet details (coming soon)">
									<ExternalLink class="h-4 w-4" />
								</Button>
							</Table.Cell>
						</Table.Row>
					{:else}
						<Table.Row>
							<Table.Cell colspan={5} class="text-center text-muted-foreground py-8">
								No visits match your search
							</Table.Cell>
						</Table.Row>
					{/each}
				</Table.Body>
			</Table.Root>
		</div>

		<p class="mt-4 text-sm text-muted-foreground">
			Showing {filteredVisits.length} of {visits.length} visits
		</p>
	{/if}
</div>
