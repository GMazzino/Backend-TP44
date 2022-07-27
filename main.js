import express from 'express';
import { Server as HttpServer } from 'http';
import { Server as IOServer } from 'socket.io';
import os from 'os';
import cluster from 'cluster';
import gzip from 'compression';
import appConfig from './config.js';
import { args } from './config.js';
import { routerProducts, products } from './src/routes/products.js';
import { routerRoot } from './src/routes/root.js';
import { routerLogout } from './src/routes/logout.js';
import { routerInfo } from './src/routes/info.js';
import { routerRandom } from './src/routes/random.js';
import { graphqlMidWare } from './src/models/graphql.js';
import { sendLogin } from './src/handlers/routes/login.js';
import chatMsgsWsHandler from './src/handlers/sockets/chat_msgs.js';
import userWsHandler from './src/handlers/sockets/user.js';
import session from './src/handlers/session/mongo_store.js';
import { name } from './src/handlers/auth/auth.js';
import { passportLocal } from './src/handlers/passport/passport_local.js';
import logger from './src/utils/logger.js';

logger.warn(`${JSON.stringify(graphqlMidWare.api)}`);

logger.info('Starting App');
logger.info(`Logger level: ${logger.level}`);
const app = express();
const httpServer = new HttpServer(app);
const io = new IOServer(httpServer);
const serverPort = process.env.PORT || appConfig.PORT;
const mode = args.mode;
const msgs = [];
const cpus = os.cpus().length;
logger.info('Configuring websocket');
io.on('connection', async (socket) => {
  logger.info('User connected');
  io.sockets.emit('renderProducts', products.getProducts().content);
  chatMsgsWsHandler(socket, io.sockets, msgs);
  userWsHandler('login', io.sockets, name);
});
app.io = io;
logger.info('Web socket configured and listening');
logger.info('Setting up server');
app.all('*', (req, res, next) => {
  logger.info(`Method: ${req.method} Route: ${req.url}`);
  next();
});
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.set('view engine', 'ejs');
app.set('views', './src/html');
app.use(session);
app.use(passportLocal.initialize());
app.use(passportLocal.session());

app.use('/', routerRoot);
app.use('/logout', routerLogout);
app.use('/api', routerProducts);
app.use('/api/randoms', routerRandom);
app.use('/api/randomszip', gzip(), routerRandom);
app.use('/graphql', graphqlMidWare);
app.use('/info', routerInfo);

app.get('/login', sendLogin);
app.post(
  '/login',
  passportLocal.authenticate('login', {
    failureRedirect: '/failLogin',
    failureMessage: true,
    successRedirect: '/',
  })
);

app.get('/failLogin', (req, res) => {
  res.status(400).render('errors.ejs', {
    error: req.session.messages[0],
    redirect: '/login',
  });
});

app.post(
  '/register',
  passportLocal.authenticate('register', {
    failureRedirect: '/failRegister',
    failureMessage: true,
    successRedirect: '/registerOk',
  })
);
app.get('/failRegister', (req, res) => {
  res.status(400).render('errors.ejs', {
    error: req.session.messages[0],
    redirect: '/register.html',
  });
});

app.get('/registerOk', (req, res) => {
  res.status(200).render('success.ejs', {
    message: 'Se ha creado el usuario. Ya puede ingresar',
    redirect: '/login',
  });
});

app.all('*', (req, res) => {
  logger.warn(`Method: ${req.method} Route: ${req.url} not implemented`);
  res.status(404).send('Ruta no implementada');
});

if (mode === 'CLUSTER') {
  if (cluster.isPrimary) {
    logger.info(`Server running in CLUSTER mode. Parent process PID: ${process.pid}. Number of CPUs: ${cpus}`);
    for (let i = 0; i < cpus; i++) {
      cluster.fork();
    }
    cluster.on('exit', () => {
      cluster.fork();
    });
  } else {
    logger.info(`Child process PID: ${process.pid}`);
    httpServer
      .listen(serverPort, () => {
        logger.info(`Server activated and listening en port ${serverPort}`);
      })
      .on('error', (error) => logger.error(error.message));
  }
} else {
  logger.info(`Server running in FORK mode. Process PID: ${process.pid}`);
  httpServer
    .listen(serverPort, () => {
      logger.info(`Server activated and listening en port ${serverPort}`);
    })
    .on('error', (error) => logger.error(error.message));
}
