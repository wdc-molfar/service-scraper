const Scraper = require("@molfar/scanany")

const execute = async task => {
	try {
		let script = task.scraper.scanany.script
		let params = task.scraper.scanany.params
		let scraper = new Scraper()
		let result = await scraper.execute(script, params)
		return result
	} catch (e) {
		task.scraper.scanany.error = e.toString()
		return task
	}	
	
	
}

module.exports = execute
