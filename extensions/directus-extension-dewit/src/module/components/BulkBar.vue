<template>
	<div v-if="selected.length" class="dw-bulk" role="region" aria-label="Actions on the selection">
		<strong>{{ selected.length }} selected</strong>
		<v-button small @click="opening = 'move'"><v-icon name="move_item" small left />Move</v-button>
		<v-button v-if="isManager" small secondary @click="opening = 'catalog'"><v-icon name="menu_book" small left />Add to catalog</v-button>
		<v-button small secondary @click="$emit('clear')">Clear selection</v-button>
	</div>

	<v-dialog :model-value="opening === 'move'" @esc="close" @update:model-value="close">
		<v-card>
			<v-card-title>Move {{ selected.length }} {{ selected.length > 1 ? 'tapestries' : 'tapestry' }}</v-card-title>
			<v-card-text>
				<v-notice v-if="error" class="dw-notice" type="danger">{{ error }}</v-notice>
				<location-fields v-model="target" :lock-owner="!isManager" />
			</v-card-text>
			<v-card-actions>
				<v-button secondary @click="close">Cancel</v-button>
				<v-button :loading="working" :disabled="!canMove" @click="move">Move</v-button>
			</v-card-actions>
		</v-card>
	</v-dialog>

	<v-dialog :model-value="opening === 'catalog'" @esc="close" @update:model-value="close">
		<v-card>
			<v-card-title>Add {{ selected.length }} to a catalog</v-card-title>
			<v-card-text>
				<v-notice v-if="error" class="dw-notice" type="danger">{{ error }}</v-notice>
				<v-select v-model="catalog" :items="catalogItems" placeholder="Select a catalog" aria-label="Catalog" />
			</v-card-text>
			<v-card-actions>
				<v-button secondary @click="close">Cancel</v-button>
				<v-button :loading="working" :disabled="!catalog" @click="addToCatalog">Add</v-button>
			</v-card-actions>
		</v-card>
	</v-dialog>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { errorText, invalidateOptions, session, useDewit, useNotify, useOptions } from '../api';
import LocationFields from './LocationFields.vue';

const props = defineProps<{ selected: any[] }>();
const emit = defineEmits<{ clear: []; done: [] }>();

const dewit = useDewit();
const notify = useNotify();
const { options } = useOptions();
const isManager = computed(() => session.role === 'manager');

const opening = ref<'move' | 'catalog' | null>(null);
const working = ref(false);
const error = ref<string | null>(null);
const catalog = ref<number | null>(null);
const blankTarget = () => ({ locationbp: options.selfPartner as number | null, location: null as number | null, sublocation: null as number | null });
const target = ref(blankTarget());

watch(opening, () => {
	error.value = null;
	catalog.value = null;
	target.value = blankTarget();
});

const catalogItems = computed(() => options.catalogs.map((item) => ({ text: `${item.name} (${item.year})`, value: item.id })));
const canMove = computed(() => {
	const { locationbp, location } = target.value;
	return !!locationbp && (locationbp !== options.selfPartner || !!location);
});

const close = () => (opening.value = null);
const ids = () => props.selected.map((item) => item.id);
const plural = (count: number) => `${count} ${count > 1 ? 'tapestries' : 'tapestry'}`;

async function perform(action: () => Promise<void>) {
	working.value = true;
	error.value = null;
	try {
		await action();
		close();
		emit('done');
	} catch (e) {
		error.value = errorText(e);
	} finally {
		working.value = false;
	}
}

const move = () =>
	perform(async () => {
		const { moved, skipped } = await dewit.post('/tapestries/bulk/location', { ids: ids(), ...target.value });
		notify(skipped ? `${plural(moved)} moved, ${skipped} skipped (not stored at DeWit)` : `${plural(moved)} moved`, skipped ? 'warning' : 'success');
	});

const addToCatalog = () =>
	perform(async () => {
		const { added, alreadyPresent } = await dewit.post(`/catalogs/${catalog.value}/tapestries`, { ids: ids() });
		invalidateOptions();
		notify(alreadyPresent ? `${plural(added)} added, ${alreadyPresent} already in this catalog` : `${plural(added)} added`);
	});
</script>

<style>
.dw-bulk {
	position: sticky;
	bottom: 16px;
	z-index: 5;
	display: flex;
	flex-wrap: wrap;
	align-items: center;
	gap: 12px;
	margin-top: 16px;
	padding: 12px 16px;
	border-radius: var(--theme--border-radius);
	background: var(--theme--background-accent);
	box-shadow: 0 4px 16px rgb(0 0 0 / 0.2);
}
</style>
