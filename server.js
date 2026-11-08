const http = require('http');
const fs = require('fs');
const path = require('path');
const { DatabaseSync } = require('node:sqlite');

const databaseDirectory = path.join(__dirname, '..', 'database');
const databasePath = path.join(databaseDirectory, 'progate.sqlite');

fs.mkdirSync(databaseDirectory, { recursive: true });

const database = new DatabaseSync(databasePath);
database.exec(`
	CREATE TABLE IF NOT EXISTS enquiries (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		name TEXT NOT NULL,
		phone TEXT NOT NULL,
		email TEXT,
		service TEXT NOT NULL,
		message TEXT,
		created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
	)
`);

const insertEnquiry = database.prepare(`
	INSERT INTO enquiries (name, phone, email, service, message)
	VALUES (?, ?, ?, ?, ?)
`);

const server = http.createServer((request, response) => {
	response.setHeader('Access-Control-Allow-Origin', 'http://localhost:4200');
	response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
	response.setHeader('Access-Control-Allow-Headers', 'Content-Type');

	if (request.method === 'OPTIONS') {
		response.writeHead(204);
		response.end();
		return;
	}

	if (request.url === '/api/enquiry' && request.method === 'POST') {
		let body = '';

		request.on('data', (chunk) => {
			body += chunk;
		});

		request.on('end', () => {
			try {
				const enquiry = JSON.parse(body);

				if (!enquiry.name || !enquiry.phone || !enquiry.service) {
					response.writeHead(400, { 'Content-Type': 'application/json' });
					response.end(JSON.stringify({ error: 'Name, phone and service are required' }));
					return;
				}

				const result = insertEnquiry.run(
					enquiry.name,
					enquiry.phone,
					enquiry.email || null,
					enquiry.service,
					enquiry.message || null
				);

				response.writeHead(201, { 'Content-Type': 'application/json' });
				response.end(JSON.stringify({
					status: 'saved',
					id: Number(result.lastInsertRowid)
				}));
			} catch {
				response.writeHead(400, { 'Content-Type': 'application/json' });
				response.end(JSON.stringify({ error: 'Invalid JSON' }));
			}
		});
		return;
	}

	if (request.url === '/health' && request.method === 'GET') {
		response.writeHead(200, { 'Content-Type': 'application/json' });
		response.end(JSON.stringify({ status: 'ok' }));
		return;
	}

	response.writeHead(404, { 'Content-Type': 'application/json' });
	response.end(JSON.stringify({ error: 'Not found' }));
});

const preferredPorts = [Number(process.env.PORT) || 3000, 3001, 3002, 3003];
let currentPortIndex = 0;

const tryListen = () => {
	const port = preferredPorts[currentPortIndex];

	server.once('error', (error) => {
		if (error.code === 'EADDRINUSE' && currentPortIndex < preferredPorts.length - 1) {
			currentPortIndex += 1;
			tryListen();
			return;
		}

		console.error(`Unable to start backend on ports ${preferredPorts.join(', ')}`, error);
		process.exit(1);
	});

	server.listen(port, () => {
		console.log(`Backend server listening on port ${port}`);
	});
};

tryListen();
