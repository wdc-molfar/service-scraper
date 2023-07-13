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
		error: []
	})

	delete res._id
	return res
}	 

const execute = async task => {
	
	const schedule = task.scraper.scanany.params.schedule
	
	let scrapedData = await executeScanany(task)
	let cachedData = cacheDb.getCache(schedule.source)
	cachedData = normalizeCachedData( schedule, cachedData )



	if (scrapedData.error){
		cachedData.error = [ {at: newDate(), stage:"scanany", error: scrapedData.error} ]
		// cachedData.messages = []
		cacheDb.updateCache(cachedData)
		return []
	}

	
	let outputData = scrapedData
						.filter( d => !cachedData.messages.includes(d.scraper.message.md5))
						.map( d => extend( {}, { schedule }, d ))


		let validator = Middlewares.Schema.validator(config.service.produce.message)
		
		outputData.forEach( m => {
			try {
				validator( null, {content: m}, () => {})
			} catch (e) {
				cachedData.error.push({at: newDate(), stage:"validation", message:m, error:e.toString()})
				m.noValidate = true
			}	
		})
	
	outputData = outputData.filter( d => !d.noValidate)	

	let newCachedData = {
		source: schedule.source,
		messages: scrapedData.map( d => d.scraper.message.md5),
		timeline: cachedData.timeline,
		error: cachedData.error
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
	cacheDb = require("./simpledb")	
	return {
		execute
	}	 
}	
