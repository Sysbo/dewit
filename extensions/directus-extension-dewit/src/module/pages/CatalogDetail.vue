<template>
	<form-page
		:title="isNew ? 'New Catalog' : `${form.name} ${form.year ?? ''}`"
		back="/dewit/catalogs"
		:loading="loading"
		:saving="saving"
		:error="error"
		:can-save="canManage"
		:can-delete="!isNew && canManage"
		@save="save"
		@delete="destroy"
	>
		<div class="dw-grid">
			<field label="Catalog" size="half"><v-input v-model="form.name" :disabled="!canManage" /></field>
			<field label="Year" size="half"><v-input v-model="form.year" type="number" :disabled="!canManage" /></field>
			<field label="Tapestries" size="full">
				<v-select v-if="canManage" v-model="form.tapestries" :items="tapestryItems" multiple placeholder="Select tapestries" />
				<ul v-else class="dw-links">
					<li v-for="tapestry in labels" :key="tapestry.id">
						<router-link :to="`/dewit/tapestries/${tapestry.id}`">{{ tapestry.label }}</router-link>
					</li>
					<li v-if="!labels.length">No tapestry yet</li>
				</ul>
			</field>
		</div>
	</form-page>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { errorText, session, useDewit, useEntity } from '../api';
import Field from '../components/Field.vue';
import FormPage from '../components/FormPage.vue';

const props = defineProps<{ id: string }>();
const dewit = useDewit();
const labels = ref<{ id: number; label: string }[]>([]);

const { form, isNew, loading, saving, error, save, destroy } = useEntity(
	'catalogs',
	props,
	() => ({ name: '', year: null as number | null, tapestries: [] as number[] }),
	(data) => {
		labels.value = data.tapestries;
		return { ...data, tapestries: data.tapestries.map((tapestry: { id: number }) => tapestry.id) };
	},
);

const canManage = computed(() => session.role === 'manager');
const tapestryItems = ref<{ text: string; value: number }[]>([]);

watch(
	canManage,
	async (manager) => {
		if (!manager || tapestryItems.value.length) return;
		try {
			const rows = await dewit.get('/options/tapestries');
			tapestryItems.value = rows.map((row: any) => ({ text: row.label, value: row.id }));
		} catch (e) {
			error.value = errorText(e);
		}
	},
	{ immediate: true },
);
</script>
