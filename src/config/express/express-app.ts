import bodyParser from 'body-parser';
import cors from 'cors';
import express, { Application } from 'express';
import { HttpTerminator, createHttpTerminator } from 'http-terminator';
import { router } from '../../router';
export const app: Application = express();

app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use(router);

let httpTerminator: HttpTerminator;
const port = 5000; //Bun.env.PORT || 3001;

export async function startExpressServer() {
  const server = app.listen(port, () => {
    console.log('[Express] - Server initialized 🌭 in port ' + port);
    httpTerminator = createHttpTerminator({ server });
  });
}

export async function stopExpressServer() {
  console.log('[Express] - Closing api rest 🌭');
  httpTerminator.terminate();
}
