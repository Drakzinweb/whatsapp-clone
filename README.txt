# WhatsApp Clone

## Setup

1. Copie `.env` para a raiz e preencha:
   - MONGO_URI
   - JWT_SECRET
   - PORT

2. Instale dependências:
   npm install

3. Inicie o servidor:
   npm run dev

4. Acesse no navegador:
   - http://localhost:3000/          → landing page
   - http://localhost:3000/register  → registrar
   - http://localhost:3000/login     → login
   - http://localhost:3000/chat      → chat (após login)

## API REST

- POST /api/auth/register
- POST /api/auth/login
- GET  /api/auth/users   (autenticado)
- GET  /api/me           (autenticado)

## WebSocket (Socket.IO)

- Conexão: io('/', { auth: { token } })
- Eventos:
  - join  → { to }      (solicita histórico)
  - history ← [Message]
  - message → { to, text }
  - message ← Message



MONGO_URI=mongodb+srv://santanadavi777:1L79nHA8MjHAQCFO@cluster0.be6ad99.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0
JWT_SECRET=ddd0a6815a3058da3765da2023286115dee7a5be392643bcac19992d92381f0d
PORT=3000



backend/config/db.js
backend/controllers/authController.js
backend/controllers/userController.js
backend/middleware/authMiddleware.js
backend/middleware/errorHandler.js
backend/models/Message.js
backend/models/Story.js
backend/models/User.js
backend/routes/auth.js
backend/routes/users.js
backend/seguidor/follow.js
backend/seguidor/followerController.js
backend/seguidor/followerRoutes.js
backend/seguidor/followers.js
backend/seguidor/following.js
backend/server.js


frontend/css/style.css
frontend/js/main.js
frontend/chat.html
frontend/config.html
frontend/follow.html
frontend/followers.html
frontend/following.html
frontend/index.html
frontend/login.html
frontend/register.html
node_modules/...
package-lock.json
package.json
.env


backend/
│
├── config/
│   └── db.js                         # Conexão com MongoDB
│
├── login/                            # 🔐 Login e Registro
│   ├── authController.js             # Lógica de autenticação
│   ├── authRoutes.js                 # Rotas: /api/auth
│   ├── authMiddleware.js             # Middleware: proteção com JWT
│   └── validations.js                # Validações de login e registro
│
├── mensagens/                        # 💬 Envio e recebimento de mensagens
│   ├── messageController.js          # Envia e busca mensagens
│   ├── messageRoutes.js              # Rotas: /api/messages
│   └── Message.js                    # Modelo da mensagem
│
├── usuarios/                         # 👥 Listagem de usuários, perfil
│   ├── userController.js             # Lógica: listar usuários, perfil
│   ├── userRoutes.js                 # Rotas: /api/users
│   └── User.js                       # Modelo do usuário
│
├── chamadas/                         # 📞 Chamada de vídeo/voz
│   ├── callController.js             # Iniciar, encerrar chamadas
│   ├── callRoutes.js                 # Rotas: /api/calls
│   └── callService.js                # Lógica da chamada (opcional)
│
├── stories/                          # 📸 Stories dos usuários
│   ├── storyController.js            # Criar e buscar stories
│   ├── storyRoutes.js                # Rotas: /api/stories
│   └── Story.js                      # Modelo do story
│
├── seguidor/                         # 🔗 Seguir e listar seguidores
│   ├── followerController.js         # Seguir, deixar de seguir
│   ├── followerRoutes.js             # Rotas: /api/follow
│   └── Follow.js                     # Modelo de relacionamento follow
│
├── sockets/                          # 🔌 Comunicação em tempo real
│   └── socketHandler.js              # Status online, mensagens, chamadas
│
├── middleware/                       # ⚙️ Middlewares globais
│   └── errorHandler.js               # Tratamento de erros
│
├── utils/                            # 🧰 Utilitários e funções comuns
│   └── helpers.js                    # (opcional) Funções auxiliares
│
├── server.js                         # 🚀 Inicializa o servidor
└── .env                              # 🔐 Variáveis de ambiente
