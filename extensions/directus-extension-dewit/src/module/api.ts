import { useApi } from '@directus/extensions-sdk';
import { computed, onMounted, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import type { Role } from '../shared/roles';

export const session = reactive<{ role: Role | null }>({ role: null });

export const errorText = (error: any): string =>
	error?.response?.data?.errors?.[0]?.message ?? error?.message ?? 'Unexpected error';

export function useDewit() {
	const api = useApi();
	const unwrap = (response: any) => response.data.data;
	return {
		get: (path: string, params?: Record<string, unknown>) => api.get(`/dewit${path}`, { params }).then(unwrap),
		post: (path: string, body: unknown) => api.post(`/dewit${path}`, body).then(unwrap),
		patch: (path: string, body: unknown) => api.patch(`/dewit${path}`, body).then(unwrap),
		put: (path: string, body: unknown) => api.put(`/dewit${path}`, body).then(unwrap),
		remove: (path: string) => api.delete(`/dewit${path}`).then(unwrap),
	};
}

export function useEntity<T extends object>(
	resource: string,
	props: { id: string },
	blank: () => T,
	toForm: (data: any) => T = (data) => data,
) {
	const dewit = useDewit();
	const router = useRouter();
	const listPath = `/dewit/${resource}`;
	const isNew = computed(() => props.id === '+');
	const form = ref(blank()) as { value: T };
	const loading = ref(!isNew.value);
	const saving = ref(false);
	const error = ref<string | null>(null);

	async function run(action: () => Promise<unknown>) {
		saving.value = true;
		error.value = null;
		try {
			await action();
			router.push(listPath);
		} catch (e) {
			error.value = errorText(e);
		} finally {
			saving.value = false;
		}
	}

	const save = () =>
		run(() => (isNew.value ? dewit.post(`/${resource}`, form.value) : dewit.patch(`/${resource}/${props.id}`, form.value)));
	const destroy = () => run(() => dewit.remove(`/${resource}/${props.id}`));

	onMounted(async () => {
		if (isNew.value) return;
		try {
			form.value = toForm(await dewit.get(`/${resource}/${props.id}`));
		} catch (e) {
			error.value = errorText(e);
		} finally {
			loading.value = false;
		}
	});

	return { form, isNew, loading, saving, error, save, destroy, run };
}
