<template>
	<form-page
		:title="entity.isNew ? 'New Business Partner' : entity.form.name || 'Business Partner'"
		resource="partners"
		:id="id"
		:entity="entity"
		:can-save="canManage"
		:can-delete="!entity.isNew && canManage && !entity.form.isSelf"
		navigable
	>
		<v-notice v-if="entity.form.isSelf" class="dw-notice" type="info">This business partner is DeWit (SELF).</v-notice>

		<section class="dw-section">
			<div v-if="canManage" class="dw-grid">
				<field label="Name & Denomination" size="full" required :error="entity.fieldErrors.name"><v-input v-model="entity.form.name" /></field>
				<field label="Street" size="half"><v-input v-model="entity.form.addressstreet" /></field>
				<field label="Nr" size="half"><v-input v-model="entity.form.addressnr" /></field>
				<field label="Town & postal code" size="half"><v-input v-model="entity.form.addresstown" /></field>
				<field label="Country" size="half"><v-input v-model="entity.form.addresscountry" /></field>
				<field label="Type of business partner" size="half">
					<v-select v-model="entity.form.types" :items="typeItems" multiple show-deselect placeholder="Undefined" />
				</field>
				<field label="Status" size="half"><v-checkbox v-model="entity.form.active" label="Active" /></field>
			</div>
			<fact-list v-else :facts="facts" />
		</section>

		<section v-if="!entity.isNew" class="dw-section">
			<h2 class="dw-section-title">Related tapestries</h2>
			<ul class="dw-links">
				<li><router-link :to="`/dewit/tapestries?owner=${id}`">Tapestries owned by this partner</router-link></li>
				<li><router-link :to="`/dewit/tapestries?location=${entity.form.isSelf ? 'dewit' : `partner:${id}`}`">Tapestries stored here</router-link></li>
			</ul>
		</section>
	</form-page>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { session, useOptions } from '../api';
import FactList from '../components/FactList.vue';
import Field from '../components/Field.vue';
import FormPage from '../components/FormPage.vue';
import { isBlank, useEntity } from '../use-entity';

const TEXT_FIELDS = ['addressstreet', 'addressnr', 'addresstown', 'addresscountry'];

const props = defineProps<{ id: string }>();
const { options } = useOptions();

const entity: any = useEntity<any>(
	'partners',
	props,
	() => ({ name: '', addressstreet: '', addressnr: '', addresstown: '', addresscountry: '', active: true, isSelf: false, types: [] }),
	{
		label: 'Business partner',
		toForm: (data) => {
			const form: any = { ...data };
			for (const field of TEXT_FIELDS) form[field] = data[field] ?? '';
			return form;
		},
		validate: (form) => (isBlank(form.name) ? { name: 'Enter the name' } : {}),
	},
);

const canManage = computed(() => session.role === 'manager');
const typeItems = computed(() => options.relationTypes.map(({ id, name }) => ({ text: name, value: id })));
const facts = computed(() => [
	{ label: 'Name', value: entity.form.name },
	{ label: 'Address', value: [entity.form.addressstreet, entity.form.addressnr].filter(Boolean).join(' ') },
	{ label: 'Town', value: entity.form.addresstown },
	{ label: 'Country', value: entity.form.addresscountry },
	{ label: 'Type', value: options.relationTypes.filter((type) => entity.form.types.includes(type.id)).map((type) => type.name).join(', ') },
	{ label: 'Active', value: entity.form.active ? 'Yes' : 'No' },
]);
</script>
