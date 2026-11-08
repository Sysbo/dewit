<template>
	<form-page
		:title="isNew ? 'New Business Partner' : form.name"
		back="/dewit/partners"
		:loading="loading"
		:saving="saving"
		:error="error"
		:can-save="canManage"
		:can-delete="!isNew && canManage && !form.isSelf"
		@save="save"
		@delete="destroy"
	>
		<v-notice v-if="form.isSelf" class="dw-notice" type="info">This business partner is DeWit (SELF).</v-notice>
		<div class="dw-grid">
			<field label="Name & Denomination" size="full"><v-input v-model="form.name" :disabled="!canManage" /></field>
			<field label="Street"><v-input v-model="form.addressstreet" :disabled="!canManage" /></field>
			<field label="Nr"><v-input v-model="form.addressnr" :disabled="!canManage" /></field>
			<field label="Town & postal code"><v-input v-model="form.addresstown" :disabled="!canManage" /></field>
			<field label="Country"><v-input v-model="form.addresscountry" :disabled="!canManage" /></field>
			<field label="Type of business partner">
				<v-select
					v-model="form.types"
					:items="typeItems"
					multiple
					show-deselect
					:disabled="!canManage"
					placeholder="Undefined"
				/>
			</field>
			<field label="Active"><v-checkbox v-model="form.active" :disabled="!canManage" label="Active" /></field>
		</div>
	</form-page>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { errorText, session, useDewit, useEntity } from '../api';
import Field from '../components/Field.vue';
import FormPage from '../components/FormPage.vue';

const props = defineProps<{ id: string }>();
const dewit = useDewit();
const { form, isNew, loading, saving, error, save, destroy } = useEntity('partners', props, () => ({
	name: '',
	addressstreet: '',
	addressnr: '',
	addresstown: '',
	addresscountry: '',
	active: true,
	isSelf: false,
	types: [] as number[],
}));

const canManage = computed(() => session.role === 'manager');
const relationTypes = ref<{ id: number; name: string }[]>([]);
const typeItems = computed(() => relationTypes.value.map(({ id, name }) => ({ text: name, value: id })));

onMounted(async () => {
	try {
		relationTypes.value = (await dewit.get('/options')).relationTypes;
	} catch (e) {
		error.value = errorText(e);
	}
});
</script>
