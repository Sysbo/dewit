<template>
	<form-page
		:title="entity.isNew ? 'New Orientation' : entity.form.name || 'Orientation'"
		resource="orientations"
		:id="id"
		:entity="entity"
		can-save
		:can-delete="!entity.isNew"
	>
		<section class="dw-section">
			<div class="dw-grid">
				<field label="Orientation" size="half" required :error="entity.fieldErrors.name"><v-input v-model="entity.form.name" /></field>
			</div>
		</section>
	</form-page>
</template>

<script setup lang="ts">
import Field from '../components/Field.vue';
import FormPage from '../components/FormPage.vue';
import { isBlank, useEntity } from '../use-entity';

const props = defineProps<{ id: string }>();
const entity: any = useEntity<any>('orientations', props, () => ({ name: '' }), {
	label: 'Orientation',
	toForm: (data) => ({ ...data, name: data.name ?? '' }),
	validate: (form) => (isBlank(form.name) ? { name: 'Enter the orientation' } : {}),
});
</script>
