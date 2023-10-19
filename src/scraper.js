const Scraper = require("@molfar/scanany")
const { extend, isArray, drop, uniqBy } = require("lodash")
const cacheDb = require("./simpledb")	
const moment = require("moment")

const {  Middlewares } = require("@molfar/service-chassis")

let config

const date = () => moment().format("YYYY-MM-DD HH:mm:ss")


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
		
		console.log(`${date()} INFO: Scrap: ${task.scraper.scanany.params.schedule.name} \n ${JSON.stringify(task.scraper.scanany.params, null, " ")}`)
		
		const schedule = task.scraper.scanany.params.schedule
		let cachedData = await cacheDb.get(schedule.source)
		cachedData.name = task.scraper.scanany.params.schedule.name
		cachedData.params = task.scraper.scanany.params.task


		let scrapedData = await executeScanany(task)

		
		if (scrapedData.error){
			
			cachedData.timeline.push({date: new Date(), stage:"scanany", error: scrapedData.error})
			await cacheDb.update(cachedData)
			console.log(`${date()} ERROR: Stage scanany: ${scrapedData.error}`)
			return []
		}

		scrapedData = (isArray(scrapedData)) ? scrapedData : [scrapedData]
		if(scrapedData[0] && scrapedData[0].type == "task") return scrapedData

	
		let scraped_md5 = scrapedData.map(d => d.scraper.message.md5)
		let cached_md5 = cachedData.messages.map( d => {
			let res = d 
			return res
		})
		
		console.log(`${date()} INFO: Scraped:\n ${scraped_md5.join("\n")}\n`)
		console.log(`${date()} INFO: Cached:\n ${cached_md5.join("\n")}\n`)
				


		let outputData = scrapedData
							.filter( d => !cachedData.messages.includes(d.scraper.message.md5))
							.map( d => extend( {}, { schedule }, d ))

		console.log(`${date()} INFO: New:\n ${outputData.map(d => d.scraper.message.md5).join("\n")}\n`)
								
		
		let validator = Middlewares.Schema.validator(config.service.produce.message)
		
		outputData.forEach( m => {
			try {
				validator( null, {content: m}, () => {})
			} catch (e) {
				cachedData.timeline.push({date: new Date(), stage:"validation", message:m, error:e.toString()})
				m.noValidate = true
				console.log(`${date()} ERROR: stage validation: ${e.toString()}`)
			}	
		})
		
		outputData = outputData.filter( d => !d.noValidate)	

		console.log(`${date()} INFO: Valid:\n ${outputData.map(d => d.scraper.message.md5).join("\n")}\n`)
		
		cachedData.messages = uniqBy(cachedData.messages.concat(scraped_md5.map(d => d)))
		cachedData.messages = drop(cachedData.messages, (cachedData.messages > 150) ? cachedData.messages.length-150 : 0)
		
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
		console.log(`${date()} ERROR: service: ${e.toString()}`)
		return []
	}	

}


module.exports =  conf => {
	config = conf
	return {
		execute
	}	 
}	
