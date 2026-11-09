<template>
	<div class="dw-grid">
		<field v-if="!lockOwner" label="Stored at" size="full" hint="Choose DeWit to pick a room. For a partner, no other detail is needed.">
			<v-select
				:model-value="model.locationbp"
				:items="partners"
				show-deselect
				placeholder="Unknown"
				@update:model-value="update({ locationbp: $event, location: null, sublocation: null })"
			/>
		</field>
		<template v-if="internal">
			<field label="Location (Room/Area)" size="half" :error="errors?.location">
				<v-select
					:model-value="model.location"
					:items="rooms"
					show-deselect
					placeholder="Select a room"
					@update:model-value="update({ location: $event, sublocation: null })"
				/>
			</field>
			<field label="Sub-location" size="half">
				<v-select
					:model-value="model.sublocation"
					:items="sublocations"
					show-deselect
					:disabled="!model.location || !sublocations.length"
					:placeholder="!model.location ? 'Select a room first' : sublocations.length ? 'Select a sub-location' : 'None in this room'"
					@update:model-value="update({ sublocation: $event })"
				/>
			</field>
		</template>
	</div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { partnerItems, useOptions } from '../api';
import Field from './Field.vue';

type Location = { locationbp: number | null; location: number | null; sublocation: number | null };

const props = defineProps<{ lockOwner?: boolean; errors?: Record<string, string> }>();
const model = defineModel<Location>({ required: true });

const { options } = useOptions();
const partners = computed(() => partnerItems(options.partners));
const internal = computed(() => props.lockOwner || (model.value.locationbp !== null && model.value.locationbp === options.selfPartner));
const rooms = computed(() => options.locations.map((room) => ({ text: room.name, value: room.id })));
const sublocations = computed(() =>
	options.sublocations.filter((item) => item.locationid === model.value.location).map((item) => ({ text: item.description, value: item.id })),
);

function update(patch: Partial<Location>) {
	model.value = { ...model.value, ...patch };
}
</script>
