<template>
	<layout title="Tapestries">
		<template #actions>
			<icon-button icon="add" label="New tapestry" v-if="session.role === 'manager'" to="/dewit/tapestries/+" />
		</template>

		<tapestry-browser ref="browser" v-model:selected="selected" selection-mode="multiple" />
		<bulk-bar :selected="selected" @clear="selected = []" @done="onBulkDone" />
	</layout>
</template>

<script setup lang="ts">
import IconButton from '../components/IconButton.vue';
import { ref } from 'vue';
import { session } from '../api';
import BulkBar from '../components/BulkBar.vue';
import Layout from '../components/Layout.vue';
import TapestryBrowser from '../components/TapestryBrowser.vue';

const browser = ref<{ reload: () => void } | null>(null);
const selected = ref<any[]>([]);

function onBulkDone() {
	selected.value = [];
	browser.value?.reload();
}
</script>
