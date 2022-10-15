 const { ServiceWrapper, createMonitor } = require("@molfar/service-chassis")


 let service = new ServiceWrapper({
 	
 	config: null,
 	
 	async onConfigure(config, resolve){
 		
 		this.config = config
		resolve({status: "configured"})
	
 	},

	async onStart(data, resolve){
		
		this.monitor = await createMonitor (this.config._instance_id, this.config.service.monitoring)
        this.monitor.start()
		resolve({status: "started"})	
 	
 	},

 	async onStop(data, resolve){
	
		resolve({status: "stoped"})
	
	}

 })
 
 
 service.start()

