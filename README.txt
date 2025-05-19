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
