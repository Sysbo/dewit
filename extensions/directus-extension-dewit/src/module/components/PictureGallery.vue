<template>
	<div>
		<div v-if="modelValue.length" class="dw-pictures">
			<div v-for="(picture, index) in modelValue" :key="picture.id" class="dw-picture">
				<button type="button" class="dw-picture-open" :aria-label="`Enlarge picture ${index + 1}`" @click="enlarged = picture.id">
					<thumb :id="picture.id" :size="132" :alt="picture.title ?? ''" />
				</button>
				<span v-if="index === 0 && modelValue.length > 1" class="dw-picture-cover">Cover</span>
				<button v-if="editable" type="button" class="dw-picture-remove" :aria-label="`Remove picture ${index + 1}`" @click="remove(picture.id)">
					<v-icon name="close" small aria-hidden="true" />
				</button>
			</div>
		</div>
		<p v-else-if="!editable" class="dw-hint">No picture</p>
		<v-upload v-if="editable" multiple from-library :folder="TAPESTRIES_FOLDER_ID" @input="add" />

		<v-dialog :model-value="enlarged !== null" @esc="enlarged = null" @update:model-value="enlarged = null">
			<div class="dw-lightbox">
				<img v-if="enlarged" :src="pictureUrl(enlarged)" alt="" />
			</div>
		</v-dialog>
	</div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { pictureUrl } from '../api';
import { TAPESTRIES_FOLDER_ID } from '../../shared/roles';
import Thumb from './Thumb.vue';

type Picture = { id: string; title: string | null };

const props = defineProps<{ modelValue: Picture[]; editable?: boolean }>();
const emit = defineEmits<{ 'update:modelValue': [value: Picture[]] }>();

const enlarged = ref<string | null>(null);

function add(files: any) {
	const list = (Array.isArray(files) ? files : [files]) as Picture[];
	const known = new Set(props.modelValue.map((picture) => picture.id));
	emit('update:modelValue', [...props.modelValue, ...list.filter((file) => !known.has(file.id)).map(({ id, title }) => ({ id, title }))]);
}

function remove(id: string) {
	emit('update:modelValue', props.modelValue.filter((picture) => picture.id !== id));
}
</script>

<style>
.dw-pictures { display: flex; flex-wrap: wrap; gap: 12px; margin-bottom: 16px; }
.dw-picture { position: relative; }
.dw-picture-open { display: block; cursor: zoom-in; }
.dw-picture-cover { position: absolute; left: 6px; bottom: 6px; padding: 2px 6px; font-size: 12px; border-radius: var(--theme--border-radius); background: var(--theme--background); color: var(--theme--foreground); }
.dw-picture-remove { position: absolute; top: 6px; right: 6px; display: flex; padding: 6px; color: #fff; background: var(--theme--danger); border-radius: 50%; cursor: pointer; }
.dw-lightbox { display: flex; justify-content: center; }
.dw-lightbox img { max-width: 90vw; max-height: 85vh; border-radius: var(--theme--border-radius); }
</style>
