import bodyParser from 'body-parser';
import cors from 'cors';
import express, { Application } from 'express';
import { HttpTerminator, createHttpTerminator } from 'http-terminator';
import { router } from '../../router';
export const app: Application = express();

app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Handle JSON parse errors
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (err instanceof SyntaxError && 'status' in err && err.status === 400 && 'body' in err) {
    console.error(`❌ Bad JSON Request to ${req.method} ${req.originalUrl}`);
    console.error('   Error:', err.message);
    // We can't easily log the body because parsing failed, but we definitively know the path now.
    return res.status(400).json({ status: 400, message: 'Invalid JSON payload. Check content-type matches body.' });
  }
  next();
});

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
