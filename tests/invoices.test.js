// connect to right DB --- set before loading db.js
process.env.NODE_ENV = 'test'

const request = require('supertest')

const app = require('../app')
const db = require('../db')

// before each test, clean out data
beforeEach(async () => {
	await db.query('DELETE FROM invoices')
	await db.query('DELETE FROM companies')
	await db.query("SELECT setval('invoices_id_seq', 1, false)")
	await db.query(`
	INSERT INTO companies (code, name, description)
	VALUES ('google', 'Google', 'Indexers of the World.')`)

	await db.query(
		`INSERT INTO invoices (comp_code, amt, paid, add_date, paid_date)	VALUES 
	('google', 100, false, '2020-01-01', null),
	('google', 200, true, '2020-01-01', '2020-02-07');
	`
	)
})
afterEach(async () => {
	// Attempting to clear spontaneous test destroying errors
	await db.query('DELETE FROM invoices')
	await db.query('DELETE FROM companies')
})

describe('GET /', function () {
	test('It should respond with array of invoices', async function () {
		const response = await request(app).get('/invoices')
		expect(response.body).toEqual({
			invoices: [
				{ id: expect.any(Number), comp_code: 'google', amt: 100 },
				{ id: expect.any(Number), comp_code: 'google', amt: 200 },
			],
		})
	})
})

// describe('GET /1', function () {
// 	test('Get full invoice info', async function () {
// 		const response = await request(app).get('/invoices/1')
// 		expect(response.body).toEqual({
// 			invoice: {
// 				id: expect.any(Number),
// 				comp_code: 'google',
// 				amt: 100,
// 				paid: false,
// 				add_date: '2020-01-01T06:00:00.000Z',
// 				paid_date: null,
// 			},
// 		})
// 	})

// 	test('It should return 404 for no-such-invoice', async function () {
// 		const response = await request(app).get('/invoices/999')
// 		expect(response.status).toEqual(404)
// 	})
// })

// // end

// describe('POST /invoices', function () {
// 	test('Adds a new invoice', async function () {
// 		const response = await request(app)
// 			.post('/invoices')
// 			.send({ comp_code: 'google', amt: 400 })

// 		expect(response.statusCode).toEqual(201)
// 		expect(response.body).toEqual({
// 			invoice: {
// 				id: 3,
// 				comp_code: 'google',
// 				amt: 400,
// 				add_date: '2022-07-10T05:00:00.000Z',
// 				paid: false,
// 				paid_date: null,
// 			},
// 		})
// 	})
// })

// describe('PUT /', function () {
// 	test('It should update an invoice', async function () {
// 		const response = await request(app)
// 			.put('/invoices/1')
// 			.send({ amt: 1000, paid: false })
// 		expect(response.statusCode).toEqual(200)
// 		expect(response.body).toEqual({
// 			invoice: {
// 				id: 1,
// 				comp_code: 'google',
// 				paid: false,
// 				amt: 1000,
// 				add_date: expect.any(String),
// 				paid_date: null,
// 			},
// 		})
// 	})

// 	test('It should return 404 for no-such-invoice', async function () {
// 		const response = await request(app).put('/invoices/9999').send({ amt: 1000 })
// 		expect(response.status).toEqual(404)
// 	})

// 	test('It should return 500 for missing data', async function () {
// 		const response = await request(app).put('/invoices/1').send({})
// 		expect(response.status).toEqual(500)
// 	})
// })
// end

// describe('DELETE /:id', function () {
// 	test('It should delete invoice', async function () {
// 		const response = await request(app).delete('/invoices/1')

// 		expect(response.body).toEqual({ success: `invoice deleted` })
// 	})

// 	test('It should return 404 for no-such-invoices', async function () {
// 		const response = await request(app).delete('/invoices/999')

// 		expect(response.status).toEqual(404)
// 	})
// })
afterAll(async () => {
	await db.end()
})
