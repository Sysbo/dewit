<template>
	<list-view :key="listProps.resource" v-bind="listProps">
		<template #actions>
			<icon-button icon="add" label="New sale" @click="picking = true" />
		</template>
	</list-view>
	<tapestry-picker v-model="picking" title="Choose a tapestry" @select="open" />
</template>

<script setup lang="ts">
import IconButton from '../components/IconButton.vue';
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import ListView from '../components/ListView.vue';
import TapestryPicker from '../components/TapestryPicker.vue';
import { useSalesListProps } from './Lists';

const router = useRouter();
const listProps = useSalesListProps();
const picking = ref(false);

function open([item]: any[]) {
	router.push(`/dewit/sales/${item.id}`);
}
</script>
