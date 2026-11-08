/*
 * Minecraft Discord Manager
 * Original project author: Philip (Fips2010)
 * Discord user ID: 1312508991162683436
 * Please retain this attribution when redistributing or adapting this project.
 */

const net = require('node:net');
function packet(id, type, body) {
  const header = Buffer.alloc(8);
  header.writeInt32LE(id, 0);
  header.writeInt32LE(type, 4);
  const payload = Buffer.concat([header, Buffer.from(body + '\0\0')]);
  const size = Buffer.alloc(4);
  size.writeInt32LE(payload.length, 0);
  return Buffer.concat([size, payload]);
}
function decode(buffer) {
  if (buffer.length < 4) return null;
  const size = buffer.readInt32LE(0);
  if (size < 10 || buffer.length < 4 + size) return null;
  return { id: buffer.readInt32LE(4), type: buffer.readInt32LE(8), body: buffer.toString('utf8', 12, 4 + size - 2), total: 4 + size };
}
async function authenticate(host, port, password, timeout = 7000) {
  return new Promise((resolve, reject) => {
    const socket = net.createConnection({ host, port: Number(port) });
    let data = Buffer.alloc(0), done = false;
    const timer = setTimeout(() => finish(new Error('RCON-Verbindung timeout')), timeout);
    function finish(err) { if (done) return; done = true; clearTimeout(timer); socket.destroy(); err ? reject(err) : resolve(true); }
    socket.on('connect', () => socket.write(packet(1, 3, password)));
    socket.on('data', chunk => {
      data = Buffer.concat([data, chunk]);
      let p;
      while ((p = decode(data))) { data = data.subarray(p.total); if (p.id === -1) finish(new Error('RCON-Passwort falsch oder RCON nicht aktiv')); else if (p.id === 1) finish(); }
    });
    socket.on('error', e => finish(new Error(`RCON-Verbindung fehlgeschlagen: ${e.message}`)));
    socket.on('close', () => { if (!done) finish(new Error('RCON-Verbindung wurde geschlossen')); });
  });
}
async function execute(host, port, password, command, timeout = 10000) {
  return new Promise((resolve, reject) => {
    const socket = net.createConnection({ host, port: Number(port) });
    let data = Buffer.alloc(0), authenticated = false, done = false;
    const timer = setTimeout(() => finish(new Error('RCON-Befehl timeout')), timeout);
    function finish(err, result) { if (done) return; done = true; clearTimeout(timer); socket.destroy(); err ? reject(err) : resolve(result || ''); }
    socket.on('connect', () => socket.write(packet(1, 3, password)));
    socket.on('data', chunk => {
      data = Buffer.concat([data, chunk]);
      let p;
      while ((p = decode(data))) {
        data = data.subarray(p.total);
        if (p.id === -1) return finish(new Error('RCON-Passwort falsch oder RCON nicht aktiv'));
        if (!authenticated && p.id === 1) { authenticated = true; socket.write(packet(2, 2, command)); }
        else if (authenticated && p.id === 2) finish(null, p.body);
      }
    });
    socket.on('error', e => finish(new Error(`RCON-Verbindung fehlgeschlagen: ${e.message}`)));
    socket.on('close', () => { if (!done) finish(new Error('RCON-Verbindung wurde geschlossen')); });
  });
}
module.exports = { authenticate, execute };
