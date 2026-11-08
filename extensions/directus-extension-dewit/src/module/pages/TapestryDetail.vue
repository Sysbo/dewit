<template>
	<form-page
		:title="isNew ? 'New Tapestry' : form.inventorynumber"
		back="/dewit/tapestries"
		:loading="loading"
		:saving="saving"
		:error="error"
		:can-save="canManage || isInternal"
		:can-delete="!isNew && canManage"
		@save="submit"
		@delete="destroy"
	>
		<div class="dw-grid">
			<field label="Artist" size="full">
				<v-select v-model="form.artist" :items="artistItems" show-deselect :disabled="!canManage" placeholder="Unknown" />
			</field>
			<field label="Century" size="half"><v-input v-model="form.century" :disabled="!canManage" /></field>
			<field label="Date" size="half"><v-input v-model="form.date" type="date" :disabled="!canManage" /></field>

			<h2 class="dw-section">Title</h2>
			<field label="Title (Dutch)"><v-input v-model="form.titlenl" :disabled="!canManage" /></field>
			<field label="Title (English)"><v-input v-model="form.titleen" :disabled="!canManage" /></field>
			<field label="Title (French)"><v-input v-model="form.titlefr" :disabled="!canManage" /></field>

			<h2 class="dw-section">Description</h2>
			<field label="Description (Dutch)"><v-textarea v-model="form.descriptionnl" :disabled="!canManage" /></field>
			<field label="Description (English)"><v-textarea v-model="form.descriptionen" :disabled="!canManage" /></field>
			<field label="Description (French)"><v-textarea v-model="form.descriptionfr" :disabled="!canManage" /></field>
			<field label="Author" size="full"><v-input v-model="form.descriptionauthor" :disabled="!canManage" /></field>

			<h2 class="dw-section">Details</h2>
			<field label="Inventory Nr" size="half"><v-input v-model="form.inventorynumber" :disabled="!canManage" /></field>
			<field label="Conservation" size="half"><v-input v-model="form.conservation" :disabled="!canManage" /></field>
			<field label="Origin" size="half"><v-input v-model="form.origin" :disabled="!canManage" /></field>
			<field label="Private Collection?" size="half">
				<v-checkbox v-model="form.privatecollection" :disabled="!canManage" label="Part of DeWit private collection" />
			</field>
			<field label="Edition (Nr)" size="half"><v-input v-model="form.edition" type="number" :disabled="!canManage" /></field>
			<field label="Label" size="half"><v-input v-model="form.label" :disabled="!canManage" /></field>
			<field label="Width (M)"><v-input v-model="form.width" type="number" step="0.01" :disabled="!canManage" /></field>
			<field label="Height (M)"><v-input v-model="form.height" type="number" step="0.01" :disabled="!canManage" /></field>
			<field label="Surface (M²)"><div class="dw-readonly">{{ surface }}</div></field>
			<field v-for="flag in flags" :key="flag.key" :label="flag.label">
				<v-select v-model="form[flag.key]" :items="yesNo" show-deselect :disabled="!canManage" placeholder="Unknown" />
			</field>
			<field label="Orientation">
				<v-select v-model="form.orientation" :items="orientationItems" show-deselect :disabled="!canManage" placeholder="Unknown" />
			</field>

			<h2 class="dw-section">Pictures</h2>
			<div class="dw-field dw-field--full">
				<div class="dw-pictures">
					<div v-for="picture in form.pictures" :key="picture.id" class="dw-picture">
						<img :src="`/assets/${picture.id}?width=320&height=320&fit=cover`" :alt="picture.title ?? ''" />
						<button v-if="canManage" type="button" class="dw-picture-remove" @click="removePicture(picture.id)">
							<v-icon name="close" small />
						</button>
					</div>
					<p v-if="!canManage && !form.pictures.length">No picture</p>
				</div>
				<v-upload v-if="canManage" multiple from-library :folder="TAPESTRIES_FOLDER_ID" @input="addPictures" />
			</div>

			<h2 class="dw-section">Ownership & Location</h2>
			<field label="Owner" size="full">
				<v-select v-model="form.owner" :items="partnerItems" show-deselect :disabled="!canManage" placeholder="Unknown" />
			</field>
			<field label="Location Owner" size="full">
				<v-select
					:model-value="form.locationbp"
					:items="partnerItems"
					show-deselect
					:disabled="!canManage"
					placeholder="Unknown"
					@update:model-value="selectLocationOwner"
				/>
			</field>
			<template v-if="isInternal">
				<field label="Location (Room/Area)" size="half">
					<v-select
						:model-value="form.location"
						:items="locationItems"
						show-deselect
						placeholder="Select a location"
						@update:model-value="selectLocation"
					/>
				</field>
				<field label="Sub-location (description)" size="half">
					<v-select
						v-model="form.sublocation"
						:items="sublocationItems"
						show-deselect
						:disabled="!form.location"
						placeholder="Select a sub-location"
					/>
				</field>
			</template>
		</div>
	</form-page>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { errorText, session, useDewit, useEntity } from '../api';
