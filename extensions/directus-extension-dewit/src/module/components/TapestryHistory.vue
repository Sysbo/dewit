<template>
	<v-notice v-if="error" class="dw-notice" type="danger">{{ error }}</v-notice>

	<section class="dw-section">
		<h2 class="dw-section-title">Location history</h2>
		<ol v-if="activity.locations.length" class="dw-timeline">
			<li v-for="entry in visible('locations')" :key="entry.id" :class="{ current: entry.active }">
				<strong>{{ entry.label ?? 'Unknown' }}</strong>
				<span>{{ period(entry) }}</span>
			</li>
		</ol>
		<p v-else class="dw-hint">No history</p>
		<show-all-button list="locations" />
	</section>

	<section class="dw-section">
		<h2 class="dw-section-title">Ownership history</h2>
		<ol v-if="activity.owners.length" class="dw-timeline">
			<li v-for="entry in visible('owners')" :key="entry.id" :class="{ current: entry.active }">
				<strong>{{ entry.owner ?? 'Unknown' }}</strong>
				<span>{{ period(entry) }}</span>
			</li>
		</ol>
		<p v-else class="dw-hint">No history</p>
		<show-all-button list="owners" />
	</section>

	<section class="dw-section">
		<h2 class="dw-section-title">Catalogs ({{ activity.catalogs.length }})</h2>
		<ul v-if="activity.catalogs.length" class="dw-links">
			<li v-for="catalog in visible('catalogs')" :key="catalog.id">
				<router-link :to="`/dewit/catalogs/${catalog.id}`">{{ catalog.name }} ({{ catalog.year }})</router-link>
			</li>
		</ul>
		<p v-else class="dw-hint">In no catalog</p>
		<show-all-button list="catalogs" />
	</section>
</template>

<script setup lang="ts">
import { defineComponent, h, reactive, ref, resolveComponent, watch } from 'vue';
import { errorText, useDewit } from '../api';

const PREVIEW = 5;
type ListName = 'locations' | 'owners' | 'catalogs';

const props = defineProps<{ id: string; version?: unknown }>();

const dewit = useDewit();
const activity = ref<Record<ListName, any[]>>({ locations: [], owners: [], catalogs: [] });
const error = ref<string | null>(null);
const expanded = reactive<Record<ListName, boolean>>({ locations: false, owners: false, catalogs: false });

const visible = (list: ListName) => (expanded[list] ? activity.value[list] : activity.value[list].slice(0, PREVIEW));

const ShowAllButton = defineComponent({
	props: { list: { type: String, required: true } },
	setup(buttonProps) {
		const VButton = resolveComponent('v-button');
		return () => {
			const list = buttonProps.list as ListName;
			if (expanded[list] || activity.value[list].length <= PREVIEW) return null;
			return h('div', { class: 'dw-actions-row' }, [
				h(VButton, { secondary: true, small: true, onClick: () => (expanded[list] = true) }, () => `Show all (${activity.value[list].length})`),
			]);
		};
	},
});

watch(
	() => [props.id, props.version],
	async (_current, previous) => {
		const id = props.id;
		if (previous?.[0] !== id) Object.assign(expanded, { locations: false, owners: false, catalogs: false });
		error.value = null;
		try {
			const data = await dewit.get(`/tapestries/${id}/activity`);
			if (id === props.id) activity.value = data;
		} catch (e) {
			if (id === props.id) error.value = errorText(e);
		}
	},
	{ immediate: true },
);

function period(entry: { active: boolean; start: string | null; end: string | null }) {
	const start = entry.start ?? '?';
	return entry.active ? `Since ${start}` : `${start} → ${entry.end ?? '?'}`;
}
</script>

<style>
.dw-timeline { list-style: none; margin: 0; padding: 0; }
.dw-timeline li { padding: 8px 0 8px 14px; border-left: 2px solid var(--theme--border-color); }
.dw-timeline li.current { border-left-color: var(--theme--primary); }
.dw-timeline strong { display: block; color: var(--theme--foreground-accent); }
.dw-timeline span { color: var(--theme--foreground-subdued); font-size: 13px; }
</style>
