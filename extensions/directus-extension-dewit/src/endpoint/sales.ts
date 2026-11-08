import { MANAGER_ONLY, badRequest, dateOnly, ensureExists, idParam, integer, notFound, type Ctx } from './lib';
import { applyOwner, dateString, selfPartnerId, today } from './domain';

async function read({ db, params }: Ctx) {
	const tapestryid = idParam(params.tapestryId, 'Tapestry');
	if (!(await db('tapestry').where({ id: tapestryid }).first())) throw notFound('Tapestry');

	const active = await db('salesinformation').where({ tapestryid, active: true }).first();
	// A sale withdrawn without transaction is inactive but is not a past sale.
	const history = await db('salesinformation as s')
		.leftJoin('businesspartner as seller', 'seller.id', 's.seller')
		.leftJoin('businesspartner as buyer', 'buyer.id', 's.buyer')
		.where({ 's.tapestryid': tapestryid, 's.active': false })
		.where((b: any) => b.whereNotNull('s.transactiondate').orWhereNotNull('s.buyer').orWhereNotNull('s.transactionprice'))
		.orderBy('s.transactiondate', 'desc')
		.orderBy('s.id', 'desc')
		.select('s.id', 'seller.name as soldby', 'buyer.name as soldto', 's.transactiondate', 's.minprice', 's.transactionprice');

	return {
		forsale: Boolean(active),
		seller: active?.seller ?? null,
		minprice: active?.minprice ?? null,
		selfPartner: await selfPartnerId(db),
		history: history.map((row: any) => ({ ...row, transactiondate: dateString(row.transactiondate) })),
	};
}

async function save({ params, body, tx }: Ctx) {
	const tapestryid = idParam(params.tapestryId, 'Tapestry');
	const forsale = body.forsale === true;
	const minprice = integer(body.minprice, 'Minimum price');
	const transactionprice = integer(body.transactionprice, 'Sale price');
	const transactiondate = dateOnly(body.transactiondate, 'Sold on');
	const buyer = integer(body.buyer, 'Sold to');
	const declaredSold = transactionprice !== null || transactiondate !== null || buyer !== null;

	if (!forsale && declaredSold) throw badRequest('Sale details require the For Sale flag');

	return tx(async (t) => {
		const { trx, items } = t;
		// The lock serializes concurrent saves on the same tapestry.
		if (!(await trx('tapestry').where({ id: tapestryid }).forUpdate().first())) throw notFound('Tapestry');

		const sales = items('salesinformation');
		const tapestries = items('tapestry');
		const active = await trx('salesinformation').where({ tapestryid, active: true }).first();

		if (!forsale) {
			if (active) {
				await sales.updateOne(active.id, { active: false });
				await tapestries.updateOne(tapestryid, { forsale: false });
			}
			return { status: active ? 'withdrawn' : 'unchanged' };
		}

		const seller = integer(body.seller, 'Seller') ?? (await selfPartnerId(trx));
		await ensureExists(trx, 'businesspartner', seller, 'Seller');
		await ensureExists(trx, 'businesspartner', buyer, 'Sold to');

		const sold = { transactionprice, transactiondate: transactiondate ?? today(), buyer, active: false };

		if (declaredSold) {
			if (active) await sales.updateOne(active.id, { seller, minprice, ...sold });
			else await sales.createOne({ tapestryid, seller, minprice, saledatestart: today(), ...sold });
			await tapestries.updateOne(tapestryid, { forsale: false });
			if (buyer !== null) await applyOwner(t, tapestryid, buyer);
			return { status: 'sold' };
		}

		if (active) await sales.updateOne(active.id, { seller, minprice });
		else await sales.createOne({ tapestryid, seller, minprice, saledatestart: today(), active: true });
		await tapestries.updateOne(tapestryid, { forsale: true });
		return { status: 'for-sale' };
	});
}

export function registerSales(router: any, route: any) {
	router.get('/sales/:tapestryId', route(MANAGER_ONLY, read));
	router.put('/sales/:tapestryId', route(MANAGER_ONLY, save));
}
