<template>
	<form-page
		:title="entity.isNew ? 'New Tapestry' : entity.form.inventorynumber || 'Tapestry'"
		resource="tapestries"
		:id="id"
		:entity="entity"
		can-save
		:can-delete="!entity.isNew"
		navigable
	>
		<template #actions>
			<icon-button icon="sell" label="Manage sale" v-if="!entity.isNew" secondary :to="`/dewit/sales/${id}`" />
		</template>

		<div class="dw-columns">
			<div>
				<section class="dw-section">
					<h2 class="dw-section-title">Identification</h2>
					<div class="dw-grid">
						<field label="Inventory Nr" size="half" required :error="entity.fieldErrors.inventorynumber">
							<v-input v-model="entity.form.inventorynumber" />
						</field>
						<field label="Artist" size="half">
							<div class="dw-with-action">
								<v-select v-model="entity.form.artist" :items="artistItems" show-deselect placeholder="Unknown" />
								<icon-button icon="add" label="New artist" :rounded="false" secondary @click="openQuickArtist" />
							</div>
						</field>
						<field label="Title (Dutch)"><v-input v-model="entity.form.titlenl" /></field>
						<field label="Title (English)"><v-input v-model="entity.form.titleen" /></field>
						<field label="Title (French)"><v-input v-model="entity.form.titlefr" /></field>
						<field label="Century" hint="Pick an existing value to keep filters clean.">
							<v-select v-model="entity.form.century" :items="centuryItems" allow-other show-deselect placeholder="Unknown" />
						</field>
						<field label="Date"><v-input v-model="entity.form.date" type="date" /></field>
						<field label="Orientation">
							<v-select v-model="entity.form.orientation" :items="orientationItems" show-deselect placeholder="Unknown" />
						</field>
					</div>
				</section>

				<section class="dw-section">
					<h2 class="dw-section-title">
						Description
						<div class="dw-langs" role="tablist" aria-label="Language">
							<button
								v-for="lang in LANGUAGES"
								:key="lang.key"
								type="button"
								role="tab"
								:aria-selected="language === lang.key"
								:class="{ active: language === lang.key, filled: entity.form[lang.key] }"
								@click="language = lang.key"
							>
								{{ lang.short }}
							</button>
						</div>
					</h2>
					<div class="dw-grid">
						<field :label="`Description (${currentLanguage.name})`" size="full">
							<v-textarea :key="language" v-model="entity.form[language]" />
						</field>
						<field label="Author" size="full"><v-input v-model="entity.form.descriptionauthor" /></field>
					</div>
				</section>

				<section class="dw-section">
					<h2 class="dw-section-title">Physical details</h2>
					<div class="dw-grid">
						<field label="Width (M)"><v-input v-model="entity.form.width" type="number" step="0.01" min="0" /></field>
						<field label="Height (M)"><v-input v-model="entity.form.height" type="number" step="0.01" min="0" /></field>
						<field label="Surface (M²)"><div class="dw-readonly">{{ surface || '—' }}</div></field>
						<field v-for="flag in FLAGS" :key="flag.key" :label="flag.label" size="half">
							<tri-toggle v-model="entity.form[flag.key]" :label="flag.label" />
						</field>
					</div>
				</section>

				<section class="dw-section">
					<h2 class="dw-section-title">Provenance</h2>
					<div class="dw-grid">
						<field label="Origin" size="full"><v-input v-model="entity.form.origin" /></field>
						<field label="Conservation"><v-input v-model="entity.form.conservation" /></field>
						<field label="Edition (Nr)"><v-input v-model="entity.form.edition" type="number" min="0" /></field>
						<field label="Label"><v-input v-model="entity.form.label" /></field>
						<field label="Private Collection" size="full">
							<v-checkbox v-model="entity.form.privatecollection" label="Part of DeWit private collection" />
						</field>
					</div>
				</section>
			</div>

			<div>
				<section class="dw-section">
					<h2 class="dw-section-title">Location & ownership</h2>
					<location-fields v-model="location" />
					<div class="dw-grid">
						<field label="Owner" size="full">
							<v-select v-model="entity.form.owner" :items="partners" show-deselect placeholder="Unknown" />
						</field>
					</div>
				</section>

				<section class="dw-section">
					<h2 class="dw-section-title">Pictures</h2>
					<picture-gallery v-model="entity.form.pictures" editable />
				</section>

				<tapestry-history v-if="!entity.isNew" :id="id" :version="version" />
			</div>
		</div>

		<v-dialog v-model="quickArtist.open" @esc="quickArtist.open = false">
			<v-card>
				<v-card-title>New artist</v-card-title>
				<v-card-text>
					<v-notice v-if="quickArtist.error" class="dw-notice" type="danger">{{ quickArtist.error }}</v-notice>
					<div class="dw-grid">
						<field label="Artist Name" size="full" required><v-input v-model="quickArtist.name" autofocus /></field>
						<field label="Period" size="full"><v-input v-model="quickArtist.period" /></field>
					</div>
				</v-card-text>
				<v-card-actions>
					<v-button secondary @click="quickArtist.open = false">Cancel</v-button>
					<v-button :disabled="isBlank(quickArtist.name)" :loading="quickArtist.saving" @click="createArtist">Create</v-button>
				</v-card-actions>
			</v-card>
		</v-dialog>
	</form-page>
