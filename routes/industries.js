const slugify = require('slugify')
const express = require('express')
const ExpressError = require('../expressError')
const router = express.Router()

const db = require('../db')

router.get('/', async (req, res, next) => {
	try {
		const results = await db.query(`
    SELECT i.tag,i.name, c.code as company FROM industries AS i
    LEFT JOIN companies_industries as ci ON i.tag = ci.ind_tag
    LEFT JOIN companies as c ON ci.comp_code = c.code`)

		return res.json({ industries: results.rows })
	} catch (e) {
		return next(e)
	}
})

router.post('/', async (req, res, next) => {
	try {
		const { name } = req.body
		const tag = slugify(name.slice(0, 3), { lower: true })

		const result = await db.query(
			`INSERT INTO industries (tag, name) 
       VALUES ($1, $2) RETURNING tag, name`,
			[tag, name]
		)
		return res.status(201).json({ industry: result.rows[0] })
	} catch (e) {
		return next(e)
	}
})
router.put('/:tag', async function (req, res, next) {
	try {
		const cResult = await db.query(
			`SELECT code FROM companies WHERE code = $1
      `,
			[req.body.code]
		)
		if (cResult.rows.length === 0) {
			throw new ExpressError('No such company!', 404)
		}
		const results = await db.query(
			`INSERT INTO companies_industries (comp_code,ind_tag) VALUES ($1,$2)`,
			[req.body.code, req.params.tag]
		)

		return res.json({message:'success'})
	} catch (err) {
		return next(err)
	}
})
module.exports = router
