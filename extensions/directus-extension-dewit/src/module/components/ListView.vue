<template>
	<layout :title="title">
		<template #actions>
			<slot name="actions" />
			<icon-button icon="add" :label="`New ${itemLabel}`" v-if="canCreate" :to="`/dewit/${resource}/+`" />
		</template>

		<div v-if="tabs" class="dw-tabs" role="tablist">
			<button
				v-for="tab in tabs"
				:key="tab.value"
				type="button"
				role="tab"
				class="dw-tab"
				:class="{ active: currentTab === tab.value }"
				:aria-selected="currentTab === tab.value"
				@click="list.set({ status: tab.value === tabs[0]!.value ? null : tab.value, sort: null })"
			>
				{{ tab.text }}
			</button>
		</div>

		<div v-if="searchable || filters?.length" class="dw-toolbar">
			<search-box
				v-if="searchable"
				class="dw-toolbar-search"
				:value="list.query.search ?? ''"
				placeholder="Search…"
				@search="list.set({ search: $event }, { replace: true })"
			/>
			<div v-for="filter in filters" :key="filter.key" class="dw-toolbar-filter">
				<v-select
					:model-value="list.query[filter.key] ?? null"
					:items="filter.items"
					:placeholder="filter.label"
					:aria-label="filter.label"
					show-deselect
					@update:model-value="list.set({ [filter.key]: $event })"
				/>
			</div>
		</div>

		<v-notice v-if="list.error" class="dw-notice" type="danger">{{ list.error }}</v-notice>

		<v-info v-if="!list.loading && !list.items.length && !list.error" :title="filtered ? 'No result' : emptyTitle" :icon="filtered ? 'search_off' : emptyIcon" center>
			{{ filtered ? 'Try a shorter search or remove a filter.' : '' }}
			<template #append>
				<v-button v-if="filtered" secondary @click="clear">Clear search and filters</v-button>
				<v-button v-else-if="canCreate" :to="`/dewit/${resource}/+`">New {{ itemLabel }}</v-button>
			</template>
		</v-info>

		<template v-else>
			<v-table
				:headers="headers"
				:items="list.items"
				:loading="list.loading"
				:sort="list.sort"
				:row-height="rowHeight"
				item-key="id"
				@update:sort="list.setSort"
				@click:row="open"
			>
				<template v-for="column in specialColumns" :key="column.key" #[`item.${column.key}`]="{ item }">
					<thumb v-if="column.type === 'thumb'" :id="item[column.key]" />
					<span v-else-if="column.type === 'price'" class="dw-number">{{ formatPrice(item[column.key]) }}</span>
				</template>
			</v-table>
			<list-footer :list="list" />
		</template>
	</layout>
</template>

<script setup lang="ts">
import IconButton from './IconButton.vue';
import { computed, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useListQuery } from '../list-state';
import Layout from './Layout.vue';
import ListFooter from './ListFooter.vue';
import SearchBox from './SearchBox.vue';
import Thumb from './Thumb.vue';

export type Column = { key: string; label: string; width?: number; sortable?: boolean; type?: 'thumb' | 'price' };

const props = withDefaults(
	defineProps<{
		title: string;
		resource: string;
		itemLabel: string;
		columns: Column[];
		defaultSort: string;
		canCreate?: boolean;
		searchable?: boolean;
		filters?: { key: string; label: string; items: { text: string; value: string }[] }[];
		tabs?: { text: string; value: string }[];
		rowPath?: (item: any) => string;
		emptyIcon?: string;
		emptyTitle?: string;
	}>(),
	{ searchable: true, emptyIcon: 'inbox', emptyTitle: 'Nothing here yet' },
);

const router = useRouter();
const list = useListQuery({ resource: props.resource, defaultSort: props.defaultSort, remember: (item) => (props.rowPath ? item.tapestry : item.id) });

const currentTab = computed(() => list.query.status ?? props.tabs?.[0]?.value);
const specialColumns = computed(() => props.columns.filter((column) => column.type));
const rowHeight = computed(() => (props.columns.some((column) => column.type === 'thumb') ? 60 : 48));
const filterKeys = computed(() => ['search', ...(props.filters ?? []).map((filter) => filter.key)]);
const filtered = computed(() => filterKeys.value.some((key) => list.query[key]));

function toHeaders(columns: Column[]) {
	return columns.map(({ key, label, width, sortable = true, type }) => ({
		text: label,
		value: key,
		sortable: sortable && type !== 'thumb',
		width: width ?? (type === 'thumb' ? 72 : null),
		align: 'left',
		description: null,
	}));
}
const headers = ref(toHeaders(props.columns));
watch(
	() => props.columns,
	(columns) => {
		headers.value = toHeaders(columns);
	},
);

function clear() {
	list.set(Object.fromEntries(filterKeys.value.map((key) => [key, null])));
}

function open({ item, event }: { item: any; event: PointerEvent }) {
	const path = props.rowPath ? props.rowPath(item) : `/dewit/${props.resource}/${item.id}`;
	if (event?.metaKey || event?.ctrlKey) window.open(router.resolve(path).href, '_blank');
	else router.push(path);
}

const formatPrice = (value: number | null) => (value === null ? '—' : value.toLocaleString('en-US'));
</script>

<style>
.dw-toolbar { display: flex; flex-wrap: wrap; gap: 12px; margin-bottom: 16px; --theme--form--field--input--height: 44px; }
.dw-toolbar-search { flex: 1 1 280px; max-width: 480px; }
.dw-toolbar-filter { flex: 0 1 220px; min-width: 160px; }
.dw-number { font-variant-numeric: tabular-nums; }
.dw-tabs { display: flex; gap: 4px; margin-bottom: 16px; border-bottom: var(--theme--border-width, 2px) solid var(--theme--border-color-subdued); }
.dw-tab {
	padding: 10px 16px;
	margin-bottom: calc(-1 * var(--theme--border-width, 2px));
	border-bottom: var(--theme--border-width, 2px) solid transparent;
	color: var(--theme--foreground-subdued);
	font-weight: 600;
	cursor: pointer;
}
.dw-tab:hover { color: var(--theme--foreground); }
.dw-tab.active { color: var(--theme--primary); border-bottom-color: var(--theme--primary); }
</style>