</template>

<script setup lang="ts">
import IconButton from '../components/IconButton.vue';
import { computed, reactive, ref, watch } from 'vue';
import { errorText, partnerItems, useDewit, useOptions } from '../api';
import Field from '../components/Field.vue';
import FormPage from '../components/FormPage.vue';
import LocationFields from '../components/LocationFields.vue';
import PictureGallery from '../components/PictureGallery.vue';
import TapestryHistory from '../components/TapestryHistory.vue';
import TriToggle from '../components/TriToggle.vue';
import { isBlank, useEntity } from '../use-entity';

const LANGUAGES = [
	{ key: 'descriptionnl', short: 'NL', name: 'Dutch' },
	{ key: 'descriptionen', short: 'EN', name: 'English' },
	{ key: 'descriptionfr', short: 'FR', name: 'French' },
] as const;
const FLAGS = [
	{ key: 'definitivesize', label: 'Definitive Size' },
	{ key: 'lining', label: 'Lining' },
	{ key: 'velcro', label: 'Velcro' },
	{ key: 'fragment', label: 'Fragment' },
];
const TEXT_FIELDS = ['century', 'conservation', 'origin', 'label', 'descriptionen', 'descriptionnl', 'descriptionfr', 'descriptionauthor', 'titleen', 'titlenl', 'titlefr'];

const props = defineProps<{ id: string }>();
const dewit = useDewit();
const { options, refresh } = useOptions();

const blank = () => ({
	artist: null,
	orientation: null,
	inventorynumber: '',
	century: null,
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
});

const entity: any = useEntity<any>('tapestries', props, blank, {
	label: 'Tapestry',
	toForm: (data) => {
		const form: any = { ...blank(), ...data };
		for (const field of TEXT_FIELDS) if (field !== 'century') form[field] = data[field] ?? '';
		return form;
	},
	toPayload: (form) => ({ ...form, pictures: form.pictures.map((picture: { id: string }) => picture.id) }),
	validate: (form) => (isBlank(form.inventorynumber) ? { inventorynumber: 'Enter the inventory number' } : {}),
	serverErrors: { inventorynumber: /inventory number/i },
	duplicate: (form) => ({ ...form, inventorynumber: '', pictures: [] }),
});

// The sidebar refreshes after each save.
const version = ref(0);
watch(
	() => entity.saving,
	(saving, wasSaving) => {
		if (wasSaving && !saving) version.value++;
	},
);

const language = ref<(typeof LANGUAGES)[number]['key']>('descriptionnl');
const currentLanguage = computed(() => LANGUAGES.find((lang) => lang.key === language.value)!);

const location = computed({
	get: () => ({ locationbp: entity.form.locationbp, location: entity.form.location, sublocation: entity.form.sublocation }),
	set: (value) => Object.assign(entity.form, value),
});

const surface = computed(() => {
	const { width, height } = entity.form;
	if (width === null || width === '' || height === null || height === '') return '';
	return (Math.round(Number(width) * Number(height) * 100) / 100).toFixed(2);
});

const artistItems = computed(() =>
	options.artists.map((artist) => ({ text: artist.period ? `${artist.name} (${artist.period})` : artist.name, value: artist.id })),
);
const centuryItems = computed(() => options.centuries.map((century) => ({ text: century, value: century })));
const orientationItems = computed(() => options.orientations.map((item) => ({ text: item.name, value: item.id })));
const partners = computed(() => partnerItems(options.partners));

const quickArtist = reactive({ open: false, name: '', period: '', saving: false, error: null as string | null });

function openQuickArtist() {
	Object.assign(quickArtist, { open: true, name: '', period: '', error: null });
}

async function createArtist() {
	quickArtist.saving = true;
	quickArtist.error = null;
	try {
		const { id } = await dewit.post('/artists', { name: quickArtist.name, period: quickArtist.period });
		await refresh();
		entity.form.artist = id;
		quickArtist.open = false;
	} catch (e) {
		quickArtist.error = errorText(e);
	} finally {
		quickArtist.saving = false;
	}
}
</script>

<style>
.dw-with-action { display: flex; gap: 8px; }
.dw-with-action .v-select { flex: 1; min-width: 0; }
.dw-with-action .v-button { --v-button-height: var(--theme--form--field--input--height, 60px); --v-button-width: var(--theme--form--field--input--height, 60px); }
.dw-langs { display: flex; gap: 4px; }
.dw-langs button { position: relative; min-width: 44px; min-height: 32px; font-size: 13px; font-weight: 600; border-radius: var(--theme--border-radius); color: var(--theme--foreground-subdued); cursor: pointer; }
.dw-langs button.active { background: var(--theme--background-accent); color: var(--theme--foreground-accent); }
.dw-langs button.filled::after { content: ''; position: absolute; top: 4px; right: 6px; width: 6px; height: 6px; border-radius: 50%; background: var(--theme--primary); }
</style>
