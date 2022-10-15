const fs = require("fs")
const path = require("path")

const { Container } = require("@molfar/csc")
const { yaml2js } = require("@molfar/amqp-client")


const servicePath = path.resolve(__dirname, "./service.js")
const config = yaml2js(fs.readFileSync(path.resolve(__dirname, "./service.msapi.yaml")).toString())


const delay = interval => new Promise( resolve => {
	setTimeout( () => {
		resolve()
	}, interval )	
}) 

const run = async () => {
	console.log("Test run @molfar/service-dummy")
	
	const container = new Container()

	container.hold(servicePath, "@molfar/service-dummy")
	const service = await container.startInstance(container.getService(s => s.name == "@molfar/service-dummy"))
	let res = await service.configure(config)
	console.log("Configure", res)
	res = await service.start()
	console.log("Start", res)
	console.log("Running... 10s")
	await delay(10000) 

	res = await service.stop()
	container.terminateInstance(service)
	
}

run()