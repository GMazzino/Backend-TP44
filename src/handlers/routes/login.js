import { cwd as nodePath } from 'node:process';
import { sep } from 'node:path';

async function sendLogin(req, res) {
  await res.sendFile(`${nodePath()}${sep}src${sep}html${sep}login.html`);
}

export { sendLogin };
