const slugify = require('slugify')
const express = require('express')
const ExpressError = require('../expressError')
const router = express.Router()

const db = require('../db')

router.get('/', async (req, res, next) => {
	try {
		const results = await db.query(`SELECT * FROM companies`)
		return res.json({ companies: results.rows })
	} catch (e) {
		return next(e)
	}
})
router.get('/:code', async (req, res, next) => {
	try {
		const cResults = await db.query(
			`SELECT c.code, c.name, c.description, i.name as industries FROM companies AS c
			LEFT JOIN companies_industries as ci ON c.code = ci.comp_code
			LEFT JOIN industries as i ON ci.ind_tag = i.tag
			WHERE code = $1;`,
			[req.params.code]
		)
		// Check resource:
		if (cResults.rows.length === 0) {
			throw new ExpressError(`Can't find company`, 404)
		}
		// return res.send(cResults.rows)

		// Find related invoices
		const iResults = await db.query('SELECT * FROM invoices WHERE comp_code=$1', [
			req.params.code,
		])

		let data = cResults.rows[0]
		data.industries = cResults.rows.map((r) => r.industries)
		data.invoices = iResults.rows.map((i) => ({
			id: i.id,
			amt: i.amt,
			paid: i.paid,
		}))

		return res.send({ company: data })
	} catch (e) {
		return next(e)
	}
})

router.post('/', async (req, res, next) => {
	try {
		const { name, description } = req.body
		const code = slugify(name, { lower: true })

		const result = await db.query(
			`INSERT INTO companies (code, name, description) 
       VALUES ($1, $2, $3) RETURNING code, name, description`,
			[code, name, description]
		)
		return res.status(201).json({ company: result.rows[0] })
	} catch (e) {
		return next(e)
	}
})

router.put('/:code', async (req, res, next) => {
	try {
		const { name, description } = req.body
		const results = await db.query(
			`UPDATE companies SET name=$1, description=$2 
       WHERE code=$3 RETURNING code, name, description`,
			[name, description, req.params.code]
		)
		if (results.rows.length === 0) {
			throw new ExpressError(`Can't update company with code of ${code}`, 404)
		}
		return res.send({ company: results.rows[0] })
	} catch (e) {
		return next(e)
	}
})

router.delete('/:code', async (req, res, next) => {
	try {
		let result = await db.query('SELECT * from companies where code = $1', [
			req.params.code,
		])
		if (result.rows.length === 0) {
			throw new ExpressError(`Can't find company with code ${code}`, 404)
		}
		await db.query('DELETE FROM companies WHERE code = $1', [req.params.code])
		return res.send({ status: 'deleted!' })
	} catch (e) {
		return next(e)
	}
})

module.exports = router
