import fs from 'node:fs';
import path from 'node:path';
const root=process.cwd();
const bad=['docker-compose.yml','Dockerfile','.dockerignore'];
for(const rel of bad){if(fs.existsSync(path.join(root,rel))) throw new Error(`Docker artifact remains: ${rel}`)}
console.log('OK: Docker artifacts are not part of the project.');
