const protocol = require("./protocol.js");
const dgram = require('dgram');
const net = require('net');

// Max interval between 2 datagrams to consider a musician active
const INTERVAL = 5000;

// Port to query data about the orchestra
const TCP_PORT = 2205;

const instruments = new Map(Array.from(protocol.INSTRUMENTS, e => [e[1], e[0]]));

const socketUDP = dgram.createSocket('udp4');
const server = net.createServer();

// List of active musicians
var musicians = new Map();


function receiveSound(message, unused) {
    var msg = JSON.parse(message);

    var musician = musicians.get(msg.uuid);
    var now = Date.now();

    // If musician is active
    if (musician != undefined && now - musician.last <= INTERVAL) {
        musicians.set(msg.uuid, {instrument:musician.instrument, first:musician.first, last:now});
    } else {
        musicians.set(msg.uuid, {instrument:instruments.get(msg.sound), first:now, last:now});
    }
}

function connect(socket) {
    var now = Date.now();
    var msg = JSON.stringify([...musicians].filter(([key, value]) => {
        // Remove inactive musician
        if (now - value.last > INTERVAL) {
            console.log("Remove inactive musician: ", key);
            musicians.delete(key);
            return false;
        }
        
        return true;
    // Map appropriate values for the exportation
    }).map(([key, value]) => {
        return {uuid: key, instrument: value.instrument, activeSince: new Date(value.first)};
    }));

    socket.write(msg);
    socket.write("\n");
    socket.end();
}

socketUDP.on("message", receiveSound);

// Join multicast
socketUDP.bind(protocol.PORT, function() {
  console.log("Joining multicast group");
  socketUDP.addMembership(protocol.HOSTNAME);
});

server.listen(TCP_PORT);

server.on("connection", connect);

