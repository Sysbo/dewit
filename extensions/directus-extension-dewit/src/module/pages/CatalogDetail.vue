<template>
	<form-page
		:title="entity.isNew ? 'New Catalog' : `${entity.form.name} (${entity.form.year ?? ''})`"
		resource="catalogs"
		:id="id"
		:entity="entity"
		:can-save="canManage"
		:can-delete="!entity.isNew && canManage"
		navigable
	>
		<section class="dw-section">
			<div v-if="canManage" class="dw-grid">
				<field label="Catalog" size="half" required :error="entity.fieldErrors.name"><v-input v-model="entity.form.name" /></field>
				<field label="Year" size="half" required :error="entity.fieldErrors.year"><v-input v-model="entity.form.year" type="number" min="1000" max="9999" /></field>
			</div>
			<fact-list v-else :facts="[{ label: 'Catalog', value: entity.form.name }, { label: 'Year', value: entity.form.year }]" />
		</section>

		<section class="dw-section">
			<h2 class="dw-section-title">
				Tapestries ({{ entity.form.tapestries.length.toLocaleString('en-US') }})
				<v-button v-if="canManage" small @click="picking = true"><v-icon name="add" small left />Add tapestries</v-button>
			</h2>

			<v-input v-if="entity.form.tapestries.length > 10" v-model="filter" :nullable="false" class="dw-catalog-filter" placeholder="Filter this catalog…" aria-label="Filter this catalog">
				<template #prepend><v-icon name="search" aria-hidden="true" /></template>
			</v-input>

			<p v-if="!entity.form.tapestries.length" class="dw-hint">No tapestry yet</p>
			<ul class="dw-catalog-list">
				<li v-for="tapestry in visible" :key="tapestry.id">
					<thumb :id="tapestry.thumbnail" />
					<router-link class="dw-catalog-main" :to="`/dewit/tapestries/${tapestry.id}`">
						<strong>{{ tapestry.inventorynumber }}</strong>
						<span class="dw-ellipsis">{{ tapestry.title || '—' }}</span>
					</router-link>
					<v-icon v-if="canManage" v-tooltip.left="'Remove from catalog'" name="close" clickable :aria-label="`Remove ${tapestry.inventorynumber}`" @click="remove(tapestry.id)" />
				</li>
			</ul>
			<div v-if="filtered.length > limit" class="dw-actions-row">
				<v-button secondary small @click="limit += STEP">Show more ({{ (filtered.length - limit).toLocaleString('en-US') }} remaining)</v-button>
			</div>
		</section>

		<tapestry-picker v-model="picking" title="Add tapestries" multiple @select="add" />
	</form-page>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { session } from '../api';
import FactList from '../components/FactList.vue';
import Field from '../components/Field.vue';
import FormPage from '../components/FormPage.vue';
import TapestryPicker from '../components/TapestryPicker.vue';
import Thumb from '../components/Thumb.vue';
import { isBlank, useEntity } from '../use-entity';

const STEP = 50;

const props = defineProps<{ id: string }>();
const entity: any = useEntity<any>('catalogs', props, () => ({ name: '', year: null, tapestries: [] }), {
	label: 'Catalog',
	toPayload: (form) => ({ ...form, tapestries: form.tapestries.map((tapestry: { id: number }) => tapestry.id) }),
	validate: (form) => {
		const errors: Record<string, string> = {};
		if (isBlank(form.name)) errors.name = 'Enter the catalog name';
		if (!form.year || Number(form.year) < 1000) errors.year = 'Enter a 4-digit year';
		return errors;
	},
});

const canManage = computed(() => session.role === 'manager');
const picking = ref(false);
const filter = ref('');
const limit = ref(STEP);
watch(filter, () => {
	limit.value = STEP;
});

const filtered = computed(() => {
	const term = filter.value.trim().toLowerCase();
	if (!term) return entity.form.tapestries;
	return entity.form.tapestries.filter((tapestry: any) => `${tapestry.inventorynumber} ${tapestry.title}`.toLowerCase().includes(term));
});
const visible = computed(() => filtered.value.slice(0, limit.value));

function add(items: any[]) {
	const known = new Set(entity.form.tapestries.map((tapestry: any) => tapestry.id));
	entity.form.tapestries = [
		...entity.form.tapestries,
		...items.filter((item) => !known.has(item.id)).map(({ id, inventorynumber, title, thumbnail }) => ({ id, inventorynumber, title, thumbnail })),
	];
}

function remove(id: number) {
	entity.form.tapestries = entity.form.tapestries.filter((tapestry: any) => tapestry.id !== id);
}
</script>

<style>
.dw-catalog-filter { max-width: 400px; margin-bottom: 12px; --theme--form--field--input--height: 44px; }
.dw-catalog-list { list-style: none; margin: 0; padding: 0; }
.dw-catalog-list li { display: flex; align-items: center; gap: 12px; padding: 8px 0; border-bottom: var(--theme--border-width, 2px) solid var(--theme--border-color-subdued); }
.dw-catalog-main { flex: 1; min-width: 0; }
.dw-catalog-main strong { color: var(--theme--foreground-accent); }
.dw-catalog-main:hover strong { color: var(--theme--primary); }
</style>
