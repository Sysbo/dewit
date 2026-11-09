<template>
	<div class="dw-browser">
		<div class="dw-browser-top">
			<search-box
				class="dw-browser-search"
				:value="list.query.search ?? ''"
				placeholder="Search by inventory number, title or artist…"
				@search="list.set({ search: $event }, { replace: true })"
			/>
			<div class="dw-view-switch" role="group" aria-label="Display">
				<button type="button" :class="{ active: view === 'table' }" :aria-pressed="view === 'table'" aria-label="Table view" @click="setView('table')">
					<v-icon name="table_rows" small />
				</button>
				<button type="button" :class="{ active: view === 'grid' }" :aria-pressed="view === 'grid'" aria-label="Picture view" @click="setView('grid')">
					<v-icon name="grid_view" small />
				</button>
			</div>
		</div>

		<div class="dw-filters">
			<field label="Artist"><v-select v-bind="filterProps('artist')" :items="artistItems" placeholder="Any" /></field>
			<field label="Century"><v-select v-bind="filterProps('century')" :items="centuryItems" placeholder="Any" /></field>
			<field label="Location"><v-select v-bind="filterProps('location')" :items="locationItems" placeholder="Any" /></field>
			<field v-if="sublocationItems.length" label="Sub-location">
				<v-select v-bind="filterProps('sublocation')" :items="sublocationItems" placeholder="Any" />
			</field>
			<field label="Catalog"><v-select v-bind="filterProps('catalog')" :items="catalogItems" placeholder="Any" /></field>
			<template v-if="showMore">
				<field label="Orientation"><v-select v-bind="filterProps('orientation')" :items="orientationItems" placeholder="Any" /></field>
				<field label="Pictures"><v-select v-bind="filterProps('pictures')" :items="pictureItems" placeholder="Any" /></field>
				<field label="Private collection"><v-select v-bind="filterProps('private')" :items="yesNoItems" placeholder="Any" /></field>
				<field v-if="isManager" label="For sale"><v-select v-bind="filterProps('forsale')" :items="yesNoItems" placeholder="Any" /></field>
			</template>
		</div>
		<div class="dw-filter-actions">
			<button type="button" class="dw-text-button" :aria-expanded="showMore" @click="showMore = !showMore">
				<v-icon :name="showMore ? 'expand_less' : 'expand_more'" small aria-hidden="true" />
				{{ showMore ? 'Fewer filters' : moreLabel }}
			</button>
			<button v-if="activeCount" type="button" class="dw-text-button" @click="clearAll">
				<v-icon name="close" small aria-hidden="true" />
				Clear all ({{ activeCount }})
			</button>
		</div>

		<v-notice v-if="list.error" class="dw-notice" type="danger">{{ list.error }}</v-notice>

		<v-info v-if="!list.loading && !list.items.length && !list.error" :title="activeCount ? 'No tapestry matches' : 'No tapestry yet'" :icon="activeCount ? 'search_off' : 'texture'" center>
			{{ activeCount ? 'Try a shorter search or remove a filter.' : '' }}
			<template #append>
				<v-button v-if="activeCount" secondary @click="clearAll">Clear search and filters</v-button>
			</template>
		</v-info>

		<template v-else>
			<v-table
				v-if="view === 'table'"
				:headers="headers"
				:items="list.items"
				:loading="list.loading"
				:sort="list.sort"
				:row-height="60"
				:show-select="selectionMode"
				:model-value="tableSelection"
				selection-use-keys
				item-key="id"
				@update:sort="list.setSort"
				@update:model-value="onTableSelection"
				@click:row="onRow"
			>
				<template #item.thumbnail="{ item }"><thumb :id="item.thumbnail" /></template>
				<template #item.inventorynumber="{ item }">
					<router-link v-if="!pickMode" class="dw-link dw-nowrap" :to="`/dewit/tapestries/${item.id}`" @click.stop>{{ item.inventorynumber }}</router-link>
					<span v-else class="dw-nowrap">{{ item.inventorynumber }}</span>
				</template>
				<template #item.title="{ item }"><span v-tooltip="item.titles" class="dw-ellipsis">{{ item.title || '—' }}</span></template>
				<template #item.status="{ item }"><v-chip v-if="item.forsale" x-small>For sale</v-chip></template>
			</v-table>

			<div v-else class="dw-cards" :aria-busy="list.loading">
				<div v-for="item in list.items" :key="item.id" class="dw-card" :class="{ selected: isSelected(item) }">
					<component :is="pickMode ? 'button' : 'router-link'" v-bind="pickMode ? { type: 'button' } : { to: `/dewit/tapestries/${item.id}` }" class="dw-card-link" @click="pickMode && onRow({ item })">
						<thumb :id="item.thumbnail" fluid :alt="item.title" />
						<strong class="dw-ellipsis">{{ item.inventorynumber }}</strong>
						<span class="dw-ellipsis">{{ item.title || '—' }}</span>
						<span class="dw-ellipsis dw-card-sub">{{ item.artist || 'Unknown artist' }}</span>
						<span class="dw-ellipsis dw-card-sub">{{ item.location || 'Location unknown' }}</span>
					</component>
					<div v-if="selectionMode === 'multiple'" class="dw-card-check">
						<v-checkbox :model-value="isSelected(item)" :aria-label="`Select ${item.inventorynumber}`" @update:model-value="toggle(item)" />
					</div>
					<div v-if="item.forsale" class="dw-card-chip"><v-chip x-small>For sale</v-chip></div>
				</div>
			</div>

			<list-footer :list="list" />
		</template>
	</div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { session, useOptions } from '../api';
