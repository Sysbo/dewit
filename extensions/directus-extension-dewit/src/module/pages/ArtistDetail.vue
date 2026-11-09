<template>
	<form-page
		:title="entity.isNew ? 'New Artist' : entity.form.name || 'Artist'"
		resource="artists"
		:id="id"
		:entity="entity"
		can-save
		:can-delete="!entity.isNew && session.role === 'manager'"
		navigable
	>
		<section class="dw-section">
			<div class="dw-grid">
				<field label="Artist Name" size="half" required :error="entity.fieldErrors.name"><v-input v-model="entity.form.name" /></field>
				<field label="Period" size="half"><v-input v-model="entity.form.period" /></field>
			</div>
		</section>
		<section v-if="!entity.isNew" class="dw-section">
			<h2 class="dw-section-title">
				Tapestries ({{ entity.form.total.toLocaleString('en-US') }})
				<router-link v-if="entity.form.total" class="dw-link dw-section-link" :to="`/dewit/tapestries?artist=${id}`">Open in tapestries</router-link>
			</h2>
			<ul v-if="entity.form.tapestries.length" class="dw-links">
				<li v-for="tapestry in entity.form.tapestries" :key="tapestry.id">
					<router-link :to="`/dewit/tapestries/${tapestry.id}`">{{ tapestry.label }}</router-link>
				</li>
			</ul>
			<p v-else class="dw-hint">No tapestry yet</p>
			<p v-if="entity.form.total > entity.form.tapestries.length" class="dw-hint">Showing the first {{ entity.form.tapestries.length }}.</p>
		</section>
	</form-page>
</template>

<script setup lang="ts">
import { session } from '../api';
import Field from '../components/Field.vue';
import FormPage from '../components/FormPage.vue';
import { isBlank, useEntity } from '../use-entity';

const props = defineProps<{ id: string }>();
const entity: any = useEntity<any>('artists', props, () => ({ name: '', period: '', total: 0, tapestries: [] }), {
	label: 'Artist',
	toForm: (data) => ({ ...data, period: data.period ?? '' }),
	validate: (form) => (isBlank(form.name) ? { name: 'Enter the artist name' } : {}),
});
</script>

<style>
.dw-section-link { font-size: 14px; font-weight: 500; }
</style>
