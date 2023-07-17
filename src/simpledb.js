const SimplDB = require('simpl.db');
const db = new SimplDB();
const { extend } = require("lodash")

const Cache = db.createCollection('cache');


const get = async source => {
	
    let res = await Cache.get(d => d.source == source)
    
    if(res){
        return res
    }

    res = await Cache.create({
        source,
        name: "",
        params: {},
        messages: new Array(0),
        timeline: new Array(0)
    })
    
    res = await Cache.get(d => d.source == source)

    return res 
}


const update = async data => {

    if(data.save){
        await data.save()
        return
    } else {
        await Cache.update(
             d => {
                 d = data
             },
             t => t.source == data.source
         )
    }
    
}

module.exports = {
		get,
		update
	}