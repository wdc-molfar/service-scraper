const Scraper = require("@molfar/scanany")
const { extend } = require("lodash")

const {  Middlewares } = require("@molfar/service-chassis")


let cacheDb
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


const normalizeCachedData = (schedule, data) => {
	let res = (data || {
		source: schedule.source,
		messages: [],
		timeline:[],
		error: null
	})

	delete res._id
	return res
}	 

const execute = async task => {
	
	const schedule = task.scraper.scanany.params.schedule
	
	let scrapedData = await executeScanany(task)

	let cachedData = await cacheDb.getCache(schedule.source)
	
	cachedData = normalizeCachedData( schedule, cachedData )


	if (scrapedData.error){
		cachedData.error = scrapedData.error
		cachedData.messages = []
		await cacheDb.updateCache(cachedData)
		return []
	}

	
	let outputData = scrapedData
						.filter( d => !cachedData.messages.includes(d.scraper.message.md5))
						.map( d => extend( {}, { schedule }, d ))


	try {
		let validator = Middlewares.Schema.validator(config.service.produce.message)
		outputData.forEach( m => {
			validator( null, {content: m}, () => {})
		})
	} catch (e) {
		cachedData.error = e.toString()
		cachedData.messages = []
		console.log("ERROR >> ", cachedData)
		await cacheDb.updateCache(cachedData)
		return []
	}



	let newCachedData = {
		source: schedule.source,
		messages: scrapedData.map( d => d.scraper.message.md5),
		timeline: cachedData.timeline,
		error: null
	}

	newCachedData.timeline.push({
		date: new Date(),
		newMessages: outputData.length,
		oldMessages: scrapedData.length - outputData.length
	})

	if( newCachedData.timeline.length > 20) newCachedData.timeline.shift()
	

	await cacheDb.updateCache(newCachedData)

	return outputData

}


module.exports =  conf => {
	config = conf
	cacheDb = require("./mongodb")(config)
	return {
		execute
	}	 
}	
