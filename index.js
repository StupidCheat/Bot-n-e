const { Relay } = require('bedrock-protocol');

const PORT = process.env.SERVER_PORT || 25557;

//  Hola Servidor de destino al que te conectarás
const DESTINATION_HOST = 'play.lbsg.net'; // Reemplaza por la IP de tu servidor
const DESTINATION_PORT = 19132;

const relay = new Relay({
  /* Servidor que escucha a tu iPhone */
  host: '0.0.0.0',
  port: Number(PORT),
  useNativeRaknet: false,

  /* Servidor remoto de destino */
  destination: {
    host: DESTINATION_HOST,
    port: DESTINATION_PORT
  },

  /* Si entras a un servidor público oficial (Lifeboat, Cubecraft, etc.),
     cambia 'offline' a false para permitir el login de Microsoft */
  offline: false 
});

// Configurar el anuncio de la lista de servidores para iOS
relay.conns = new Set();

relay.on('connect', (player) => {
  console.log(`[PROXY] Conexión entrante desde el cliente Bedrock...`);

  let isAutoMining = false;
  let miningInterval = null;

  player.on('serverbound', (packet) => {
    const { name, params } = packet;

    if (name === 'text' && params.message) {
      const msg = params.message.toLowerCase().trim();

      if (msg === '!mine start') {
        if (!isAutoMining) {
          isAutoMining = true;
          console.log('[AUTO-MINER] Activado.');

          player.queue('text', {
            type: 'chat',
            needs_translation: false,
            source_name: 'Proxy',
            message: '§a[AutoMiner] Activado. Minando bloque enfrente...'
          });

          miningInterval = setInterval(() => {
            if (!isAutoMining) return;

            player.upstream.queue('player_action', {
              action: 'start_break',
              position: { x: 0, y: 0, z: 0 },
              face: 0
            });
          }, 200);
        }
        return;
      }

      if (msg === '!mine stop') {
        if (isAutoMining) {
          isAutoMining = false;
          clearInterval(miningInterval);
          console.log('[AUTO-MINER] Desactivado.');

          player.queue('text', {
            type: 'chat',
            needs_translation: false,
            source_name: 'Proxy',
            message: '§c[AutoMiner] Desactivado.'
          });
        }
        return;
      }
    }
  });
});

relay.listen();
console.log(`[PROXY] Relay escuchando en el puerto ${PORT}...`);
