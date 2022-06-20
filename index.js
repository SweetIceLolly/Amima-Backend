const db = require('./db');
const server = require('./http_server');

async function main() {
  console.log('Connecting to the database...');
  db.connect()
    .then(() => {
      console.log('Connected to the database');
      server.start_server()
        .then(() => {
          console.log(`Server started on port ${ process.env.PORT || 3000 }`);
        })
        .catch((err) => {
          console.log(`Failed to start the server on port ${ process.env.PORT || 3000 }`, err);
        });
    })
    .catch(err => {
      console.log('Failed to connect to the database', err);
    });
}

main().catch(function(err) {
    console.error('Error thrown in main()', err);
});
