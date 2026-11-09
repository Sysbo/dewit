<template>
	<tapestry-editor v-if="session.role === 'manager'" :id="id" />
	<tapestry-sheet v-else-if="session.role === 'standard'" :id="id" />
	<layout v-else title="Tapestry" />
</template>

<script setup lang="ts">
import { session } from '../api';
import Layout from '../components/Layout.vue';
import TapestryEditor from './TapestryEditor.vue';
import TapestrySheet from './TapestrySheet.vue';

defineProps<{ id: string }>();
</script>
