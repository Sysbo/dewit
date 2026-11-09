<template>
	<div v-if="list.total > 0" class="dw-footer">
		<span class="dw-footer-range">{{ range }}</span>
		<v-pagination
			v-if="list.pages > 1"
			:model-value="list.page"
			:length="list.pages"
			:total-visible="5"
			show-first-last
			@update:model-value="list.setPage"
		/>
		<div class="dw-footer-size">
			<span>Per page</span>
			<v-select :model-value="list.pageSize" :items="sizes" inline @update:model-value="list.setPageSize" />
		</div>
	</div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { PAGE_SIZES } from '../list-state';

const props = defineProps<{ list: any }>();

const sizes = PAGE_SIZES.map((size) => ({ text: String(size), value: size }));
const format = (value: number) => value.toLocaleString('en-US');
const range = computed(() => {
	const { page, pageSize, total } = props.list;
	return `${format((page - 1) * pageSize + 1)}–${format(Math.min(page * pageSize, total))} of ${format(total)}`;
});
</script>

<style>
.dw-footer { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 12px 24px; margin-top: 20px; }
.dw-footer-range { color: var(--theme--foreground-subdued); font-variant-numeric: tabular-nums; }
.dw-footer-size { display: flex; align-items: center; gap: 8px; color: var(--theme--foreground-subdued); }
</style>
