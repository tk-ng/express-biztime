const app = require("../app");
const db = require("../db");
const request = require("supertest");

let testInvoice;
let testCompany;

beforeEach(async () => {
	const CompResult = await db.query(
		`INSERT INTO companies (code,name,description) VALUES ('apple','Apple Computer','Maker of OSX') RETURNING code, name, description`
	);
	const InvResult = await db.query(
		`INSERT INTO invoices (comp_code,amt) VALUES ('apple',300) RETURNING id, comp_code,amt,paid,add_date, paid date`
	);
	testCompany = CompResult.rows[0];
	testInvoice = InvResult.rows[0];
});

afterEach(async () => {
	await db.query("DELETE FROM invoices");
	await db.query("DELETE FROM companies");
});

afterAll(async () => {
	await db.end();
});

describe("GET /invoices", function () {
	test("Get a list of invoices", async function () {
		const res = await request(app).get("/invoices");
		expect(res.statusCode).toBe(200);
		expect(res.body).toEqual({
			invoices: [{ id: testInvoice.id, comp_code: testInvoice.comp_code }],
		});
	});
});

describe("GET /invoices/:id", function () {
	test("Get a single invoice", async function () {
		const res = await request(app).get(`/invoices/${testInvoice.id}`);
		expect(res.statusCode).toBe(200);
		expect(res.body).toEqual({
			invoice: {
				id: testInvoice.id,
				amt: testInvoice.amt,
				paid: testInvoice.paid,
				add_date: expect.any(String),
				paid_date: null,
				company: testCompany,
			},
		});
	});
	test("Responds with 404 for getting with invalid id", async function () {
		const res = await request(app).get(`/invoices/0`);
		expect(res.statusCode).toBe(404);
	});
});

describe("POST /invoices", function () {
	test("Create a single invoice", async function () {
		const res = await request(app)
			.post("/invoices")
			.send({ comp_code: "apple", amt: 400 });
		expect(res.statusCode).toBe(201);
		expect(res.body).toEqual({
			invoice: {
				id: expect.any(Number),
				comp_code: "apple",
				amt: 400,
				paid: false,
				add_date: expect.any(String),
				paid_date: null,
			},
		});
	});
	test("Responds with 400 for invalid req.body", async function () {
		const res = await request(app).post("/invoices").send({});
		expect(res.statusCode).toBe(400);
	});
});

describe("PUT /invoices/:id", function () {
	test("It should update an invoice", async function () {
		const response = await request(app)
			.put(`/invoices/${testInvoice.id}`)
			.send({ amt: 1000, paid: false });

		expect(response.body).toEqual({
			invoice: {
				id: testInvoice.id,
				comp_code: testInvoice.comp_code,
				paid: false,
				amt: 1000,
				add_date: expect.any(String),
				paid_date: null,
			},
		});
	});

	test("It should return 404 for no-such-invoice", async function () {
		const response = await request(app)
			.put("/invoices/0")
			.send({ amt: 1000, paid: false });

		expect(response.status).toEqual(404);
	});

	test("It should return 500 for missing data", async function () {
		const response = await request(app)
			.put(`/invoices/${testInvoice.id}`)
			.send({});

		expect(response.status).toEqual(500);
	});
});

describe("DELETE /invoices/:id", function () {
	test("It should delete invoice", async function () {
		const response = await request(app).delete(`/invoices/${testInvoice.id}`);

		expect(response.body).toEqual({ status: "deleted" });
	});

	test("It should return 404 for no-such-invoices", async function () {
		const response = await request(app).delete("/invoices/0");

		expect(response.status).toEqual(404);
	});
});
