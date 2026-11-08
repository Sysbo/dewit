<template>
	<layout :title="title">
		<template #actions>
			<v-button v-if="canCreate" rounded icon :to="`/dewit/${resource}/+`">
				<v-icon name="add" />
			</v-button>
		</template>

		<v-input v-if="searchable" v-model="search" class="dw-search" placeholder="Search…" />
		<v-notice v-if="error" class="dw-notice" type="danger">{{ error }}</v-notice>
		<v-table :headers="headers" :items="items" :loading="loading" item-key="id" fixed-header @click:row="open" />
		<div v-if="pages > 1" class="dw-pagination">
			<v-pagination v-model="page" :length="pages" :total-visible="7" />
		</div>
	</layout>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { errorText, useDewit } from '../api';
import Layout from './Layout.vue';

const props = defineProps<{
	title: string;
	resource: string;
	columns: { key: string; label: string; width?: number }[];
	canCreate?: boolean;
	searchable?: boolean;
}>();

const PAGE_SIZE = 25;
const dewit = useDewit();
const router = useRouter();

const items = ref<any[]>([]);
const total = ref(0);
const page = ref(1);
const search = ref('');
const loading = ref(true);
const error = ref<string | null>(null);

const headers = ref(
	props.columns.map(({ key, label, width }) => ({ text: label, value: key, sortable: false, width: width ?? null, align: 'left', description: null })),
);
const pages = computed(() => Math.ceil(total.value / PAGE_SIZE));

async function load() {
	loading.value = true;
	error.value = null;
	try {
		const result = await dewit.get(`/${props.resource}`, { page: page.value, limit: PAGE_SIZE, search: search.value || undefined });
		items.value = result.items;
		total.value = result.total;
	} catch (e) {
		error.value = errorText(e);
	} finally {
		loading.value = false;
	}
}

const open = ({ item }: { item: { id: number } }) => router.push(`/dewit/${props.resource}/${item.id}`);

let debounce: ReturnType<typeof setTimeout>;
watch(search, () => {
	clearTimeout(debounce);
	debounce = setTimeout(() => {
		if (page.value === 1) load();
		else page.value = 1;
	}, 300);
});
watch(page, load);
onMounted(load);
</script>

<style>
.dw-search { max-width: 360px; margin-bottom: 16px; }
.dw-pagination { display: flex; justify-content: flex-end; margin-top: 16px; }
</style>
