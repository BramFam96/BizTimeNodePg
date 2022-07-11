// Set env to test prior to loading db;
process.env.NODE_ENV = 'test'

// npm packages
const request = require('supertest')

// app imports
const app = require('../app')
const db = require('../db')
let testC
beforeEach(async () => {
	await db.query('DELETE FROM invoices')
	await db.query('DELETE FROM companies')
	await db.query("SELECT setval('invoices_id_seq', 1, false)")
	let data = await db.query(`
	INSERT INTO companies (code, name, description)
	VALUES ('google', 'Google', 'Indexers of the World.')
	RETURNING code, name, description`)

	await db.query(
		`INSERT INTO invoices (comp_code, amt, paid, add_date, paid_date)	VALUES 
	('google', 100, false, '2020-01-01', null),
	('google', 200, true, '2020-01-01', '2020-02-07');
	`
	)
	testC = data.rows[0]
})
afterEach(async () => {
	await db.query('DELETE FROM invoices')
	await db.query('DELETE FROM companies')
})
/** GET /companies - returns `{companies: [company, ...]}` */

describe('GET /companies', function () {
	test('Gets a list of all companies', async function () {
		const response = await request(app).get(`/companies`)
		expect(response.statusCode).toEqual(200)
		expect(response.body).toEqual({
			companies: [
				{
					code: testC.code,
					name: testC.name,
					description: testC.description,
				},
			],
		})
	})
})
// end

/** GET /companies/[id] - return data about one company: `{company: company}` */

describe('GET /companies/:code', function () {
	test('Gets data on one company', async function () {
		const response = await request(app).get(`/companies/google`)
		expect(response.statusCode).toEqual(200)
		expect(response.body).toEqual({
			company: {
				code: 'google',
				name: 'Google',
				description: 'Indexers of the World.',
				invoices: [
					{ amt: 100, id: expect.any(Number), paid: false },
					{ amt: 200, id: expect.any(Number), paid: true },
				],
			},
		})
	})

	test('Responds to invalid code with 404', async function () {
		const response = await request(app).get(`/companies/0`)
		expect(response.statusCode).toEqual(404)
	})
})
// end

// /** POST /companies - create company from data; return `{company: company}` */

describe('POST /companies', function () {
	test('Creates a new company', async () => {
		const response = await request(app).post(`/companies`).send({
			name: 'Netflix',
			description: 'The streaming kings.',
		})

		expect(response.statusCode).toEqual(201)
		expect(response.body).toEqual({
			company: {
				code: 'netflix',
				name: 'Netflix',
				description: 'The streaming kings.',
			},
		})
	})
})
// end

/** PATCH /companies/[id] - update company; return `{company: company}` */

describe('PATCH /companies/:id', function () {
	test('Updates a single company', async function () {
		const response = await request(app).put(`/companies/google`).send({
			name: 'Google',
			description: 'masters of the universe',
		})
		expect(response.statusCode).toEqual(200)
		expect(response.body).toEqual({
			company: {
				code: 'google',
				name: 'Google',
				description: 'masters of the universe',
			},
		})
	})

	test('Responds with 404 if given bad code', async function () {
		const response = await request(app).patch(`/companies/0`)
		expect(response.statusCode).toEqual(404)
	})
})
// end

/** DELETE /companies/[id] - delete company,
 *  return `{message: "company deleted"}` */

describe('DELETE /companies/:code', function () {
	test('Deletes a single a company', async function () {
		const response = await request(app).delete(`/companies/google`)
		expect(response.statusCode).toEqual(200)
		expect(response.body).toEqual({ status: 'deleted!' })
	})
})
// end

afterAll(async function () {
	// close db connection
	await db.end()
})
