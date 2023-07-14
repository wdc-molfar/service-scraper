const cacheDb = require("./src/simpledb")
const { extend } = require("lodash")

const run = async () => {

	let d = []

	for( let i = 0; i < 10; i++){
		
		d.push(i)
		
		if(d.length > 5){
			d.shift()
		}
		console.log(d)
		
		let cachedData = await cacheDb.get("1")

		cachedData.timeline.push({
			date: new Date(),
			oldData: cachedData.messages.map( d => d),
			newData: d.map( d => d),
		})
		
		cachedData.messages = d.map( d => d)
		
		await cacheDb.update(cachedData)
	}

	d = []

	for( let i = 0; i < 10; i++){
		
		d.push(i*10)
		
		if(d.length > 5){
			d.shift()
		}
		console.log(d)
		
		let cachedData = await cacheDb.get("2")

		cachedData.timeline.push({
			date: new Date(),
			oldData: cachedData.messages.map( d => d),
			newData: d.map( d => d),
		})
		
		cachedData.messages = d.map( d => d)
		
		await cacheDb.update(cachedData)
	}

}

run()

