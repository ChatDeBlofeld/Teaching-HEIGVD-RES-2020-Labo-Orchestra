const protocol = require("./protocol.js");
const dgram = require("dgram");

// Time interval between 2 datagrams
const INTERVAL = 1000;

const RFC4122 = require('rfc4122');
const uuid = new RFC4122().v4f();

const socket = dgram.createSocket('udp4');
const sounds = new Map(protocol.INSTRUMENTS);

// We need an instrument
if (process.argv.length < 3) {
    console.error("Not enough args. Aborting...");
    process.exit();
}

const sound = sounds.get(process.argv[2]);

if (sound == undefined) {
    console.error("Invalid instrument. Aborting...");
    process.exit();
}

setInterval(() => socket.send(JSON.stringify({uuid:uuid, sound:sound}), protocol.PORT, protocol.HOSTNAME), INTERVAL);