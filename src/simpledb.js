const SimplDB = require('simpl.db');
const db = new SimplDB();

const Cache = db.createCollection('cache');
let options

const getCache = source => {

	// let client = await mongo.connect(options.url, {
	//    useNewUrlParser: true,
	//    useUnifiedTopology: true
	// })

	// let db = client.db(options.db)
	// let cache = db.collection(options.collection.cache)
	// let res = await cache.findOne({source})
	
	// client.close()
	
	let res = Cache.get(d => d.source == source)
	return res

}


const updateCache = async data => {
	// let client = await mongo.connect(options.url, {
	//    useNewUrlParser: true,
	//    useUnifiedTopology: true
	// })

	// let db = client.db(options.db)
	// let cache = db.collection(options.collection.cache)
	
 //    let res = await cache.replaceOne({source: data.source}, data, {upsert: true})
    
    let res 
    let f = Cache.get(d => d.source == data.source)
    if(!f){
    	res = Cache.create(data)
    } else {
    	res = Cache.update(
    		d => {
    			d = data
    		},
    		t => t.source == data.source
    	)
    }

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