const http = require('http');

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/test/seed-second',
  // path: '/api/test/seed-venture-approved',
  method: 'GET'
};

const req = http.request(options, (res) => {
  console.log(`STATUS: ${res.statusCode}`);
  res.setEncoding('utf8');
  res.on('data', (chunk) => {
    console.log(`BODY: ${chunk}`);
  });
});

req.on('error', (e) => {
  console.error(`problem with request: ${e.message}`);
});

req.end();
