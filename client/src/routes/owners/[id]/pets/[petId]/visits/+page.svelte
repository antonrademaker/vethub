<script lang="ts">
	import { page } from '$app/stores';
	import { getPetForOwner } from '$lib/api/pet/PetController';
	import { getVisitsByPet } from '$lib/api/visit/VisitController';
	import type { PetResponse, VisitResponse } from '$lib/api/models';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import { ArrowLeft, Stethoscope } from 'lucide-svelte';
	import { toast } from 'svelte-sonner';

	let pet = $state<PetResponse | null>(null);
	let visits = $state<VisitResponse[]>([]);

	const ownerId = $derived(Number($page.params.id));
	const petId = $derived(Number($page.params.petId));

	const sortedVisits = $derived(
		[...visits].sort((a, b) => new Date(b.date ?? '').getTime() - new Date(a.date ?? '').getTime())
	);

	function formatDate(dateStr: string | undefined): string {
		if (!dateStr) return 'Unknown';
		return new Date(dateStr).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		});
	}

	$effect(() => {
		if (ownerId && petId) {
			loadData();
		}
	});

	async function loadData() {
		try {
			[pet, visits] = await Promise.all([
				getPetForOwner(ownerId, petId),
				getVisitsByPet(ownerId, petId)
			]);
		} catch (err) {
			toast.error('Failed to load visit history');
			visits = [];
			console.error('Error:', err);
		}
	}
</script>

<svelte:head>
	<title>{pet ? `${pet.name} — Visits` : 'Visit History'} | VetHub</title>
</svelte:head>

<div class="container mx-auto px-4 py-8">
	<!-- Back Button -->
	<div class="mb-6">
		<Button variant="ghost" href="/owners/{ownerId}/pets/{petId}" class="gap-2">
			<ArrowLeft class="h-4 w-4" />
			Back to {pet?.name ?? 'Pet'}
		</Button>
	</div>

	<!-- Page Heading -->
	<div class="mb-8 flex items-center gap-3">
		<Stethoscope class="h-7 w-7 text-accent" />
		<h1 class="text-2xl font-bold">{pet?.name ?? '…'} — Visit History</h1>
	</div>

	<!-- Visit Table -->
	{#if sortedVisits.length === 0}
		<div class="card p-12 text-center">
			<Stethoscope class="mx-auto mb-4 h-12 w-12 text-muted-foreground/50" />
			<p class="text-muted-foreground">No visits recorded for this pet.</p>
		</div>
	{:else}
		<Card.Root>
			<Card.Content class="p-0">
				<table class="w-full text-sm">
					<thead>
						<tr class="border-b bg-muted/50">
							<th class="px-6 py-3 text-left font-medium text-muted-foreground">Date</th>
							<th class="px-6 py-3 text-left font-medium text-muted-foreground">Description</th>
							<th class="px-6 py-3 text-left font-medium text-muted-foreground">Vet</th>
						</tr>
					</thead>
					<tbody>
						{#each sortedVisits as visit (visit.id)}
							<tr class="border-b last:border-0 hover:bg-muted/30">
								<td class="px-6 py-4 align-top whitespace-nowrap text-muted-foreground">
									{formatDate(visit.date)}
								</td>
								<td class="px-6 py-4 align-top">{visit.description}</td>
								<td class="px-6 py-4 align-top text-muted-foreground">—</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</Card.Content>
		</Card.Root>

		<p class="mt-4 text-sm text-muted-foreground">
			Showing {sortedVisits.length}
			{sortedVisits.length === 1 ? 'visit' : 'visits'}
		</p>
	{/if}
</div>
