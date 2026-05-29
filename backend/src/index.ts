import express from 'express';
import cors    from 'cors';
import dotenv  from 'dotenv';
import path    from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

import autoresRouter  from './routes/autores';
import livrosRouter   from './routes/livros';
import usuariosRouter from './routes/usuarios';

const app  = express();
const PORT = Number(process.env.PORT ?? 3000);

app.use(cors());
app.use(express.json());

app.use('/api/autores',  autoresRouter);
app.use('/api/livros',   livrosRouter);
app.use('/api/usuarios', usuariosRouter);

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
    