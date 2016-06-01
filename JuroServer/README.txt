Before running this server please ensure you have the following installed:
- CouchDB: http://couchdb.apache.org/#download
- NodeJS: https://nodejs.org/en/download/

1. CouchDB must be installed. On Windows the default folder is "C:\Program Files (x86)\Apache Software Foundation\CouchDB\".

2. Before starting CouchDB, you must copy the file "couchdb_config\local.ini" to "C:\Program Files (x86)\Apache Software Foundation\CouchDB\etc\couchdb". This will setup the default admin (dehibernate:tintin), the default port and other general settings.

3. To start CouchDB, open the file "C:\Program Files (x86)\Apache Software Foundation\CouchDB\bin\couchdb.bat", or type "Start CouchDB" in the start menu search bar.

CouchDB should now be set up and running. You can access the control panel by typing http://localhost:5985/_utils in your browser. When asked for username and password use the following credentials:

user:dehibernate
pass:tintin

You can manually change the password by accessing the account settings on the CouchDB _utils page.

4. Download and install Node.JS from the link provided above.

5. Run the file install_dependencies.bat (on Windows) or install_dependencies.sh on Linux and Mac OS X. Wait for it to finish - it should say "Done" at the end if initialisation succeeded. This step download the required Node.JS libraries from GitHub.

6. Run the file start_server.bat or start_server.sh, or type "node app.js" in the command line. The server should now be running.

7. You can now test the Web API with a tool of your choice. The Postman app for Chrome is recommended and was used for testing during development.

The following are some example queries you can attempt:

POST http://localhost:3000/auth/forgot-password/ (should return "User Not Found")
GET http://localhost:3000/ (should return "Unauthorised")

Use x-www-form-urlencoded for the parameter type if you need to pass any, such as when registering a new username or loggin in. For a full list of available API calls supported by the server please visit https://github.com/colinskow/superlogin#routes

For a list of CouchDB API paths, please visit http://docs.couchdb.org/en/1.6.1/api/

Any routes starting with undesrscore (e.g. 'http://localhost:3000/_utils') are blocked for security reasons (CouchDB uses them for administration).