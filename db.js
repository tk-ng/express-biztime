/** Database setup for BizTime. */
const { Client } = require("pg");

let DB_URI =
	process.env.NODE_ENV === "test"
		? "postgresql:///biztime_test"
		: "postgresql:///biztime";

const db = new Client({ connectionString: DB_URI });

db.connect();

module.exports = db;
