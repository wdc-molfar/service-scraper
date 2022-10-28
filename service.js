 const { ServiceWrapper, AmqpManager, Middlewares, yaml2js } = require("@molfar/service-chassis")
 const { extend } = require("lodash")
 
 let service = new ServiceWrapper({
 	
 	config: null,
 	
 	async onConfigure(config, resolve){
 		
 		const { execute } = require("./src/scraper")(config)

 		this.config = config


 		this.consumer = await AmqpManager.createConsumer(this.config.service.consume)

        await this.consumer.use([
            Middlewares.Json.parse,
            Middlewares.Schema.validator(this.config.service.consume.message),
            Middlewares.Error.Log,
            Middlewares.Error.BreakChain,

            async (err, msg, next) => {
                let m = msg.content
                let params = yaml2js(m.scraper.scanany.params)
                let task = {
                	scraper:{
						scanany:{
							script: yaml2js(m.scraper.scanany.script),
							params: extend( {}, params || {} , { schedule: m.schedule } ) 
						}
					}
                }

                console.log("execute", task, task.scraper.scanany.params)
               	
                let res = await execute(task)
                console.log(`Send ${res.length} messages...`)
                res.forEach( d => {
                	this.publisher.send(d)
                })

                msg.ack()
            }

        ])



 		this.publisher = await AmqpManager.createPublisher(this.config.service.produce)
        
        await this.publisher.use( Middlewares.Json.stringify )

 		resolve({status: "configured"})
	
 	},

	async onStart(data, resolve){
		
		this.consumer.start()
		
		resolve({status: "started"})	
 	
 	},

 	async onStop(data, resolve){
		
 		await this.consumer.close()
		await this.publisher.close()
		resolve({status: "stoped"})
	
	}

 })
 
 
 service.start()

