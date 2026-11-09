import {
	ALL_ROLES,
	MANAGER_ONLY,
	badRequest,
	blockIfUsed,
	conflict,
	count,
	dateOnly,
	decimal,
	ensureExists,
	forbidden,
	idList,
	idParam,
	integer,
	optionalId,
	notFound,
	paging,
	requiredText,
	searchTerms,
	sorting,
	text,
	triState,
	type Ctx,
	type Tx,
} from './lib';
import {
	applyLocation,
	applyOwner,
	dateString,
	firstPictures,
	firstTitle,
	numberOrNull,
	resolveLocation,
	selfPartnerId,
} from './domain';

const TEXT_FIELDS = [
	'century',
	'conservation',
	'origin',
	'label',
	'descriptionen',
	'descriptionnl',
	'descriptionfr',
	'descriptionauthor',
	'titleen',
	'titlenl',
	'titlefr',
] as const;
const TRI_STATE_FIELDS = ['fragment', 'velcro', 'lining', 'definitivesize'] as const;

function parseColumns(body: any) {
	const height = decimal(body.height, 'Height');
	const width = decimal(body.width, 'Width');
	const columns: Record<string, unknown> = {
		artist: integer(body.artist, 'Artist'),
		orientation: integer(body.orientation, 'Orientation'),
		inventorynumber: requiredText(body.inventorynumber, 'Inventory number'),
		date: dateOnly(body.date, 'Date'),
		edition: integer(body.edition, 'Edition'),
		height,
		width,
		surface: height !== null && width !== null ? Math.round(height * width * 100) / 100 : null,
		privatecollection: body.privatecollection === true,
	};
	for (const field of TEXT_FIELDS) columns[field] = text(body[field]);
	for (const field of TRI_STATE_FIELDS) columns[field] = triState(body[field]);
	return columns;
}

async function assertInventoryFree(db: any, inventorynumber: unknown, exceptId?: number) {
	const query = db('tapestry').where({ inventorynumber });
	if (exceptId) query.whereNot({ id: exceptId });
	if (await query.first()) throw conflict(`Inventory number ${inventorynumber} is already used`);
}

async function syncPictures({ trx, items }: Tx, tapestry_id: number, value: unknown) {
	if (value !== undefined && !Array.isArray(value)) throw badRequest('Pictures must be a list');
	const wanted = [...new Set(((value as string[]) ?? []).map(String))];
	if (wanted.length) {
		const known = await trx('directus_files').whereIn('id', wanted).select('id');
		if (known.length !== wanted.length) throw badRequest('A selected picture does not exist');
	}
	const current = await trx('tapestry_files').where({ tapestry_id });
	const service = items('tapestry_files');
	const removed = current.filter((row: any) => !wanted.includes(row.directus_files_id)).map((row: any) => row.id);
	if (removed.length) await service.deleteMany(removed);
	for (const directus_files_id of wanted) {
		if (!current.some((row: any) => row.directus_files_id === directus_files_id)) {
			await service.createOne({ tapestry_id, directus_files_id });
		}
	}
}

async function saveRelations(tx: Tx, id: number, body: any) {
	const self = await selfPartnerId(tx.trx);
	const owner = integer(body.owner, 'Owner');
	await ensureExists(tx.trx, 'businesspartner', owner, 'Owner');
	const target = await resolveLocation(
		tx.trx,
		self,
		integer(body.locationbp, 'Location owner'),
		integer(body.location, 'Location'),
		integer(body.sublocation, 'Sub-location'),
	);
	await applyOwner(tx, id, owner);
	await applyLocation(tx, id, target, self);
	await syncPictures(tx, id, body.pictures);
}

async function assertReferences(trx: any, columns: Record<string, unknown>) {
	await ensureExists(trx, 'artist', columns.artist as number | null, 'Artist');
	await ensureExists(trx, 'orientation', columns.orientation as number | null, 'Orientation');
}

const ACTIVE_LOCATION = 'x.tapestryid = t.id and x.active';

