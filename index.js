var child_process = require('child_process')
var events = require('events');
var fs = require('fs');
var mplayer = require('./node_modules/node-omxplayer')



var StringDecoder = require('string_decoder').StringDecoder

process.on('SIGHUP',  function(){ console.log('CLOSING [SIGHUP]'); process.emit("SIGINT"); })
process.on('SIGINT',  function(){
	 console.log('CLOSING [SIGINT]');
	 for (var i = 0; i < pids.length; i++) {
		console.log("Killing: " + pids[i])
		process.kill(-pids[i])
 	}
	 process.exit(0);
 })
process.on('SIGQUIT', function(){ console.log('CLOSING [SIGQUIT]'); process.emit("SIGINT"); })
process.on('SIGABRT', function(){ console.log('CLOSING [SIGABRT]'); process.emit("SIGINT"); })
process.on('SIGTERM', function(){ console.log('CLOSING [SIGTERM]'); process.emit("SIGINT"); })

var pids = new Array();

function cleanPID(pid) {
	var pid = pid || false
	for (var i = 0; i < pids.length; i++) {
		if ( pids[i] == pid ) pids.splice(i, 1)
	}
}

var file = process.argv[2] - 1 || 0

var assets_folder = './assets/assets'
var assets_placeholder_folder = './assets/assets_placeholder'

// var assets = new Array();
var assets = fs.readdirSync('./assets/assets');
// var assets_placeholder = new Array();
var assets_placeholder = fs.readdirSync('./assets/assets_placeholder');

var distance_reloader = null

var distances = fs.readFileSync('./assets/distances.json')
distances = JSON.parse(distances)

console.log(distances)

distance_reloader= setInterval(function(){

	distances = fs.readFileSync('./assets/distances.json')
	distances = JSON.parse(distances)

	// console.log(distances)

}, 5000)

console.log("assets: " + assets)
console.log("assets_placeholder: " + assets_placeholder)
// assets.push("/home/manjaro/Videos/AI_placeholders/video.mp4")
// assets_placeholder.push("/home/manjaro/Videos/AI_placeholders/placeholder.mp4")




var arduino = {

	reader:"",
	port:"",
	active:false,
	busy:false,
	values: {
		first: new Array(),
		second: new Array(),
		third: new Array()
	},
	last_poll: new Date(),
  poll_int: 2,
	min_distance: distances,
	poll_length:3

}

console.log( arduino.values )

var player = {

	instance: "",
	active: false,
	asset: assets_folder + '/' + assets[file],
	safety: null,
	timeout: null,
	placeholder: null

}




function ls(search) {
	var search=search || false
	var com = child_process.spawn("bash", new Array("-c", "ls " + search), {detached: true})
	var decoder = new StringDecoder('utf-8')

	pids.push(com["pid"])

	com.stdout.on('data', (data) => {

	  var string = decoder.write(data)
		string=string.split(/\r?\n/)

		for( var i = 0; i < string.length; i++) {


			if ( string[i].length > 0 && ! arduino.reader ) {
				console.log(search + " found.")
			// if ( string[i].length > 0 && typeof ttys[string[i]] === "undefined") {
				console.log(string[i])
				arduino.port = string[i]

			}

		}

		if ( arduino.port && ! arduino.reader ) arduino.reader = cat ( arduino )

	});

	//not final state!
	com.stderr.on('data', (data) => {
	  // console.log(`stderr: ${data}`)
	  // var string = decoder.write(data)
		// string = string.replace(/\r?\n$/, "")
		// if ( string.match(/^ls: cannot access/)) console.log(search + " not found")
		// return false
	});

	com.on('close', (code) => {
		cleanPID(com["pid"])

		if (code == 0) {

			// console.log("exit code: 0")
			// for ( i in ttys ) {
			//
			// 	if ( ! ttys[i]["catstarted"] ) {
			//
			// 		console.log(ttys[i])
			// 		cat(ttys[i])
			//
				}

			// else "nothing to cat"
		else {

			console.log(search + ' not to be found.')

			if ( arduino.port || arduino.reader ) {

				console.log('killing running reader.')

				arduino.reader.kill()
				arduino.reader = ""
				arduino.port = ""
				arduino.active = false
				arduino.values.first = new Array()
				arduino.values.second = new Array()
				arduino.values.third = new Array()
				arduino.busy = false

				// console.log("")

			}


		}

	});

	return com;
}


