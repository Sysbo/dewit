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
	idParam,
	integer,
	likePattern,
	notFound,
	paging,
	requiredText,
	text,
	triState,
	type Ctx,
	type Tx,
} from './lib';
import {
	applyLocation,
	applyOwner,
	dateString,
	numberOrNull,
	resolveLocation,
	selfPartnerId,
	tapestryLabel,
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

async function list({ db, query }: Ctx) {
	const { page, limit, offset } = paging(query);
	const self = await selfPartnerId(db);
	const base = db('tapestry as t')
		.leftJoin('artist as a', 'a.id', 't.artist')
		.leftJoin('tapestrylocation as l', function (this: any) {
			this.on('l.tapestryid', 't.id').andOn(db.raw('l.active = true'));
		})
		.leftJoin('businesspartner as p', 'p.id', 'l.businesspartnerid')
		.leftJoin('location as r', 'r.id', 'l.locationid');

	const search = text(query.search);
	if (search) {
		const pattern = likePattern(search);
		base.where((b: any) => {
			for (const column of ['t.inventorynumber', 't.titlenl', 't.titleen', 't.titlefr', 'a.name']) {
				b.orWhereILike(column, pattern);
			}
		});
	}

	const total = await count(base);
	const rows = await base
		.clone()
		.select(
			't.id',
			't.inventorynumber',
			't.titlenl',
			't.titleen',
			't.titlefr',
			't.century',
			'a.name as artist',
			'l.businesspartnerid as bp',
			'p.name as partner',
			'r.name as room',
		)
		.orderBy('t.inventorynumber')
		.limit(limit)
		.offset(offset);

	return {
		total,
		items: rows.map((row: any) => ({
			id: row.id,
			inventorynumber: row.inventorynumber,
			title: [row.titlenl, row.titleen, row.titlefr].filter(Boolean).join(' / '),
			artist: row.artist,
			century: row.century,
			location: row.bp === self && row.room ? row.room : row.partner,
		})),
	};
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

async function options({ db }: Ctx) {
	const rows = await db('tapestry').select('id', 'inventorynumber', 'titlenl', 'titleen', 'titlefr').orderBy('inventorynumber');
	return rows.map((row: any) => ({ id: row.id, label: tapestryLabel(row) }));
}

export function registerTapestries(router: any, route: any) {
	router.get('/tapestries', route(ALL_ROLES, list));
	router.post('/tapestries', route(MANAGER_ONLY, create));
	router.get('/tapestries/:id', route(ALL_ROLES, detail));
	router.patch('/tapestries/:id', route(MANAGER_ONLY, update));
	router.patch('/tapestries/:id/location', route(ALL_ROLES, updateInternalLocation));
	router.delete('/tapestries/:id', route(MANAGER_ONLY, remove));
	router.get('/options/tapestries', route(MANAGER_ONLY, options));
}
