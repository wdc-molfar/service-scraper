const mongo = require('mongodb').MongoClient


let options


const getCache = async source => {

	let client = await mongo.connect(options.url, {
	   useNewUrlParser: true,
	   useUnifiedTopology: true
	})

	let db = client.db(options.db)
	let cache = db.collection(options.collection.cache)
	let res = await cache.findOne({source})
	
	client.close()
	
	return res

}


const updateCache = async data => {
	let client = await mongo.connect(options.url, {
	   useNewUrlParser: true,
	   useUnifiedTopology: true
	})

	let db = client.db(options.db)
	let cache = db.collection(options.collection.cache)
	
    let res = await cache.replaceOne({source: data.source}, data, {upsert: true})
    return res
	
}


const init = config => {
	options = config.service.sources
	return {
		getCache,
		updateCache
	}
}


module.exports = init