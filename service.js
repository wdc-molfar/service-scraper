 const { ServiceWrapper, AmqpManager, Middlewares, yaml2js } = require("@molfar/service-chassis")
 const { extend } = require("lodash")
 
 let service = new ServiceWrapper({
 	
 	config: null,
    health: true,

    //-------------- Add heartbeat exported method

         async onHeartbeat(data, resolve){
            resolve({})
        },
 
    //--------------------------------------------

 	
 	async onConfigure(config, resolve){
 		
 		const { execute } = require("./src/scraper")(config)

 		this.config = config


 		this.consumer = await AmqpManager.createConsumer(this.config.service.consume)

        await this.consumer.use([
            Middlewares.Json.parse,
            async (err, msg, next) => {
                console.log("Receive message", msg.content.schedule.name)
                next()
            },           
            Middlewares.Schema.validator(this.config.service.consume.message),
            Middlewares.Error.Log,
            // Middlewares.Error.BreakChain,

            async (err, msg, next) => {
                if(!err){
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

                    
                    let res = await execute(task)
                    console.log(`Send ${res.length} messages...\n\n`)
                    res.forEach( d => {
                        // if message then send to lang-detector else feedback into scheduler exchange
                    	if(d.type == "task"){
                            console.log("Create Nested Task")
                            this.feedback.send(extend({}, m, d))
                        } else {
                            this.publisher.send(d)    
                        }
                        
                    })
                } else {
                    console.log("Ignore message")
                }   

                msg.ack()
            }

        ])



 		this.publisher = await AmqpManager.createPublisher(this.config.service.produce)
        await this.publisher.use( Middlewares.Json.stringify )

        this.feedback = await AmqpManager.createPublisher(this.config.service.feedback)
        await this.feedback.use( Middlewares.Json.stringify )


 		resolve({status: "configured"})
	
 	},

	async onStart(data, resolve){
		
		this.consumer.start()
		
		resolve({status: "started"})	
 	
 	},

 	async onStop(data, resolve){
		
 		await this.consumer.close()
		await this.publisher.close()
        await this.feedback.close()
		resolve({status: "stoped"})
	
	}

 })
 
 
 service.start()