const Scraper = require("@molfar/scanany")
const { extend } = require("lodash")
const cacheDb = require("./simpledb")	
	
const {  Middlewares } = require("@molfar/service-chassis")

let config

const executeScanany = async task => {
	try {
		let script = task.scraper.scanany.script
		let params = task.scraper.scanany.params
		let scraper = new Scraper()
		let result = await scraper.execute(script, params)
		return result
	} catch (e) {
		return {
			error: e.toString()
		}	
	}	
}


const execute = async task => {
	try {
		
		console.log(task.scraper.scanany.params.schedule.name)
		
		const schedule = task.scraper.scanany.params.schedule
		let cachedData = await cacheDb.get(schedule.source)
		cachedData.name = task.scraper.scanany.params.schedule.name
		cachedData.params = task.scraper.scanany.params.task


		let scrapedData = await executeScanany(task)

		if (scrapedData.error){
			
			cachedData.timeline.push({date: new Date(), stage:"scanany", error: scrapedData.error})
			await cacheDb.update(cachedData)
			console.log(`ERROR stage scanany: scrapedData.error`)
			return []
		}

	
		let scraped_md5 = scrapedData.map(d => d.scraper.message.md5)
		let cached_md5 = cachedData.messages.map( d => {
			let res = d 
			return res
		})
		
		let outputData = scrapedData
							.filter( d => !cachedData.messages.includes(d.scraper.message.md5))
							.map( d => extend( {}, { schedule }, d ))
						
		let validator = Middlewares.Schema.validator(config.service.produce.message)
		
		outputData.forEach( m => {
			try {
				validator( null, {content: m}, () => {})
			} catch (e) {
				cachedData.timeline.push({date: new Date(), stage:"validation", message:m, error:e.toString()})
				m.noValidate = true
				console.log("ERROR stage validation", e.toString())
			}	
		})
		
		outputData = outputData.filter( d => !d.noValidate)	

		cachedData.messages = scraped_md5.map(d => d)
		
		cachedData.timeline.push({
			date: new Date(),
			version:"1.0.1",
			scrapedMessages: scrapedData.length,
			newMessages: outputData.length,
			oldMessages: scrapedData.length - outputData.length,
			// scraped_md5,
			// cached_md5
		})

		if( cachedData.timeline.length > 50) cachedData.timeline.shift()
		
		await cacheDb.update(cachedData)

		return outputData
	
	} catch (e) {
		console.log(`ERROR service: ${e.toString()}`)
		return []
	}	

}


module.exports =  conf => {
	config = conf
	return {
		execute
	}	 
}	
