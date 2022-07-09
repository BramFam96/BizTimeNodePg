const pw = require('./secret')
const { Client } = require('pg')

let db = new Client({
	database: process.env.NODE_ENV === 'test' ? 'biztime_test' : 'biztime',
	password: pw,
})

db.connect()

module.exports = db
