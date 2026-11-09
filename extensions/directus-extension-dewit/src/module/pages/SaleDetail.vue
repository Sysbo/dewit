<template>
	<layout :title="sale?.tapestry.inventorynumber ?? 'Sale'" :back="backPath('sales')" narrow>
		<template #actions>
			<icon-button icon="check" :label="saveLabel" v-if="sale" :disabled="!dirty" :loading="saving" @click="save" />
		</template>

		<v-notice v-if="error" class="dw-notice" type="danger">{{ error }}</v-notice>
		<v-progress-linear v-if="loading" indeterminate />

		<template v-if="sale">
			<section class="dw-section dw-sale-head">
				<thumb :id="sale.tapestry.thumbnail" :size="72" />
				<div class="dw-sale-title">
					<router-link class="dw-link" :to="`/dewit/tapestries/${sale.tapestry.id}`">{{ sale.tapestry.inventorynumber }}</router-link>
					<div class="dw-ellipsis">{{ sale.tapestry.title || '—' }}</div>
				</div>
				<v-chip :kind="sale.forsale ? 'primary' : 'neutral'" small>{{ sale.forsale ? 'For sale' : 'Not for sale' }}</v-chip>
			</section>

			<section class="dw-section">
				<h2 class="dw-section-title">Sale</h2>
				<v-checkbox :model-value="form.forsale" label="This tapestry is for sale" @update:model-value="toggleForSale" />
				<v-notice v-if="withdrawing" class="dw-sale-notice" type="warning">Saving will withdraw this tapestry from sale.</v-notice>

				<template v-if="form.forsale">
					<div class="dw-grid dw-sale-fields">
						<field label="Seller" size="half"><v-select v-model="form.seller" :items="partners" /></field>
						<field label="Minimum Price" size="half"><v-input v-model="form.minprice" type="number" min="0" /></field>
					</div>

				</template>

				<div v-if="!withdrawing" class="dw-sale-record">
					<v-button @click="openRecording"><v-icon name="paid" small left aria-hidden="true" />Record the sale</v-button>
				</div>
			</section>

			<section class="dw-section">
				<h2 class="dw-section-title">Sales history</h2>
				<p v-if="!sale.history.length" class="dw-hint">No past sale</p>
				<v-table v-else :headers="historyHeaders" :items="sale.history" item-key="id" :clickable="false" />
			</section>
		</template>

		<unsaved-guard :dirty="dirty && !saving" />

		<v-dialog v-model="recording.open" @esc="recording.open = false">
			<v-card>
				<v-card-title>Record the sale of {{ sale?.tapestry.inventorynumber }}</v-card-title>
				<v-card-text>
					<v-notice v-if="recording.error" class="dw-notice" type="danger">{{ recording.error }}</v-notice>
					<div class="dw-grid">
						<field label="Sold By" size="half"><v-select v-model="recording.seller" :items="partners" /></field>
						<field label="Sold To" size="half"><v-select v-model="recording.buyer" :items="partners" show-deselect placeholder="Not specified" /></field>
						<field label="Sale Price" size="half"><v-input v-model="recording.price" type="number" min="0" /></field>
						<field label="Sold On" size="half"><v-input v-model="recording.date" type="date" /></field>
					</div>
					<p class="dw-hint dw-sale-help">The tapestry will no longer be for sale. If you set a buyer, the buyer becomes its owner.</p>
				</v-card-text>
				<v-card-actions>
					<v-button secondary @click="recording.open = false">Cancel</v-button>
					<v-button :disabled="!canRecord" :loading="saving" @click="confirmRecording">Record the sale</v-button>
				</v-card-actions>
			</v-card>
		</v-dialog>
	</layout>
</template>

<script setup lang="ts">
import IconButton from '../components/IconButton.vue';
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { errorText, invalidateOptions, partnerItems, useDewit, useNotify, useOptions } from '../api';
import Field from '../components/Field.vue';
import Layout from '../components/Layout.vue';
import Thumb from '../components/Thumb.vue';
import UnsavedGuard from '../components/UnsavedGuard.vue';
import { backPath } from '../list-state';

