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


# URI do MongoDB Atlas OU local
MONGO_URI=mongodb+srv://santanadavi777:1L79nHA8MjHAQCFO@cluster0.be6ad99.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0

# Chave JWT — gere com Node/OpenSSL
JWT_SECRET=ddd0a6815a3058da3765da2023286115dee7a5be392643bcac19992d92381f0d

# Porta do servidor
PORT=3000
