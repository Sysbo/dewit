<template>
	<form-page
		:title="isNew ? 'New Orientation' : form.name"
		back="/dewit/orientations"
		:loading="loading"
		:saving="saving"
		:error="error"
		can-save
		:can-delete="!isNew"
		@save="save"
		@delete="destroy"
	>
		<div class="dw-grid">
			<field label="Orientation" size="half"><v-input v-model="form.name" /></field>
		</div>
	</form-page>
</template>

<script setup lang="ts">
import { useEntity } from '../api';
import Field from '../components/Field.vue';
import FormPage from '../components/FormPage.vue';

const props = defineProps<{ id: string }>();
const { form, isNew, loading, saving, error, save, destroy } = useEntity('orientations', props, () => ({ name: '' }));
</script>
