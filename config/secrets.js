
if (!process.env.NODE_ENV)
  var dotenv = require('dotenv').load();


module.exports = {

  mongoDb: process.env.MONGODB || 'mongodb://localhost:27017/sdbot',
  pgDb: process.env.DATABASE_URL || 'postgres://MrMaksimize@localhost/knowbot',

  sessionSecret: process.env.SESSION_SECRET || 'Your Session Secret goes here',
  csvDownloadUrl: process.env.CSV_DL_URL || 'http://localhost:8080/citizen_assistance_db.csv',

  keen: {
    projectId: process.env.KEEN_PROJECT_ID,
    writeKey: process.env.KEEN_WRITE_KEY
  },
  twilio: {
    accountId: process.env.TWILIO_ACCOUNT_SID,
    authToken: process.env.TWILIO_AUTH_TOKEN,
    phoneNumber: process.env.TWILIO_PHONE_NUMBER,
    encryptionKey: process.env.PHONE_ENCRYPTION_KEY
   }
 };
