const execute = require("../src/scraper")

const test = async () => {
	const YAML = require("js-yaml")
	const path = require("path")
	
	let filepath = path.resolve("./test/yaml/script.yml")
	let source = require("fs").readFileSync(filepath).toString().replace(/\t/gm, " ")
	let script = YAML.load(source)

	filepath = path.resolve("./test/yaml/params.yml")
	source = require("fs").readFileSync(filepath).toString().replace(/\t/gm, " ")
	let params = YAML.load(source)

	let task = {
		scraper:{
			scanany:{
				instance: require("uuid").v4(),
				script,
				params
			}
		}
	}

	console.log("TEST")
	console.log( await execute(task) )
}

test()