import { TAPESTRIES_FOLDER_ID } from '../../shared/roles';
import Field from '../components/Field.vue';
import FormPage from '../components/FormPage.vue';

const props = defineProps<{ id: string }>();
const dewit = useDewit();

const { form, isNew, loading, saving, error, save, destroy, run } = useEntity<any>('tapestries', props, () => ({
	artist: null,
	orientation: null,
	inventorynumber: '',
	century: '',
	date: null,
	conservation: '',
	origin: '',
	height: null,
	width: null,
	fragment: null,
	velcro: null,
	lining: null,
	definitivesize: null,
	privatecollection: false,
	label: '',
	edition: null,
	descriptionen: '',
	descriptionnl: '',
	descriptionfr: '',
	descriptionauthor: '',
	titleen: '',
	titlenl: '',
	titlefr: '',
	owner: null,
	locationbp: null,
	location: null,
	sublocation: null,
	pictures: [],
}));

const flags = [
	{ key: 'definitivesize', label: 'Definitive Size?' },
	{ key: 'lining', label: 'Lining' },
	{ key: 'velcro', label: 'Velcro' },
	{ key: 'fragment', label: 'Fragment' },
];
const yesNo = [
	{ text: 'Yes', value: true },
	{ text: 'No', value: false },
];

const options = ref<any>({ selfPartner: null, artists: [], orientations: [], partners: [], locations: [], sublocations: [] });

onMounted(async () => {
	try {
		options.value = await dewit.get('/options');
	} catch (e) {
		error.value = errorText(e);
	}
});

const canManage = computed(() => session.role === 'manager');
const isInternal = computed(() => form.value.locationbp !== null && form.value.locationbp === options.value.selfPartner);

const surface = computed(() => {
	const { width, height } = form.value;
	if (width === null || width === '' || height === null || height === '') return '';
	return (Math.round(Number(width) * Number(height) * 100) / 100).toFixed(2);
});

const artistItems = computed(() =>
	options.value.artists.map((artist: any) => ({ text: artist.period ? `${artist.name} (${artist.period})` : artist.name, value: artist.id })),
);
const orientationItems = computed(() => options.value.orientations.map((o: any) => ({ text: o.name, value: o.id })));
const partnerItems = computed(() =>
	options.value.partners.map((p: any) => ({ text: p.active ? p.name : `${p.name} (inactive)`, value: p.id })),
);
const locationItems = computed(() => options.value.locations.map((l: any) => ({ text: l.name, value: l.id })));
const sublocationItems = computed(() =>
	options.value.sublocations
		.filter((s: any) => s.locationid === form.value.location)
		.map((s: any) => ({ text: s.description, value: s.id })),
);

function selectLocationOwner(value: number | null) {
	form.value.locationbp = value;
	form.value.location = null;
	form.value.sublocation = null;
}

function selectLocation(value: number | null) {
	form.value.location = value;
	form.value.sublocation = null;
}

function addPictures(files: any) {
	for (const file of Array.isArray(files) ? files : [files]) {
		if (!form.value.pictures.some((picture: any) => picture.id === file.id)) {
			form.value.pictures.push({ id: file.id, title: file.title });
		}
	}
}

function removePicture(id: string) {
	form.value.pictures = form.value.pictures.filter((picture: any) => picture.id !== id);
}

function submit() {
	if (canManage.value) return save();
	const { location, sublocation } = form.value;
	return run(() => dewit.patch(`/tapestries/${props.id}/location`, { location, sublocation }));
}
</script>

<style>
.dw-pictures { display: flex; flex-wrap: wrap; gap: 16px; margin-bottom: 16px; }
.dw-picture { position: relative; width: 160px; height: 160px; }
.dw-picture img { width: 100%; height: 100%; object-fit: cover; border-radius: var(--theme--border-radius); }
.dw-picture-remove {
	position: absolute;
	top: 6px;
	right: 6px;
	display: flex;
	padding: 2px;
	color: var(--white, #fff);
	background: var(--theme--danger);
	border-radius: 50%;
	cursor: pointer;
}
</style>
