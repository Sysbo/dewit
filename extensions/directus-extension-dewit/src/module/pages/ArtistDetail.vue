<template>
	<form-page
		:title="isNew ? 'New Artist' : form.name"
		back="/dewit/artists"
		:loading="loading"
		:saving="saving"
		:error="error"
		can-save
		:can-delete="!isNew && session.role === 'manager'"
		@save="save"
		@delete="destroy"
	>
		<div class="dw-grid">
			<field label="Artist Name" size="half"><v-input v-model="form.name" /></field>
			<field label="Period" size="half"><v-input v-model="form.period" /></field>
			<field v-if="!isNew" label="Tapestries" size="full">
				<ul class="dw-links">
					<li v-for="tapestry in form.tapestries" :key="tapestry.id">
						<router-link :to="`/dewit/tapestries/${tapestry.id}`">{{ tapestry.label }}</router-link>
					</li>
					<li v-if="!form.tapestries.length">No tapestry yet</li>
				</ul>
			</field>
		</div>
	</form-page>
</template>

<script setup lang="ts">
import { session, useEntity } from '../api';
import Field from '../components/Field.vue';
import FormPage from '../components/FormPage.vue';

const props = defineProps<{ id: string }>();
const { form, isNew, loading, saving, error, save, destroy } = useEntity('artists', props, () => ({
	name: '',
	period: '',
	tapestries: [] as { id: number; label: string }[],
}));
</script>
