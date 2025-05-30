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