<template>
	<dl class="dw-facts">
		<div v-for="fact in facts" :key="fact.label">
			<dt>{{ fact.label }}</dt>
			<dd>{{ fact.value === null || fact.value === undefined || fact.value === '' ? '—' : fact.value }}</dd>
		</div>
	</dl>
</template>

<script setup lang="ts">
defineProps<{ facts: { label: string; value: unknown }[] }>();
</script>

<style>
.dw-facts { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 16px 24px; margin: 0; }
.dw-facts > div { display: flex; flex-direction: column; min-width: 0; }
.dw-facts dt { font-size: 13px; font-weight: 600; color: var(--theme--foreground-subdued); }
.dw-facts dd { margin: 2px 0 0; color: var(--theme--foreground-accent); overflow-wrap: anywhere; }
</style>