function applyFilters(db: any, base: any, query: Record<string, any>, role: string, self: number) {
	for (const term of searchTerms(query.search)) {
		base.where((b: any) => {
			for (const column of ['t.inventorynumber', 't.titlenl', 't.titleen', 't.titlefr', 'a.name']) b.orWhereILike(column, term);
		});
	}

	const artist = optionalId(query.artist);
	if (artist) base.where('t.artist', artist);
	const orientation = optionalId(query.orientation);
	if (orientation) base.where('t.orientation', orientation);
	const century = text(query.century);
	if (century) base.where('t.century', century);
	if (query.private === 'yes' || query.private === 'no') base.where('t.privatecollection', query.private === 'yes');
	if (role === 'manager' && (query.forsale === 'yes' || query.forsale === 'no')) base.where('t.forsale', query.forsale === 'yes');

	const related = (table: string, condition: string, extra?: (q: any) => void) => (q: any) => {
		q.select(db.raw('1')).from(`${table} as x`).whereRaw(condition);
		extra?.(q);
	};

	const catalog = optionalId(query.catalog);
	if (catalog) base.whereExists(related('cataloguepresence', 'x.tapestryid = t.id', (q) => q.where('x.catalogueid', catalog)));
	if (query.pictures === 'yes') base.whereExists(related('tapestry_files', 'x.tapestry_id = t.id'));
	if (query.pictures === 'no') base.whereNotExists(related('tapestry_files', 'x.tapestry_id = t.id'));
	const owner = optionalId(query.owner);
	if (owner) base.whereExists(related('ownership', ACTIVE_LOCATION, (q) => q.where('x.ownerid', owner)));

	const location = text(query.location);
	if (location === 'unknown') {
		base.whereNotExists(related('tapestrylocation', ACTIVE_LOCATION));
	} else if (location) {
		const [kind, raw] = location.split(':');
		const id = optionalId(raw);
		base.whereExists(
			related('tapestrylocation', ACTIVE_LOCATION, (q) => {
				if (kind === 'dewit') q.where('x.businesspartnerid', self);
				if (kind === 'partner' && id) q.where('x.businesspartnerid', id);
				if (kind === 'room' && id) {
					q.where({ 'x.businesspartnerid': self, 'x.locationid': id });
					const sublocation = optionalId(query.sublocation);
					if (sublocation) q.where('x.sublocationid', sublocation);
				}
			}),
		);
	}
}

const SORT_COLUMNS = {
	inventorynumber: 't.inventorynumber',
	title: "coalesce(nullif(t.titlenl, ''), nullif(t.titleen, ''), nullif(t.titlefr, ''))",
	artist: 'a.name',
	century: 't.century',
	location: 'location_label',
};

async function list({ db, query, role }: Ctx) {
	const { limit, offset } = paging(query);
	const self = await selfPartnerId(db);
	const base = db('tapestry as t').leftJoin('artist as a', 'a.id', 't.artist');
	applyFilters(db, base, query, role, self);

	const total = await count(base);
	const rows = await base
		.clone()
		.leftJoin('tapestrylocation as l', function (this: any) {
			this.on('l.tapestryid', 't.id').andOn(db.raw('l.active = true'));
		})
		.leftJoin('businesspartner as p', 'p.id', 'l.businesspartnerid')
		.leftJoin('location as r', 'r.id', 'l.locationid')
		.select(
			't.id',
			't.inventorynumber',
			't.titlenl',
			't.titleen',
			't.titlefr',
			't.century',
			't.forsale',
			'a.name as artist',
			'l.businesspartnerid as bp',
			db.raw('case when l.businesspartnerid = ? and r.name is not null then r.name else p.name end as location_label', [self]),
		)
		.orderByRaw(sorting(query, SORT_COLUMNS, 'inventorynumber'))
		.orderBy('t.id')
		.limit(limit)
		.offset(offset);

	const thumbnails = await firstPictures(db, rows.map((row: any) => row.id));
	return {
		total,
		items: rows.map((row: any) => ({
			id: row.id,
			inventorynumber: row.inventorynumber,
			title: firstTitle(row),
			titles: [row.titlenl, row.titleen, row.titlefr].filter(Boolean).join(' / '),
			artist: row.artist,
			century: row.century,
			location: row.location_label,
			atDewit: row.bp === self,
			thumbnail: thumbnails.get(row.id) ?? null,
			...(role === 'manager' ? { forsale: row.forsale } : {}),
		})),
	};
}

