const ExpressError = require("../expressError");
const express = require("express");
const slugify = require("slugify");
const router = express.Router();
const db = require("../db");

router.get("/", async (req, res, next) => {
	try {
		const results = await db.query("SELECT * FROM companies");
		return res.json({ companies: results.rows });
	} catch (err) {
		return next(err);
	}
});

router.get("/:code", async (req, res, next) => {
	try {
		const { code } = req.params;
		const results = await db.query("SELECT * FROM companies WHERE code=$1", [
			code,
		]);
		if (results.rows.length === 0)
			throw new ExpressError(`Cannot get company with code: ${code}`, 404);
		return res.json({ company: results.rows[0] });
	} catch (err) {
		return next(err);
	}
});

router.post("/", async (req, res, next) => {
	try {
		if (!req.body.name || !req.body.description)
			throw new ExpressError(
				"The company's 'code', 'name', and 'description' are required",
				400
			);
		const { name, description } = req.body;
		const code = slugify(name, { lower: true });
		const results = await db.query(
			"INSERT INTO companies (code, name, description) VALUES ($1, $2, $3) RETURNING code, name, description",
			[code, name, description]
		);
		return res.status(201).json({ company: results.rows[0] });
	} catch (err) {
		if (err.code === "23505") {
			err.status = 403;
			err.message = "The company name already exists.";
		}
		return next(err);
	}
});

router.put("/:code", async (req, res, next) => {
	try {
		if (!req.body.name || !req.body.description)
			throw new ExpressError("'name' and 'description' are required.", 400);
		const { name, description } = req.body;
		const { code } = req.params;
		const results = await db.query(
			"UPDATE companies SET name=$1, description=$2 WHERE code=$3 RETURNING code, name, description",
			[name, description, code]
		);
		if (results.rows.length === 0)
			throw new ExpressError(`Cannot update company with code: ${code}`, 404);
		return res.json({ company: results.rows[0] });
	} catch (err) {
		return next(err);
	}
});

router.delete("/:code", async (req, res, next) => {
	try {
		const { code } = req.params;
		const results = await db.query(
			"DELETE FROM companies WHERE code=$1 RETURNING code, name, description",
			[code]
		);
		if (results.rows.length === 0)
			throw new ExpressError(`Cannot delete company with code: ${code}`, 404);
		return res.json({ status: "deleted" });
	} catch (err) {
		return next(err);
	}
});

module.exports = router;
