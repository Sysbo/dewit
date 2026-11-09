<template>
	<form-page
		:title="entity.form.inventorynumber || 'Tapestry'"
		resource="tapestries"
		:id="id"
		:entity="entity"
		:can-save="atDewit"
		navigable
	>
		<div class="dw-columns">
			<div>
				<section class="dw-section">
					<h2 class="dw-section-title">{{ title }}</h2>
					<fact-list :facts="identification" />
				</section>
				<section v-if="hasDescription" class="dw-section">
					<h2 class="dw-section-title">Description</h2>
					<p v-for="text in descriptions" :key="text.lang" class="dw-paragraph"><strong>{{ text.lang }}</strong> {{ text.value }}</p>
					<p v-if="entity.form.descriptionauthor" class="dw-hint">Author: {{ entity.form.descriptionauthor }}</p>
				</section>
				<section class="dw-section">
					<h2 class="dw-section-title">Physical details</h2>
					<fact-list :facts="physical" />
				</section>
			</div>

			<div>
				<section class="dw-section">
					<h2 class="dw-section-title">Location</h2>
					<template v-if="atDewit">
						<location-fields v-model="location" lock-owner />
					</template>
					<fact-list v-else :facts="[{ label: 'Stored at', value: partnerName(entity.form.locationbp) ?? 'Unknown' }]" />
					<fact-list class="dw-facts-spaced" :facts="[{ label: 'Owner', value: partnerName(entity.form.owner) ?? 'Unknown' }]" />
				</section>
				<section class="dw-section">
					<h2 class="dw-section-title">Pictures</h2>
					<picture-gallery v-model="entity.form.pictures" />
				</section>

				<tapestry-history :id="id" :version="version" />
			</div>
		</div>
	</form-page>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useDewit, useOptions } from '../api';
import FactList from '../components/FactList.vue';
import FormPage from '../components/FormPage.vue';
import LocationFields from '../components/LocationFields.vue';
import PictureGallery from '../components/PictureGallery.vue';
import TapestryHistory from '../components/TapestryHistory.vue';
import { useEntity } from '../use-entity';

const props = defineProps<{ id: string }>();
const dewit = useDewit();
const { options } = useOptions();

const entity: any = useEntity<any>('tapestries', props, () => ({ inventorynumber: '', locationbp: null, location: null, sublocation: null, owner: null, pictures: [] }), {
	label: 'Location',
});

// The only change allowed here goes through the restricted route.
entity.save = (mode: 'list' | 'stay' = 'list') => {
	const { location: room, sublocation } = entity.form;
	return entity.run(
		() => dewit.patch(`/tapestries/${props.id}/location`, { location: room, sublocation }),
		() => {
			version.value++;
			entity.load();
			void mode;
		},
	);
};

const version = ref(0);
watch(() => props.id, () => version.value++);

const atDewit = computed(() => entity.form.locationbp !== null && entity.form.locationbp === options.selfPartner);
const location = computed({
	get: () => ({ locationbp: entity.form.locationbp, location: entity.form.location, sublocation: entity.form.sublocation }),
	set: (value) => Object.assign(entity.form, value),
});

const named = (list: { id: number; name: string }[], id: number | null) => list.find((item) => item.id === id)?.name ?? null;
const partnerName = (id: number | null) => named(options.partners, id);
const yesNo = (value: boolean | null | undefined) => (value === true ? 'Yes' : value === false ? 'No' : null);

const title = computed(() => [entity.form.titlenl, entity.form.titleen, entity.form.titlefr].filter(Boolean).join(' / ') || 'Untitled');
const identification = computed(() => {
	const artist = options.artists.find((item) => item.id === entity.form.artist);
	return [
		{ label: 'Artist', value: artist ? (artist.period ? `${artist.name} (${artist.period})` : artist.name) : 'Unknown' },
		{ label: 'Century', value: entity.form.century },
		{ label: 'Date', value: entity.form.date },
		{ label: 'Origin', value: entity.form.origin },
		{ label: 'Conservation', value: entity.form.conservation },
		{ label: 'Edition', value: entity.form.edition },
		{ label: 'Label', value: entity.form.label },
		{ label: 'Private Collection', value: yesNo(entity.form.privatecollection) },
	];
});
const physical = computed(() => [
	{ label: 'Width (M)', value: entity.form.width },
	{ label: 'Height (M)', value: entity.form.height },
	{ label: 'Surface (M²)', value: entity.form.surface },
	{ label: 'Orientation', value: named(options.orientations, entity.form.orientation) },
	{ label: 'Definitive Size', value: yesNo(entity.form.definitivesize) },
	{ label: 'Lining', value: yesNo(entity.form.lining) },
	{ label: 'Velcro', value: yesNo(entity.form.velcro) },
	{ label: 'Fragment', value: yesNo(entity.form.fragment) },
]);
const descriptions = computed(() =>
	[
		{ lang: 'NL', value: entity.form.descriptionnl },
		{ lang: 'EN', value: entity.form.descriptionen },
		{ lang: 'FR', value: entity.form.descriptionfr },
	].filter((item) => item.value),
);
const hasDescription = computed(() => descriptions.value.length > 0);
</script>

<style>
.dw-paragraph { margin: 0 0 12px; line-height: 1.6; }
.dw-paragraph strong { margin-right: 6px; color: var(--theme--foreground-subdued); font-size: 13px; }
.dw-facts-spaced { margin-top: 20px; }
</style>
