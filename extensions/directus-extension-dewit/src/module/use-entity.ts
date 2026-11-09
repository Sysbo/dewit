import { computed, nextTick, onMounted, reactive, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { errorText, invalidateOptions, useDewit, useNotify } from './api';
import { backPath } from './list-state';

export type SaveMode = 'list' | 'stay' | 'new';

// v-input emits null when a field is emptied.
export const isBlank = (value: unknown) => !String(value ?? '').trim();

type Options<T> = {
	label: string;
	toForm?: (data: any) => T;
	toPayload?: (form: T) => unknown;
	validate?: (form: T) => Record<string, string>;
	serverErrors?: Record<string, RegExp>; // Shows a matching API error on the field.
	duplicate?: (form: T) => T;
};

// Prefills the next new record when duplicating.
const drafts: Record<string, unknown> = {};

function revealFirstError() {
	nextTick(() => document.querySelector('.dw-field--error')?.scrollIntoView({ block: 'center', behavior: 'smooth' }));
}

export function useEntity<T extends object>(resource: string, props: { id: string }, blank: () => T, options: Options<T>) {
	const { label, toForm = (data) => data as T, toPayload = (form) => form, validate, serverErrors = {}, duplicate } = options;
	const dewit = useDewit();
	const router = useRouter();
	const notify = useNotify();

	const isNew = computed(() => props.id === '+');
	const form = ref(blank()) as { value: T };
	const baseline = ref(JSON.stringify(form.value));
	const dirty = computed(() => JSON.stringify(form.value) !== baseline.value);
	const loading = ref(!isNew.value);
	const saving = ref(false);
	const error = ref<string | null>(null);
	const fieldErrors = ref<Record<string, string>>({});

	function setForm(value: T, markClean = true) {
		form.value = value;
		if (markClean) baseline.value = JSON.stringify(value);
		fieldErrors.value = {};
		error.value = null;
	}

	async function load() {
		if (isNew.value) {
			const draft = drafts[resource] as T | undefined;
			delete drafts[resource];
			setForm(blank());
			if (draft) form.value = draft;
			loading.value = false;
			return;
		}
		loading.value = true;
		const id = props.id;
		try {
			const data = await dewit.get(`/${resource}/${id}`);
			if (id === props.id) setForm(toForm(data));
		} catch (e) {
			error.value = errorText(e);
		} finally {
			loading.value = false;
		}
	}

	async function run(action: () => Promise<unknown>, after: () => void) {
		saving.value = true;
		error.value = null;
		try {
			await action();
			invalidateOptions();
			after();
		} catch (e) {
			const message = errorText(e);
			const field = Object.keys(serverErrors).find((key) => serverErrors[key]!.test(message));
			if (field) {
				fieldErrors.value = { [field]: message };
				revealFirstError();
			} else {
				error.value = message;
			}
		} finally {
			saving.value = false;
		}
	}

	function save(mode: SaveMode = 'list') {
		const problems = validate?.(form.value) ?? {};
		fieldErrors.value = problems;
		if (Object.keys(problems).length) {
			revealFirstError();
			return;
		}

		let createdId: number | undefined;
		return run(
			async () => {
				const payload = toPayload(form.value);
				const result = isNew.value ? await dewit.post(`/${resource}`, payload) : await dewit.patch(`/${resource}/${props.id}`, payload);
				createdId = result?.id;
			},
			() => {
				const wasNew = isNew.value;
				baseline.value = JSON.stringify(form.value);
				notify(`${label} saved`);
				if (mode === 'list') router.push(backPath(resource));
				else if (mode === 'new' && wasNew) load();
				else if (mode === 'new') router.push(`/dewit/${resource}/+`);
				else if (wasNew && createdId) router.replace(`/dewit/${resource}/${createdId}`);
				else load();
			},
		);
	}

	const destroy = () =>
		run(
			() => dewit.remove(`/${resource}/${props.id}`),
			() => {
				baseline.value = JSON.stringify(form.value);
				notify(`${label} deleted`);
				router.push(backPath(resource));
			},
		);

	function copy() {
		if (!duplicate) return;
		drafts[resource] = duplicate(JSON.parse(JSON.stringify(form.value)));
		router.push(`/dewit/${resource}/+`);
	}

	watch(() => props.id, load);
	onMounted(load);

	return reactive({ form, isNew, dirty, loading, saving, error, fieldErrors, canDuplicate: !!duplicate, load, save, destroy, copy, run });
}