import { useListQuery } from '../list-state';
import Field from './Field.vue';
import ListFooter from './ListFooter.vue';
import SearchBox from './SearchBox.vue';
import Thumb from './Thumb.vue';

const VIEW_KEY = 'dewit.view';
const FILTERS = ['search', 'artist', 'century', 'location', 'sublocation', 'catalog', 'orientation', 'pictures', 'private', 'forsale', 'owner'];
const MORE_FILTERS = ['orientation', 'pictures', 'private', 'forsale'];

const props = withDefaults(defineProps<{ sync?: boolean; selectionMode?: 'none' | 'one' | 'multiple'; pickMode?: boolean }>(), {
	sync: true,
	selectionMode: 'none',
});
const emit = defineEmits<{ pick: [item: any] }>();
const selected = defineModel<any[]>('selected', { default: () => [] });

const router = useRouter();
const { options } = useOptions();
const list = useListQuery({ resource: 'tapestries', sync: props.sync, defaultSort: 'inventorynumber' });
const isManager = computed(() => session.role === 'manager');

function storedView(): 'table' | 'grid' {
	try {
		return localStorage.getItem(VIEW_KEY) === 'grid' ? 'grid' : 'table';
	} catch {
		return 'table';
	}
}
const view = ref(storedView());
function setView(next: 'table' | 'grid') {
	view.value = next;
	try {
		localStorage.setItem(VIEW_KEY, next);
	} catch {
		// The display mode is only a convenience.
	}
}

const moreActive = computed(() => MORE_FILTERS.filter((key) => list.query[key]).length);
const showMore = ref(moreActive.value > 0);
const moreLabel = computed(() => (moreActive.value ? `More filters (${moreActive.value})` : 'More filters'));
const activeCount = computed(() => FILTERS.filter((key) => list.query[key]).length);

function filterProps(key: string) {
	return {
		modelValue: list.query[key] ?? null,
		showDeselect: true,
		'aria-label': key,
		'onUpdate:modelValue': (value: string | null) => {
			const patch: Record<string, string | null> = { [key]: value };
			if (key === 'location') patch.sublocation = null;
			list.set(patch);
		},
	};
}

function clearAll() {
	list.set(Object.fromEntries(FILTERS.map((key) => [key, null])));
}

const artistItems = computed(() =>
	options.artists.map((artist) => ({ text: artist.period ? `${artist.name} (${artist.period})` : artist.name, value: String(artist.id) })),
);
const centuryItems = computed(() => options.centuries.map((century) => ({ text: century, value: century })));
const orientationItems = computed(() => options.orientations.map((item) => ({ text: item.name, value: String(item.id) })));
const catalogItems = computed(() => options.catalogs.map((item) => ({ text: `${item.name} (${item.year})`, value: String(item.id) })));
const yesNoItems = [
	{ text: 'Yes', value: 'yes' },
	{ text: 'No', value: 'no' },
];
const pictureItems = [
	{ text: 'With pictures', value: 'yes' },
	{ text: 'Without pictures', value: 'no' },
];
const locationItems = computed(() => [
	{ text: 'At DeWit (all rooms)', value: 'dewit' },
	...options.locations.map((room) => ({ text: room.name, value: `room:${room.id}` })),
	{ divider: true },
	...options.partners.filter((partner) => partner.id !== options.selfPartner).map((partner) => ({ text: partner.name, value: `partner:${partner.id}` })),
	{ divider: true },
	{ text: 'Unknown', value: 'unknown' },
]);
const sublocationItems = computed(() => {
	const [kind, id] = (list.query.location ?? '').split(':');
	if (kind !== 'room') return [];
	return options.sublocations.filter((item) => item.locationid === Number(id)).map((item) => ({ text: item.description, value: String(item.id) }));
});

