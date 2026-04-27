<script lang="ts">
	import { page } from '$app/stores';
	import { getPetById } from '$lib/api/pet/PetController';
	import { getVisits, createVisit } from '$lib/api/visit/VisitController';
	import { getOwners } from '$lib/api/owner/OwnerController';
	import { getVets } from '$lib/api/vet/VetController';
	import type { PetResponse, VisitResponse, OwnerResponse, VetResponse } from '$lib/api/models';
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Textarea } from '$lib/components/ui/textarea';
	import * as Card from '$lib/components/ui/card';
	import { ArrowLeft, PawPrint, Calendar, Stethoscope } from 'lucide-svelte';
	import { toast } from 'svelte-sonner';

	const petId = $derived(Number($page.params.id));

	let pet = $state<PetResponse | null>(null);
	let visits = $state<VisitResponse[]>([]);
	let owners = $state<OwnerResponse[]>([]);
	let vets = $state<VetResponse[]>([]);
	let loading = $state(true);
	let notFound = $state(false);

	// Add Visit form state
	let formDate = $state(new Date().toISOString().slice(0, 10));
	let formDescription = $state('');
	let formVetId = $state('');
	let descriptionError = $state('');
	let submitting = $state(false);

	const ownerName = $derived(() => {
		if (!pet) return '';
		const owner = owners.find((o) => o.id === pet!.ownerId);
		if (!owner) return '';
		return `${owner.firstName} ${owner.lastName}`;
	});

	const petVisits = $derived(
		[...visits.filter((v) => v.petId === petId)].sort(
			(a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
		)
	);

	function formatDate(dateStr: string | undefined): string {
		if (!dateStr) return 'Unknown';
		return new Date(dateStr).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		});
	}

	function calculateAge(birthDate: string | undefined): string {
		if (!birthDate) return 'Unknown age';
		const birth = new Date(birthDate);
		const now = new Date();
		const years = Math.floor((now.getTime() - birth.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
		if (years === 0) {
			const months = Math.floor(
				(now.getTime() - birth.getTime()) / (30.44 * 24 * 60 * 60 * 1000)
			);
			return months <= 1 ? '< 1 month old' : `${months} months old`;
		}
		return years === 1 ? '1 year old' : `${years} years old`;
	}

	async function load() {
		loading = true;
		notFound = false;
		try {
			const [fetchedVisits, fetchedOwners, fetchedVets] = await Promise.all([
				getVisits(),
				getOwners(),
				getVets()
			]);
			visits = fetchedVisits;
			owners = fetchedOwners;
			vets = fetchedVets;
			// Pet fetched separately so we can handle 404 distinctly
			pet = await getPetById(petId);
		} catch (err: unknown) {
			const status = (err as { status?: number })?.status;
			if (status === 404) {
				notFound = true;
			} else {
				toast.error('Failed to load pet');
				console.error('Error:', err);
			}
		} finally {
			loading = false;
		}
	}

	async function submitVisit() {
		descriptionError = '';
		if (!formDescription.trim()) {
			descriptionError = 'Description is required';
			return;
		}
		submitting = true;
		try {
			const newVisit = await createVisit({
				date: formDate,
				description: formDescription.trim(),
				petId,
				vetId: formVetId ? Number(formVetId) : undefined
			});
			visits = [...visits, newVisit];
			formDescription = '';
			formVetId = '';
			formDate = new Date().toISOString().slice(0, 10);
			toast.success('Visit added');
		} catch (err) {
			toast.error('Failed to add visit');
			console.error('Error:', err);
		} finally {
			submitting = false;
		}
	}

	$effect(() => {
		if (petId) {
			load();
		}
	});
</script>

<svelte:head>
	<title>{pet ? `${pet.name} | VetHub` : 'Pet | VetHub'}</title>
</svelte:head>

<div class="container mx-auto px-4 py-8">
	<!-- Back Button -->
	<div class="mb-6">
		<Button variant="ghost" href="/pets" class="gap-2">
			<ArrowLeft class="h-4 w-4" />
			Back to Pets
		</Button>
	</div>

	{#if loading}
		<div class="card p-12 text-center">
			<div
				class="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"
			></div>
			<p class="text-muted-foreground">Loading pet...</p>
		</div>
	{:else if notFound}
		<div class="card p-12 text-center">
			<PawPrint class="mx-auto mb-4 h-12 w-12 text-muted-foreground/50" />
			<p class="text-muted-foreground">Pet not found</p>
		</div>
	{:else if pet}
		<!-- Pet Info Card -->
		<Card.Root class="mb-8">
			<Card.Header>
				<div class="flex items-center gap-4">
					<div class="flex h-16 w-16 items-center justify-center rounded-full bg-accent/10">
						<PawPrint class="h-8 w-8 text-accent" />
					</div>
					<div>
						<Card.Title class="text-2xl">{pet.name}</Card.Title>
						<div class="mt-1 flex items-center gap-2">
							<Badge variant="secondary">{pet.type?.name ?? 'Unknown type'}</Badge>
							<span class="text-muted-foreground">•</span>
							<span class="text-muted-foreground">{calculateAge(pet.birthDate)}</span>
						</div>
					</div>
				</div>
			</Card.Header>
			<Card.Content class="space-y-2">
				<div class="flex items-center gap-3 text-muted-foreground">
					<Calendar class="h-5 w-5" />
					<span>Born: {formatDate(pet.birthDate)}</span>
				</div>
				{#if ownerName()}
					<div class="flex items-center gap-3 text-muted-foreground">
						<span class="h-5 w-5 text-center text-sm">👤</span>
						<span>Owner: {ownerName()}</span>
					</div>
				{/if}
			</Card.Content>
		</Card.Root>

		<!-- Visit History -->
		<h2 class="mb-4 text-xl font-semibold text-foreground">Visit History</h2>

		{#if petVisits.length === 0}
			<div class="mb-8 rounded-lg border border-dashed p-8 text-center">
				<Stethoscope class="mx-auto mb-3 h-10 w-10 text-muted-foreground/50" />
				<p class="text-muted-foreground">No visits recorded for this pet</p>
			</div>
		{:else}
			<div class="mb-8 rounded-lg border bg-card">
				<table class="w-full text-sm">
					<thead>
						<tr class="border-b bg-muted/50">
							<th class="px-4 py-3 text-left font-medium text-muted-foreground">Date</th>
							<th class="px-4 py-3 text-left font-medium text-muted-foreground">Description</th>
							<th class="px-4 py-3 text-left font-medium text-muted-foreground">Vet</th>
						</tr>
					</thead>
					<tbody>
						{#each petVisits as visit (visit.id)}
							<tr class="border-b last:border-0 hover:bg-muted/30">
								<td class="px-4 py-3 text-muted-foreground">{formatDate(visit.date)}</td>
								<td class="px-4 py-3 font-medium">{visit.description}</td>
								<td class="px-4 py-3 text-muted-foreground">{visit.vetName ?? '—'}</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{/if}

		<!-- Add Visit Form -->
		<Card.Root>
			<Card.Header>
				<Card.Title>Add Visit</Card.Title>
			</Card.Header>
			<Card.Content class="space-y-4">
				<div class="space-y-1">
					<Label for="visit-date">Date</Label>
					<Input id="visit-date" type="date" bind:value={formDate} />
				</div>

				<div class="space-y-1">
					<Label for="visit-vet">Vet</Label>
					<select
						id="visit-vet"
						bind:value={formVetId}
						class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
					>
						<option value="">— No vet —</option>
						{#each vets as vet (vet.id)}
							<option value={vet.id}>{vet.firstName} {vet.lastName}</option>
						{/each}
					</select>
				</div>

				<div class="space-y-1">
					<Label for="visit-description">Description</Label>
					<Textarea
						id="visit-description"
						placeholder="Describe the visit..."
						bind:value={formDescription}
						rows={3}
					/>
					{#if descriptionError}
						<p class="text-sm text-destructive">{descriptionError}</p>
					{/if}
				</div>

				<div class="flex justify-end">
					<Button onclick={submitVisit} disabled={submitting}>
						{#if submitting}
							Adding...
						{:else}
							Add Visit
						{/if}
					</Button>
				</div>
			</Card.Content>
		</Card.Root>
	{/if}
</div>
