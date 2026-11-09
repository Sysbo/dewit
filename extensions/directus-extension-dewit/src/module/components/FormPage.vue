<template>
	<layout :title="title" :back="backPath(resource)" narrow>
		<template #actions>
			<template v-if="navigable && !entity.isNew && neighbors.position">
				<span class="dw-position">{{ neighbors.position }}</span>
				<icon-button icon="chevron_left" label="Previous" secondary :disabled="!neighbors.hasPrevious" @click="neighbors.go(-1)" />
				<icon-button icon="chevron_right" label="Next" secondary :disabled="!neighbors.hasNext" @click="neighbors.go(1)" />
			</template>
			<slot name="actions" />
			<icon-button icon="delete" label="Delete" v-if="canDelete" kind="danger" secondary @click="confirming = true" />
			<template v-if="canSave">
				<icon-button icon="check" label="Save" :disabled="!entity.dirty" :loading="entity.saving" @click="entity.save('list')" />
				<v-menu placement="bottom-end" show-arrow>
					<template #activator="{ toggle }">
						<icon-button icon="more_vert" label="More save options" secondary @click="toggle" />
					</template>
					<v-list>
						<v-list-item clickable :disabled="!entity.dirty" @click="entity.save('stay')">
							<v-list-item-icon><v-icon name="save" /></v-list-item-icon>
							<v-list-item-content>Save and stay <v-kbd class="dw-kbd">{{ shortcut }}</v-kbd></v-list-item-content>
						</v-list-item>
						<v-list-item clickable :disabled="!entity.dirty" @click="entity.save('new')">
							<v-list-item-icon><v-icon name="add" /></v-list-item-icon>
							<v-list-item-content>Save and add another</v-list-item-content>
						</v-list-item>
						<v-list-item v-if="entity.canDuplicate && !entity.isNew" clickable :disabled="entity.dirty" @click="entity.copy()">
							<v-list-item-icon><v-icon name="content_copy" /></v-list-item-icon>
							<v-list-item-content>Duplicate</v-list-item-content>
						</v-list-item>
					</v-list>
				</v-menu>
			</template>
		</template>

		<v-progress-linear v-if="entity.loading" indeterminate />
		<template v-else>
			<v-notice v-if="entity.error" class="dw-notice" type="danger">{{ entity.error }}</v-notice>
			<slot />
		</template>

		<unsaved-guard :dirty="entity.dirty && !entity.saving" />

		<v-dialog v-model="confirming" @esc="confirming = false">
			<v-card>
				<v-card-title>Delete “{{ title }}”?</v-card-title>
				<v-card-text>This cannot be undone.</v-card-text>
				<v-card-actions>
					<v-button secondary @click="confirming = false">Cancel</v-button>
					<v-button kind="danger" :loading="entity.saving" @click="confirmDelete">Delete</v-button>
				</v-card-actions>
			</v-card>
		</v-dialog>
	</layout>
</template>

<script setup lang="ts">
import IconButton from './IconButton.vue';
import { onBeforeUnmount, onMounted, ref } from 'vue';
import { backPath, useNeighbors } from '../list-state';
import Layout from './Layout.vue';
import UnsavedGuard from './UnsavedGuard.vue';

const props = defineProps<{
	title: string;
	resource: string;
	entity: any;
	id: string;
	canSave?: boolean;
	canDelete?: boolean;
	navigable?: boolean;
}>();

const neighbors = useNeighbors(props.resource, () => props.id);
const confirming = ref(false);
const shortcut = /mac/i.test(navigator.platform) ? '⌘S' : 'Ctrl+S';

function confirmDelete() {
	confirming.value = false;
	props.entity.destroy();
}

function onKeydown(event: KeyboardEvent) {
	if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 's') {
		event.preventDefault();
		if (props.canSave && props.entity.dirty && !props.entity.saving) props.entity.save('stay');
	}
}
onMounted(() => window.addEventListener('keydown', onKeydown));
onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown));
</script>

<style>
.dw-kbd { margin-left: 8px; }
</style>