async function activity({ db, params, role }: Ctx) {
	const id = idParam(params.id, 'Tapestry');
	const self = await selfPartnerId(db);
	const [locations, owners, catalogs] = await Promise.all([
		db('tapestrylocation as l')
			.leftJoin('businesspartner as p', 'p.id', 'l.businesspartnerid')
			.leftJoin('location as r', 'r.id', 'l.locationid')
			.leftJoin('sublocation as s', 's.id', 'l.sublocationid')
			.where('l.tapestryid', id)
			.orderBy('l.id', 'desc')
			.select('l.id', 'l.active', 'l.IN as start', 'l.out as end', 'l.businesspartnerid as bp', 'p.name as partner', 'r.name as room', 's.description as sub'),
		db('ownership as o')
			.leftJoin('businesspartner as p', 'p.id', 'o.ownerid')
			.where('o.tapestryid', id)
			.orderBy('o.id', 'desc')
			.select('o.id', 'o.active', 'o.datestart as start', 'o.dateend as end', 'p.name as owner'),
		db('cataloguepresence as c')
			.join('catalogue as g', 'g.id', 'c.catalogueid')
			.where('c.tapestryid', id)
			.orderBy('g.year', 'desc')
			.select('g.id', 'g.name', 'g.year'),
	]);
	const forsale = role === 'manager' ? (await db('tapestry').where({ id }).first('forsale'))?.forsale : undefined;
	return {
		forsale,
		catalogs,
		locations: locations.map((row: any) => ({
			id: row.id,
			active: row.active,
			start: dateString(row.start),
			end: dateString(row.end),
			label: row.bp === self && row.room ? [row.room, row.sub].filter(Boolean).join(' · ') : row.partner,
		})),
		owners: owners.map((row: any) => ({ ...row, start: dateString(row.start), end: dateString(row.end) })),
	};
}

// A shelf or a room is often moved as a whole. Standard users only move what is stored at DeWit.
async function bulkLocation({ body, role, tx }: Ctx) {
	const ids = idList(body.ids, 'Tapestries');
	if (!ids.length || ids.length > 500) throw badRequest('Select between 1 and 500 tapestries');
	return tx(async (t) => {
		const self = await selfPartnerId(t.trx);
		const bp = role === 'manager' ? (integer(body.locationbp, 'Location owner') ?? self) : self;
		const location = integer(body.location, 'Location');
		if (bp === self && location === null) throw badRequest('Select a location');
		const target = await resolveLocation(t.trx, self, bp, location, integer(body.sublocation, 'Sub-location'));

		const known = await t.trx('tapestry').whereIn('id', ids).select('id');
		const active = await t.trx('tapestrylocation').whereIn('tapestryid', ids).where({ active: true });
		const currentBp = new Map(active.map((row: any) => [row.tapestryid, row.businesspartnerid]));
		let moved = 0;
		for (const { id } of known) {
			if (role !== 'manager' && currentBp.get(id) !== self) continue;
			await applyLocation(t, id, target, self);
			moved++;
		}
		return { moved, skipped: ids.length - moved };
	});
}

