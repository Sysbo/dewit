<template>
	<layout title="Sales">
		<template #actions>
			<v-button v-if="tapestry" rounded icon :loading="saving" @click="submit">
				<v-icon name="check" />
			</v-button>
		</template>

		<v-notice v-if="error" class="dw-notice" type="danger">{{ error }}</v-notice>
		<v-notice v-if="message" class="dw-notice" type="success">{{ message }}</v-notice>

		<div class="dw-grid">
			<field label="Tapestry" size="full">
				<v-select :model-value="tapestry" :items="tapestryItems" placeholder="Select a tapestry" @update:model-value="selectTapestry" />
			</field>

			<template v-if="tapestry && !loading">
				<field label="For Sale?" size="full">
					<v-checkbox :model-value="form.forsale" label="This tapestry is for sale" @update:model-value="toggleForSale" />
				</field>
				<v-notice v-if="withdrawing" class="dw-field--full" type="warning">
					Saving will withdraw this tapestry from sale.
				</v-notice>
				<template v-if="form.forsale">
					<field label="Seller" size="half"><v-select v-model="form.seller" :items="partnerItems" /></field>
					<field label="Minimum Price" size="half"><v-input v-model="form.minprice" type="number" /></field>
					<field label="Sale Price"><v-input v-model="form.transactionprice" type="number" /></field>
					<field label="Sold On"><v-input v-model="form.transactiondate" type="date" /></field>
					<field label="Sold To"><v-select v-model="form.buyer" :items="partnerItems" show-deselect placeholder="Not sold" /></field>
				</template>

				<h2 class="dw-section">Sales History</h2>
				<div class="dw-field dw-field--full">
					<v-table :headers="historyHeaders" :items="history" item-key="id" />
				</div>
			</template>
		</div>
	</layout>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { errorText, useDewit } from '../api';
import Field from '../components/Field.vue';
import Layout from '../components/Layout.vue';

const STATUS_MESSAGES: Record<string, string> = {
	'for-sale': 'The tapestry is for sale.',
	sold: 'The tapestry is sold.',
	withdrawn: 'The tapestry was withdrawn from sale.',
	unchanged: 'Nothing to change.',
};

const dewit = useDewit();
const route = useRoute();
const router = useRouter();

const tapestry = ref<number | null>(route.query.tapestry ? Number(route.query.tapestry) : null);
const tapestryItems = ref<{ text: string; value: number }[]>([]);
const partners = ref<any[]>([]);
const blank = () => ({
	forsale: false,
	seller: null as number | null,
	minprice: null as number | null,
	transactionprice: null as number | null,
	transactiondate: null as string | null,
	buyer: null as number | null,
});
const form = ref(blank());
const initiallyForSale = ref(false);
const selfPartner = ref<number | null>(null);
const history = ref<any[]>([]);
const loading = ref(false);
const saving = ref(false);
const error = ref<string | null>(null);
const message = ref<string | null>(null);

const partnerItems = computed(() =>
	partners.value.map((p) => ({ text: p.active ? p.name : `${p.name} (inactive)`, value: p.id })),
);
const withdrawing = computed(() => initiallyForSale.value && !form.value.forsale);
const historyHeaders = ref(
	[
		['soldby', 'Sold By'],
		['soldto', 'Sold To'],
		['transactiondate', 'Date'],
		['minprice', 'Min. Price'],
		['transactionprice', 'Price'],
	].map(([value, text]) => ({ text, value, sortable: false, width: null, align: 'left', description: null })),
);

async function loadSale() {
	if (!tapestry.value) return;
	loading.value = true;
	error.value = null;
	try {
		const sale = await dewit.get(`/sales/${tapestry.value}`);
		form.value = { ...blank(), forsale: sale.forsale, seller: sale.seller, minprice: sale.minprice };
		initiallyForSale.value = sale.forsale;
		selfPartner.value = sale.selfPartner;
		history.value = sale.history;
	} catch (e) {
		error.value = errorText(e);
	} finally {
		loading.value = false;
	}
}

function selectTapestry(value: number) {
	tapestry.value = value;
	message.value = null;
	router.replace({ query: { tapestry: value } });
	loadSale();
}

function toggleForSale(value: boolean) {
	form.value.forsale = value;
	if (value && form.value.seller === null) form.value.seller = selfPartner.value;
}

async function submit() {
	saving.value = true;
	error.value = null;
	message.value = null;
	try {
		const { status } = await dewit.put(`/sales/${tapestry.value}`, form.value);
		message.value = STATUS_MESSAGES[status] ?? null;
		await loadSale();
	} catch (e) {
		error.value = errorText(e);
	} finally {
		saving.value = false;
	}
}

onMounted(async () => {
	try {
		const [tapestries, options] = await Promise.all([dewit.get('/options/tapestries'), dewit.get('/options')]);
		tapestryItems.value = tapestries.map((row: any) => ({ text: row.label, value: row.id }));
		partners.value = options.partners;
		selfPartner.value = options.selfPartner;
	} catch (e) {
		error.value = errorText(e);
	}
	loadSale();
});
</script>
