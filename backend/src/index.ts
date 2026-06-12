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

const app      = express();
const PORT     = Number(process.env.PORT ?? 3000);
const frontend = path.resolve(__dirname, '../../frontend');

app.use(cors());
app.use(express.json());

app.use('/api/autores',     autoresRouter);
app.use('/api/livros',      livrosRouter);
app.use('/api/usuarios',    usuariosRouter);
app.use('/api/emprestimos', emprestimosRouter);
app.use('/api/auth',        authRouter);

app.get('/', (_req, res) => {
  res.sendFile(path.join(frontend, 'login.html'));
});

app.get('/index.html', (_req, res) => {
  res.sendFile(path.join(frontend, 'index.html'));
});

app.use(express.static(frontend, {
  setHeaders(res, filePath) {
    if (filePath.endsWith('.js') || filePath.endsWith('.html')) {
      const tipo = filePath.endsWith('.js') ? 'application/javascript' : 'text/html';
      res.setHeader('Content-Type', `${tipo}; charset=utf-8`);
    }
  },
}));

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
    