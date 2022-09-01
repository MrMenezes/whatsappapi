const { Client, LocalAuth } = require('whatsapp-web.js');
const express = require('express');
const { body, validationResult } = require('express-validator');
const socketIO = require('socket.io');
const qrcode = require('qrcode');
const http = require('http');
const fileUpload = require('express-fileupload');
const port = process.env.PORT || 8000;
const app = express();
const server = http.createServer(app);
const io = socketIO(server);

app.use(express.json());
app.use(express.urlencoded({
extended: true
}));
app.use(fileUpload({
debug: true
}));

app.get('/', (req, res) => {
  res.sendFile('index.html', {
    root: __dirname
  });
});

const client = new Client({
  authStrategy: new LocalAuth({ clientId: 'mr-api' }),
  puppeteer: { headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      // '--single-process', // <- this one doesn't works in Windows
      '--disable-gpu'
    ] }
});

client.initialize();

io.on('connection', function(socket) {
  socket.emit('message', 'Conectando...');

client.on('qr', (qr) => {
    console.log('QR RECEIVED', qr);
    qrcode.toDataURL(qr, (err, url) => {
      socket.emit('qr', url);
      socket.emit('message', 'WhatsAppApi: QRCode recebido, aponte a câmera  seu celular!');
    });
});

client.on('ready', () => {
    socket.emit('ready', 'WhatsAppApi: Dispositivo pronto!');
    socket.emit('message', 'WhatsAppApi: Dispositivo pronto!');	
    console.log('WhatsAppApi: Dispositivo pronto');
});

client.on('authenticated', () => {
    socket.emit('authenticated', 'WhatsAppApi: Autenticado!');
    socket.emit('message', 'WhatsAppApi: Autenticado!');
    console.log('WhatsAppApi: Autenticado');
});

client.on('auth_failure', function() {
    socket.emit('message', 'WhatsAppApi: Falha na autenticação, reiniciando...');
    console.error('WhatsAppApi: Falha na autenticação');
});

client.on('change_state', state => {
  console.log('WhatsAppApi: Status de conexão: ', state );
});

client.on('disconnected', (reason) => {
  socket.emit('message', 'WhatsAppApi: Cliente desconectado!');
  console.log('WhatsAppApi: Cliente desconectado', reason);
  // TODO: Send email
  client.initialize();
});
});

// Send message
app.post('/send-message', [
  body('number').notEmpty(),
  body('message').notEmpty(),
], async (req, res) => {
  const errors = validationResult(req).formatWith(({
    msg
  }) => {
    return msg;
  });

  if (!errors.isEmpty()) {
    return res.status(422).json({
      status: false,
      message: errors.mapped()
    });
  }

  const number = req.body.number + '@c.us';
  const message = req.body.message;


  client.sendMessage(number, message).then(response => {
    res.status(200).json({
      status: true,
      response: response
    });
  }).catch(err => {
    res.status(500).json({
      status: false,
      response: err
    });
  });
});

client.on('message', async msg => {

  const nomeContato = msg._data.notifyName;

  if (msg.type.toLowerCase() == "e2e_notification") return null;
  
  if (msg.body == "") return null;

 if (msg.body !== null || msg.body === "Teste") {
    const saudacaoes = ['Olá ' + nomeContato + ', tudo bem?', 'Oi ' + nomeContato + ', como vai você?', 'Opa ' + nomeContato + ', tudo certo?'];
    const saudacao = saudacaoes[Math.floor(Math.random() * saudacaoes.length)];
    msg.reply(saudacao + " Resposta do Teste");
	}
});

    
server.listen(port, function() {
        console.log('App running on *: ' + port);
});
