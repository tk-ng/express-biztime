const ExpressError = require("../expressError");
const express = require("express");
const router = express.Router();
const db = require("../db");

router.get("/", async (req, res, next) => {
	try {
		const results = await db.query("SELECT id, comp_code FROM invoices");
		return res.json({ invoices: results.rows });
	} catch (err) {
		return next(err);
	}
});

router.get("/:id", async (req, res, next) => {
	try {
		const { id } = req.params;
		const results = await db.query(
			"SELECT i.id, i.amt, i.paid, i.add_date, i.paid_date, i.comp_code, c.name, c.description FROM invoices i JOIN companies c ON i.comp_code = c.code WHERE i.id = $1",
			[id]
		);
		if (results.rows.length === 0)
			throw new ExpressError(`Invalid Invoice ID: ${id}`, 404);
		const data = results.rows[0];
		const invoice = {
			id: data.id,
			amt: data.amt,
			paid: data.paid,
			add_date: data.add_date,
			paid_date: data.paid_date,
			company: {
				code: data.comp_code,
				name: data.name,
				description: data.description,
			},
		};
		return res.json({ invoice });
	} catch (err) {
		return next(err);
	}
});

router.post("/", async (req, res, next) => {
	try {
		if (!req.body.comp_code || !req.body.amt)
			throw new ExpressError("'comp_code' and 'amt' are required.", 400);
		const { comp_code, amt } = req.body;
		const results = await db.query(
			"INSERT INTO invoices (comp_code, amt) VALUES ($1, $2) RETURNING id, comp_code, amt, paid, add_date, paid_date",
			[comp_code, amt]
		);
		return res.status(201).json({ invoice: results.rows[0] });
	} catch (err) {
		return next(err);
	}
});

router.put("/:id", async (req, res, next) => {
	try {
		const { amt, paid } = req.body;
		const { id } = req.params;
		let paidDate;

		const findResult = await db.query("SELECT * FROM invoices WHERE id = $1", [
			id,
		]);

		if (findResult.rows.length === 0)
			throw new ExpressError(`Invalid Invoice ID: ${id}`, 404);

		const findPaidDate = findResult.rows[0].paid_date;

		if (!findPaidDate && paid) {
			paidDate = new Date();
		} else if (!paid) {
			paidDate = null;
		} else {
			paidDate = findPaidDate;
		}

		const results = await db.query(
			"UPDATE invoices SET amt=$1, paid=$2, paid_date=$3 WHERE id=$4 RETURNING id, comp_code, amt, paid, add_date, paid_date",
			[amt, paid, paidDate, id]
		);
		return res.json({ invoice: results.rows[0] });
	} catch (err) {
		return next(err);
	}
});

router.delete("/:id", async (req, res, next) => {
	try {
		const { id } = req.params;
		const results = await db.query(
			"DELETE FROM invoices WHERE id=$1 RETURNING id",
			[id]
		);
		if (results.rows.length === 0)
			throw new ExpressError(`Invalid Invoice ID: ${id}`, 404);
		return res.json({ status: "deleted" });
	} catch (err) {
		return next(err);
	}
});

module.exports = router;
