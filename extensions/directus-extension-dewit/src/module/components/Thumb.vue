<template>
	<div class="dw-thumb" :style="{ width: fluid ? '100%' : `${size}px`, height: fluid ? undefined : `${size}px` }" :class="{ 'dw-thumb--fluid': fluid }">
		<img v-if="id" :src="assetUrl(id, fluid ? 480 : size * 2)" :alt="alt" loading="lazy" />
		<v-icon v-else name="texture" aria-hidden="true" />
	</div>
</template>

<script setup lang="ts">
import { assetUrl } from '../api';

withDefaults(defineProps<{ id?: string | null; size?: number; fluid?: boolean; alt?: string }>(), { size: 44, alt: '' });
</script>

<style>
.dw-thumb {
	display: flex;
	align-items: center;
	justify-content: center;
	overflow: hidden;
	flex-shrink: 0;
	border-radius: var(--theme--border-radius);
	background: var(--theme--background-normal);
	color: var(--theme--foreground-subdued);
}
.dw-thumb--fluid { aspect-ratio: 1; }
.dw-thumb img { width: 100%; height: 100%; object-fit: cover; display: block; }
</style>
