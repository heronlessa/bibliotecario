import express from 'express';
import cors    from 'cors';
import dotenv  from 'dotenv';
import path    from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

import autoresRouter     from './routes/autores';
import livrosRouter      from './routes/livros';
import usuariosRouter    from './routes/usuarios';
import emprestimosRouter from './routes/emprestimos';
import authRouter        from './routes/auth';

const app  = express();
const PORT = Number(process.env.PORT ?? 3000);

app.use(cors());
app.use(express.json());

// Define charset UTF-8 para todas as respostas JSON
app.use((req, res, next) => {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  next();
});

app.use('/api/autores',     autoresRouter);
app.use('/api/livros',      livrosRouter);
app.use('/api/usuarios',    usuariosRouter);
app.use('/api/emprestimos', emprestimosRouter);
app.use('/api/auth',        authRouter);

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
    