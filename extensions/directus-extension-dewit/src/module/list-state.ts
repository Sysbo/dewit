import { computed, onMounted, reactive, ref, shallowReactive, shallowRef, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { errorText, useDewit } from './api';

export const PAGE_SIZES = [25, 50, 100];
const PAGE_SIZE_KEY = 'dewit.pageSize';

type Memory = { fullPath: string; path: string; query: Record<string, string>; ids: number[]; page: number; pages: number; total: number; limit: number };

// Last list state per resource: drives the way back and previous/next between records.
const listMemory = shallowReactive<Record<string, Memory>>({});

export const backPath = (resource: string) => listMemory[resource]?.fullPath ?? `/dewit/${resource}`;

function storedPageSize() {
	try {
		const value = Number(localStorage.getItem(PAGE_SIZE_KEY));
		return PAGE_SIZES.includes(value) ? value : PAGE_SIZES[0]!;
	} catch {
		return PAGE_SIZES[0]!;
	}
}

function flatten(query: Record<string, unknown>) {
	const result: Record<string, string> = {};
	for (const [key, value] of Object.entries(query)) if (typeof value === 'string' && value !== '') result[key] = value;
	return result;
}

type Options = {
	resource: string;
	sync?: boolean; // Keeps the state in the URL; off inside a drawer.
	defaultSort: string;
	remember?: (item: any) => number;
};

export function useListQuery({ resource, sync = true, defaultSort, remember = (item) => item.id }: Options) {
	const dewit = useDewit();
	const route = useRoute();
	const router = useRouter();
	const ownPath = route.path;

	const local = ref<Record<string, string>>({});
	const query = computed(() => (sync ? flatten(route.query as Record<string, unknown>) : local.value));

	const items = shallowRef<any[]>([]);
	const total = ref(0);
	const loading = ref(true);
	const error = ref<string | null>(null);
	const pageSize = ref(storedPageSize());

	const page = computed(() => Math.max(1, Number(query.value.page) || 1));
	const pages = computed(() => Math.max(1, Math.ceil(total.value / pageSize.value)));
	const sort = computed(() => {
		const raw = query.value.sort ?? defaultSort;
		return { by: raw.replace(/^-/, ''), desc: raw.startsWith('-') };
	});

	let ticket = 0;
	async function load() {
		const current = ++ticket;
		loading.value = true;
		error.value = null;
		try {
			const result = await dewit.get(`/${resource}`, { ...query.value, limit: pageSize.value });
			if (current !== ticket) return;
			items.value = result.items;
			total.value = result.total;
			if (!result.items.length && page.value > 1) {
				set({ page: null }, { replace: true });
				return;
			}
			if (sync) {
				listMemory[resource] = {
					fullPath: route.fullPath,
					path: route.path,
					query: { ...query.value },
					ids: result.items.map(remember),
					page: page.value,
					pages: pages.value,
					total: result.total,
					limit: pageSize.value,
				};
			}
		} catch (e) {
			if (current === ticket) error.value = errorText(e);
		} finally {
			if (current === ticket) loading.value = false;
		}
	}

	function set(patch: Record<string, string | null | undefined>, { replace = false } = {}) {
		const next: Record<string, string> = { ...query.value };
		if (!('page' in patch)) delete next.page;
		for (const [key, value] of Object.entries(patch)) {
			if (value === null || value === undefined || value === '') delete next[key];
			else next[key] = value;
		}
		if (!sync) local.value = next;
		else if (replace) router.replace({ query: next });
		else router.push({ query: next });
	}

	function setPageSize(size: number) {
		pageSize.value = size;
		try {
			localStorage.setItem(PAGE_SIZE_KEY, String(size));
		} catch {
			// The page size is only a convenience.
		}
		set({});
	}

	const setPage = (next: number) => set({ page: next > 1 ? String(next) : null });
	const setSort = (next: { by: string; desc: boolean } | null) => set({ sort: next ? `${next.desc ? '-' : ''}${next.by}` : null });

	watch(
		() => [JSON.stringify(query.value), pageSize.value, route.path],
		() => {
			// The query also changes while leaving for a record.
			if (!sync || route.path === ownPath) load();
		},
	);
	onMounted(load);

	return reactive({ query, items, total, loading, error, page, pages, sort, pageSize, load, set, setPage, setPageSize, setSort });
}

export function useNeighbors(resource: string, currentId: () => string) {
	const dewit = useDewit();
	const router = useRouter();
	const moving = ref(false);

	const memory = computed(() => listMemory[resource]);
	const index = computed(() => memory.value?.ids.indexOf(Number(currentId())) ?? -1);
	const hasPrevious = computed(() => index.value > 0 || (index.value === 0 && memory.value!.page > 1));
	const hasNext = computed(() => {
		const list = memory.value;
		return !!list && index.value >= 0 && (index.value < list.ids.length - 1 || list.page < list.pages);
	});
	const position = computed(() => {
		const list = memory.value;
		if (!list || index.value < 0) return null;
		return `${((list.page - 1) * list.limit + index.value + 1).toLocaleString('en-US')} / ${list.total.toLocaleString('en-US')}`;
	});

	async function go(delta: number) {
		const list = memory.value;
		if (!list || moving.value) return;
		const target = index.value + delta;
		if (target >= 0 && target < list.ids.length) {
			router.push(`/dewit/${resource}/${list.ids[target]}`);
			return;
		}

		moving.value = true;
		try {
			const page = list.page + delta;
			const query: Record<string, string> = { ...list.query };
			if (page > 1) query.page = String(page);
			else delete query.page;
			const result = await dewit.get(`/${resource}`, { ...query, limit: list.limit });
			const ids = result.items.map((item: any) => item.id);
			listMemory[resource] = { ...list, ids, page, query, fullPath: router.resolve({ path: list.path, query }).fullPath };
			router.push(`/dewit/${resource}/${delta > 0 ? ids[0] : ids[ids.length - 1]}`);
		} finally {
			moving.value = false;
		}
	}

	return reactive({ hasPrevious, hasNext, position, go });
}
