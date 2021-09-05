var child_process = require('child_process')
var events = require('events');
var fs = require('fs');

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


var arduino = {

	reader:"",
	port:"",
	active:false

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

			if ( arduino.port ) {
				console.log('killing running reader.')

				arduino.reader.kill()
				arduino.reader = ""
				arduino.port = ""
				arduino.active = false
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

			if ( string[i] != "" ) console.log(string[i])
			// console.log( string[i].length > 0 && string[i].match(/^system:connected/) != null && ! arduino.active )

			if ( string[i].length > 0 && string[i].match(/^system:connected*/) && ! arduino.active ) {

				arduino.active = true

				clearInterval(echo)

				console.log( arduino.port + " is connected")
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


		// console.log("kill ttys")
		// console.log(tty["tty"] + " was disconnected. killing all players on this node.")
		// delete ttys[tty["tty"]]

	});

	return cat;
}










setInterval(function(){
	// console.log(interval)
	ls("/dev/ttyUSB*")


}, 1000)