async function detail({ db, params }: Ctx) {
	const id = idParam(params.id, 'Tapestry');
	const row = await db('tapestry').where({ id }).first();
	if (!row) throw notFound('Tapestry');

	const self = await selfPartnerId(db);
	const [owner, location, pictures] = await Promise.all([
		db('ownership').where({ tapestryid: id, active: true }).first(),
		db('tapestrylocation').where({ tapestryid: id, active: true }).first(),
		db('tapestry_files as f')
			.join('directus_files as d', 'd.id', 'f.directus_files_id')
			.where('f.tapestry_id', id)
			.orderBy('f.id')
			.select('d.id', 'd.title'),
	]);
	const internal = location?.businesspartnerid === self;

	// forsale and sales data stay on the Manager-only sales routes.
	const { forsale: _forsale, type: _type, ...columns } = row;
	return {
		...columns,
		date: dateString(row.date),
		height: numberOrNull(row.height),
		width: numberOrNull(row.width),
		surface: numberOrNull(row.surface),
		owner: owner?.ownerid ?? null,
		locationbp: location?.businesspartnerid ?? null,
		location: internal ? location.locationid : null,
		sublocation: internal ? location.sublocationid : null,
		pictures,
	};
}

async function create({ body, tx }: Ctx) {
	const columns = parseColumns(body);
	return tx(async (t) => {
		await assertInventoryFree(t.trx, columns.inventorynumber);
		await assertReferences(t.trx, columns);
		const id = await t.items('tapestry').createOne({ ...columns, forsale: false });
		await saveRelations(t, id, body);
		return { id };
	});
}

async function update({ params, body, tx }: Ctx) {
	const id = idParam(params.id, 'Tapestry');
	const columns = parseColumns(body);
	return tx(async (t) => {
		if (!(await t.trx('tapestry').where({ id }).first())) throw notFound('Tapestry');
		await assertInventoryFree(t.trx, columns.inventorynumber, id);
		await assertReferences(t.trx, columns);
		await t.items('tapestry').updateOne(id, columns);
		await saveRelations(t, id, body);
		return { id };
	});
}

// Available to every role: moves a tapestry inside the DeWit manufactury.
async function updateInternalLocation({ params, body, tx }: Ctx) {
	const id = idParam(params.id, 'Tapestry');
	return tx(async (t) => {
		if (!(await t.trx('tapestry').where({ id }).first())) throw notFound('Tapestry');
		const self = await selfPartnerId(t.trx);
		const active = await t.trx('tapestrylocation').where({ tapestryid: id, active: true }).first();
		if (active?.businesspartnerid !== self) throw forbidden('This tapestry is not stored at DeWit');
		const target = await resolveLocation(
			t.trx,
			self,
			self,
			integer(body.location, 'Location'),
			integer(body.sublocation, 'Sub-location'),
		);
		await applyLocation(t, id, target, self);
		return { id };
	});
}

async function remove({ params, tx }: Ctx) {
	const id = idParam(params.id, 'Tapestry');
	return tx(async ({ trx, items }) => {
		if (!(await trx('tapestry').where({ id }).first())) throw notFound('Tapestry');
		await blockIfUsed(
			trx,
			[
				['salesinformation', 'tapestryid', 'sales'],
				['cataloguepresence', 'tapestryid', 'catalogs'],
				['cleaning', 'tapestryid', 'cleanings'],
			],
			id,
		);
		for (const [table, column] of [
			['ownership', 'tapestryid'],
			['tapestrylocation', 'tapestryid'],
			['tapestrypicture', 'tapestryid'],
			['tapestry_files', 'tapestry_id'],
		] as const) {
			const keys = (await trx(table).where({ [column]: id }).select('id')).map((row: any) => row.id);
			if (keys.length) await items(table).deleteMany(keys);
		}
		await items('tapestry').deleteOne(id);
		return { id };
	});
}

export function registerTapestries(router: any, route: any) {
	router.get('/tapestries', route(ALL_ROLES, list));
	router.post('/tapestries', route(MANAGER_ONLY, create));
	router.post('/tapestries/bulk/location', route(ALL_ROLES, bulkLocation));
	router.get('/tapestries/:id', route(ALL_ROLES, detail));
	router.get('/tapestries/:id/activity', route(ALL_ROLES, activity));
	router.patch('/tapestries/:id', route(MANAGER_ONLY, update));
	router.patch('/tapestries/:id/location', route(ALL_ROLES, updateInternalLocation));
	router.delete('/tapestries/:id', route(MANAGER_ONLY, remove));
}