function cat(arduino) {

	var arduino = arduino || false
	if ( ! arduino ) return false

	var decoder = new StringDecoder('utf8')
	var string = ""

	var stty = child_process.spawn("bash", new Array("./ttySetup.sh", arduino.port ), {detached: true})
	var cat = child_process.spawn("bash", new Array("./ttyReader.sh", arduino.port ), {detached: true})
	var ready

	// pids.push(stty["pid"])
	//
	// stty.on('close', function(){
	//
	// 	cleanPID(stty["pid"])
	//
	// })

	pids.push(cat["pid"])

	//periodical checking until the device respondes
	function echoReady() {

		 ready = child_process.spawn("bash", new Array("./ttyReady.sh", arduino.port ), {detached: true})

		 console.log(arduino.port + " was sent 'ready?'")

		 pids.push(ready["pid"])

		 ready.on('close', function(){

			 cleanPID(ready["pid"])

		 })
	}

	//echoReady()

	var echo = setInterval(function(){
		echoReady()
	}, 500)

	cat.stdout.on('data', (data) => {

		string = decoder.write(data)

		string=string.split(/\r?\n/)

		for( var i = 0; i < string.length; i++) {

			// if ( string[i] != "" ) console.log(string[i])
			// console.log( string[i].length > 0 && string[i].match(/^system:connected/) != null && ! arduino.active )

			if ( string[i].length > 0 && string[i].match(/^system:connected*/) && ! arduino.active ) {

				arduino.active = true

				clearInterval(echo)

				console.log( arduino.port + " is connected")
			}

			else if ( string[i].length > 0 && string[i].match(/^value:/) && arduino.active ) {

				var date = new Date();

				// console.log( "poll interval: " + ( ( date - arduino.last_poll ) >= arduino.poll_int ) )

			 	var split = string[i].split(/:/)

				if ( split.length == 4 && split[0] == "value" && ( ( date - arduino.last_poll ) >= arduino.poll_int ) && ! arduino.busy ) {

					arduino.busy = true;

					// console.log(arduino.values.first.length >= 5 && arduino.values.second.length >= 5 && arduino.values.third.length >= 5)

					arduino.values.first.push( parseFloat( split[1] ) )
					arduino.values.second.push( parseFloat( split[2]) )
					arduino.values.third.push( parseFloat( split[3] ) )

					// console.log(arduino.values)

					if ( arduino.values.first.length >= arduino.poll_length && arduino.values.second.length >= arduino.poll_length && arduino.values.third.length >= arduino.poll_length ) {

						var average = {

							first: 0,
							second: 0,
							third: 0

						}

						for ( var i = 0; i < 5; i++ ) {

							value1 = arduino.values.first[i]
							value2 = arduino.values.second[i]
							value3 = arduino.values.third[i]

							if (value1 < 3) value1 = 500
							if (value2 < 3) value2 = 500
							if (value3 < 3) value3 = 500

							average.first = average.first + value1
							average.second = average.second + value2
							average.third = average.third + value3

						}



						average.first = average.first / arduino.poll_length
						average.second = average.second / arduino.poll_length
						average.third = average.third / arduino.poll_length

						arduino.values.first.shift()
						arduino.values.second.shift()
						arduino.values.third.shift()

						console.log( Date.now() +":" + average.first +":"+ average.second +":"+ average.third )

						if ( ( average.first < arduino.min_distance.left ) || ( average.second < arduino.min_distance.middle ) || ( average.third < arduino.min_distance.right ) ) {

							console.log("trigger.")
							if ( player.active == false ) {


								player.active = true

								setupPlayer("video")
								// console.log(player)
								//
								// console.log(" !! bang !! " + player.asset )
								// setTimeout(function(){
								//
								// 	player.active = false
								//
								// 	}, 5000)

								}



						}

					}


					arduino.last_poll = date
					arduino.busy = false



				}


			}


			else if ( string[i].length > 0 && string[i].match(/^system:encoders/) && arduino.active ) {

			 	var encoders = string[i].replace(/^system:encoders:/, "")


			}

			else if ( string[i].length > 0 && string[i].match(/^encoder/) && arduino.active ) {
				// console.log("real value: " + string[i])
				var split = string[i].split(/:/)


				}


			}


		// console.log(output)
	});

	cat.stderr.on('data', (data) => {

	  console.log(`stderr: ${data}`)

	});

	cat.on('close', (code) => {

		console.log( arduino.port + " closed.")
		// ready.on('close', function(){
		// 	cleanPID(cat["pid"])
		// })

		clearInterval(echo)


		// console.log("kill ttys")
		// console.log(tty["tty"] + " was disconnected. killing all players on this node.")
		// delete ttys[tty["tty"]]

	});

	cat.on('exit', (code) => {

		console.log( "reader exited.")



		clearInterval(echo)
		arduino.reader = null
		arduino.port = ""

		// console.log("kill ttys")
		// console.log(tty["tty"] + " was disconnected. killing all players on this node.")
		// delete ttys[tty["tty"]]

	});

	return cat;
}


function randomBetween(x,y) {

	var random = Math.floor( Math.floor( Math.random() * ( y ) ) + x  )

	return random

}


// function randomPlaceholder() {
//
//
//
//
// 	return
// }


var placeholder = null


function setupPlayer( type ) {

	player.active = true

	// console.log(type)

	if ( placeholder ) {

		// console.log("clearing interval.")
		clearInterval( placeholder )
		// console.log("cleared interval.")


	}

	var type = type || false

	var asset = false

	if ( player.placeholder ) clearTimeout( player.placeholder )

	if ( type == "video" ) {

		asset = player.asset

	}

	else if ( type == "placeholder" ) {

		asset = assets_placeholder_folder + '/' + assets_placeholder[ randomBetween( 0, assets_placeholder.length - 1 ) ]
		// console.log(asset)

	}

	var player_instance = mplayer( asset )


	player_instance.on("close", function() {

		console.log( "video finished." )

		if ( player.safety ) clearTimeout( player.safety )


		player.timeout = setTimeout ( function() {

			console.log("clear.")

			player.active = false

		}, 1000 * 5)




		player.placeholder = setTimeout( function() {

			// console.log("placeholder.")
			setupPlayer("placeholder")

		}, randomBetween( 1000*61 , 1000*100 ))



		})

	player.instance = player_instance

	player.safety = setTimeout(function() {

			if ( player.instance && player.instance.process ) player.instance.process.kill()

		}, 1000 * 60 * 10)

	// console.log(player_instance)

}




player.placeholder = setTimeout( function() {

	// console.log("placeholder.")

	setupPlayer("placeholder")


}, randomBetween(1000*61,1000*183) )


setInterval(function(){
	// console.log(interval)
	ls("/dev/ttyUSB*")


}, 1000)