const STATUS_MESSAGES: Record<string, string> = {
	'for-sale': 'The tapestry is for sale',
	sold: 'The sale is recorded',
	withdrawn: 'The tapestry was withdrawn from sale',
	unchanged: 'Nothing to change',
};

const props = defineProps<{ tapestryId: string }>();
const dewit = useDewit();
const notify = useNotify();
const { options } = useOptions();

const blank = () => ({
	forsale: false,
	seller: null as number | null,
	minprice: null as number | string | null,
});
const form = ref(blank());
const baseline = ref(JSON.stringify(form.value));
const sale = ref<any>(null);
const loading = ref(true);
const saving = ref(false);
const error = ref<string | null>(null);
const recording = reactive({
	open: false,
	seller: null as number | null,
	buyer: null as number | null,
	price: null as number | string | null,
	date: null as string | null,
	error: null as string | null,
});

const dirty = computed(() => JSON.stringify(form.value) !== baseline.value);
const partners = computed(() => partnerItems(options.partners));
const withdrawing = computed(() => Boolean(sale.value?.forsale) && !form.value.forsale);
const filled = (value: unknown) => value !== null && value !== '';
const canRecord = computed(() => filled(recording.price) || filled(recording.date) || filled(recording.buyer));
const saveLabel = computed(() => (withdrawing.value ? 'Withdraw from sale' : 'Save'));

const historyHeaders = ref(
	[
		['soldby', 'Sold By', 180],
		['soldto', 'Sold To', 180],
		['transactiondate', 'Date', 120],
		['minprice', 'Min. Price', 110],
		['transactionprice', 'Price', 110],
	].map(([value, text, width]) => ({ text, value, width, sortable: false, align: 'left', description: null })),
);

async function load() {
	loading.value = true;
	error.value = null;
	try {
		sale.value = await dewit.get(`/sales/${props.tapestryId}`);
		form.value = { ...blank(), forsale: sale.value.forsale, seller: sale.value.seller, minprice: sale.value.minprice };
		baseline.value = JSON.stringify(form.value);
	} catch (e) {
		error.value = errorText(e);
	} finally {
		loading.value = false;
	}
}

function toggleForSale(value: boolean) {
	form.value.forsale = value;
	if (value && form.value.seller === null) form.value.seller = sale.value.selfPartner;
}

async function send(payload: unknown, showError: (message: string) => void) {
	saving.value = true;
	try {
		const { status } = await dewit.put(`/sales/${props.tapestryId}`, payload);
		invalidateOptions();
		notify(STATUS_MESSAGES[status] ?? 'Saved');
		await load();
		return true;
	} catch (e) {
		showError(errorText(e));
		return false;
	} finally {
		saving.value = false;
	}
}

function save() {
	error.value = null;
	return send(form.value, (message) => (error.value = message));
}

function openRecording() {
	Object.assign(recording, {
		open: true,
		seller: form.value.seller ?? sale.value.selfPartner,
		buyer: null,
		price: null,
		date: new Date().toLocaleDateString('en-CA'),
		error: null,
	});
}

// Conditions edited but not saved yet are recorded with the sale.
async function confirmRecording() {
	recording.error = null;
	const recorded = await send(
		{
			forsale: true,
			seller: recording.seller,
			minprice: form.value.minprice,
			transactionprice: recording.price,
			transactiondate: recording.date,
			buyer: recording.buyer,
		},
		(message) => (recording.error = message),
	);
	if (recorded) recording.open = false;
}

watch(() => props.tapestryId, load);
onMounted(load);
</script>

<style>
.dw-sale-head { display: flex; align-items: center; gap: 16px; }
.dw-sale-title { flex: 1; min-width: 0; font-size: 16px; }
.dw-sale-notice { margin-top: 12px; }
.dw-sale-fields { margin-top: 20px; }
.dw-sale-record { margin-top: 24px; }
.dw-sale-help { margin: 16px 0 0; }
</style>
