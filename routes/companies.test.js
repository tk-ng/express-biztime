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

describe("GET /companies", function () {
	test("Get a list of companies", async function () {
		const res = await request(app).get("/companies");
		expect(res.statusCode).toBe(200);
		expect(res.body).toEqual({
			companies: [testCompany],
		});
	});
});

describe("GET /comapanies/:code", function () {
	test("Get a single company", async function () {
		const res = await request(app).get(`/companies/${testCompany.code}`);
		expect(res.statusCode).toBe(200);
		expect(res.body).toEqual({ company: testCompany });
	});
	test("Responds with 404 for getting with invalid code", async function () {
		const res = await request(app).get(`/companies/invalid`);
		expect(res.statusCode).toBe(404);
	});
});

describe("POST /companies", function () {
	test("Create a single company", async function () {
		const res = await request(app)
			.post("/companies")
			.send({ name: "pineapple", description: "Under the sea" });
		expect(res.statusCode).toBe(201);
		expect(res.body).toEqual({
			company: {
				code: expect.any(String),
				name: "pineapple",
				description: "Under the sea",
			},
		});
	});
	test("Responds with 400 for invalid req.body", async function () {
		const res = await request(app).post("/companies").send({});
		expect(res.statusCode).toBe(400);
	});
	test("Responds with 403 for submitting an existing name", async function () {
		const res = await request(app)
			.post("/companies")
			.send({ name: "Apple", description: "testing" });
		expect(res.statusCode).toBe(403);
	});
});

describe("PUT /companies/:code", function () {
	test("It should update a company", async function () {
		const response = await request(app)
			.put(`/companies/${testCompany.code}`)
			.send({ name: "new name", description: "new desc" });

		expect(response.body).toEqual({
			company: {
				code: testCompany.code,
				name: "new name",
				description: "new desc",
			},
		});
	});

	test("It should return 404 for invalid company code", async function () {
		const response = await request(app)
			.put("/companies/invalid")
			.send({ name: "new name", description: "new desc" });

		expect(response.status).toEqual(404);
	});

	test("It should return 400 for missing data", async function () {
		const response = await request(app)
			.put(`/companies/${testCompany.code}`)
			.send({});

		expect(response.status).toEqual(400);
	});
});

describe("DELETE /", function () {
	test("It should delete company", async function () {
		const response = await request(app).delete(
			`/companies/${testCompany.code}`
		);

		expect(response.body).toEqual({ status: "deleted" });
	});

	test("It should return 404 for invalid company code", async function () {
		const response = await request(app).delete("/companies/invalid");

		expect(response.status).toEqual(404);
	});
});
