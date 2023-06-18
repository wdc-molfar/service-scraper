const SimplDB = require('simpl.db');
const db = new SimplDB();

const Cache = db.createCollection('cache');

const getCache = source => {
	let res = Cache.get(d => d.source == source)
	return res
}


const updateCache = async data => {
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

module.exports = {
		getCache,
		updateCache
	}