const headers = ref<any[]>([]);
watch(
	isManager,
	(manager) => {
		const column = (value: string, text: string, width: number | null, sortable = true) => ({ text, value, width, sortable, align: 'left', description: null });
		headers.value = [
			column('thumbnail', '', 64, false),
			column('inventorynumber', 'Inventory Nr', 140),
			column('title', 'Title', 230),
			column('artist', 'Artist', 170),
			column('century', 'Century', 100),
			column('location', 'Location', 170),
			...(manager ? [column('status', '', 96, false)] : []),
		];
	},
	{ immediate: true },
);

const pageIds = computed(() => list.items.map((item: any) => item.id));
const tableSelection = computed(() => selected.value.filter((item) => pageIds.value.includes(item.id)).map((item) => item.id));
const isSelected = (item: any) => selected.value.some((entry) => entry.id === item.id);

function onTableSelection(ids: number[]) {
	const elsewhere = selected.value.filter((item) => !pageIds.value.includes(item.id));
	selected.value = [...elsewhere, ...list.items.filter((item: any) => ids.includes(item.id))];
}

function toggle(item: any) {
	selected.value = isSelected(item) ? selected.value.filter((entry) => entry.id !== item.id) : [...selected.value, item];
}

function onRow({ item, event }: { item: any; event?: PointerEvent }) {
	if (props.pickMode) {
		if (props.selectionMode === 'multiple') toggle(item);
		else emit('pick', item);
		return;
	}
	const path = `/dewit/tapestries/${item.id}`;
	if (event?.metaKey || event?.ctrlKey) window.open(router.resolve(path).href, '_blank');
	else router.push(path);
}

// A selection never silently spans filters on the main list.
if (props.sync) {
	watch(
		() => JSON.stringify(list.query),
		() => {
			selected.value = [];
		},
	);
}

defineExpose({ reload: () => list.load() });
</script>

<style>
.dw-browser-top { display: flex; gap: 12px; margin-bottom: 12px; --theme--form--field--input--height: 48px; }
.dw-browser-search { flex: 1; }
.dw-view-switch { display: flex; flex-shrink: 0; border-radius: var(--theme--border-radius); background: var(--theme--background-normal); padding: 4px; }
.dw-view-switch button { width: 44px; border-radius: var(--theme--border-radius); color: var(--theme--foreground-subdued); cursor: pointer; }
.dw-view-switch button.active { background: var(--theme--background); color: var(--theme--foreground-accent); }
.dw-filters { display: grid; grid-template-columns: repeat(auto-fill, minmax(190px, 1fr)); gap: 12px; --theme--form--field--input--height: 44px; }
.dw-filters .dw-field { grid-column: auto; }
.dw-filters .dw-label { margin-bottom: 4px; font-size: 13px; }
.dw-filter-actions { display: flex; gap: 16px; margin: 10px 0 16px; }
.dw-text-button { display: inline-flex; align-items: center; gap: 4px; min-height: 32px; color: var(--theme--foreground-subdued); font-weight: 600; cursor: pointer; }
.dw-text-button:hover { color: var(--theme--foreground); }
.dw-nowrap { white-space: nowrap; }
.dw-ellipsis { display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.dw-cards { display: grid; grid-template-columns: repeat(auto-fill, minmax(170px, 1fr)); gap: 16px; }
.dw-card { position: relative; border-radius: var(--theme--border-radius); background: var(--theme--background-subdued); outline: 2px solid transparent; transition: outline-color 150ms; }
.dw-card:hover { outline-color: var(--theme--border-color-accent); }
.dw-card.selected { outline-color: var(--theme--primary); }
.dw-card-link { display: flex; flex-direction: column; gap: 2px; width: 100%; padding: 8px; text-align: left; color: var(--theme--foreground); cursor: pointer; }
.dw-card-link .dw-thumb { margin-bottom: 6px; }
.dw-card-link strong { color: var(--theme--foreground-accent); }
.dw-card-sub { font-size: 13px; color: var(--theme--foreground-subdued); }
.dw-card-check { position: absolute; top: 12px; left: 12px; padding: 4px; border-radius: var(--theme--border-radius); background: var(--theme--background); line-height: 0; }
.dw-card-check .v-checkbox { width: auto; }
.dw-card-chip { position: absolute; top: 16px; right: 16px; }
</style>
