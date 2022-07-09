const express = require('express')
const ExpressError = require('../expressError')
const router = express.Router()
const db = require('../db')

const dataExists = (data) => {
	if (data.length === 0) {
		return false
	} else {
		return true
	}
}
router.get('/', async (req, res, next) => {
	try {
		const results = await db.query('SELECT * FROM invoices')
		return res.json({ invoices: results.rows })
	} catch (e) {
		return next(e)
	}
})

router.get('/:id', async (req, res, next) => {
	try {
		const results = await db.query('SELECT * FROM invoices WHERE id = $1', [
			req.params.id,
		])
		if (dataExists(results.rows)) {
			return res.json({ invoices: results.rows[0] })
		} else {
			throw new ExpressError(`Can't find invoice with id of ${id}`, 404)
		}
	} catch (e) {
		return next(e)
	}
})

router.post('/', async (req, res, next) => {
	try {
		const results = await db.query(
			'INSERT INTO invoices (comp_code, amt) VALUES ($1, $2) RETURNING id, comp_code, amt, paid, add_date, paid_date',
			[comp_code, amt]
		)
		return res.status(201).json(results.rows[0])
	} catch (e) {
		return next(e)
	}
})

router.put('/:id', async (req, res, next) => {
	try {
    // Getting data
    // #######################################################
    // Get params
		const { amt, paid } = req.body
		const { id } = req.params
    // Get invoice 
		const invoiceData = await db.query(
		  `SELECT * FROM invoices 
       WHERE id = $1`,[id])
    // Check invoice exists:
		if (dataExists(invoiceData.rows)) {
			throw new ExpressError(`Can't find invoice with id of ${id}`, 404)
		}
// ##########################################################
// Logic
		let paidDate = invoiceData.rows[0].paid_date

		if (!paidDate && data.paid) {
			paidDate = new Date()
		} else if (!paid) {
			paidDate = null
		} else {
			paidDate = paidDate
		}

		let result = await db.query(
			`UPDATE invoices
       SET amt = $1, paid = $2, paid_date = $3
       WHERE id=$4
       RETURNING id, comp_code, amt, paid, add_date, paid_date
      `,
			[amt, paid, paidDate, id]
		)
		return res.json({ invoice: result.rows[0] })
	} catch (e) {
		return next(e)
	}
})
module.exports = router
