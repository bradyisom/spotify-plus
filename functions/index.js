const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp({
  credential: admin.credential.cert({
    projectId: 'spotify-plus',
    clientEmail: 'firebase-adminsdk-pudmk@spotify-plus.iam.gserviceaccount.com',
    privateKey: functions.config().spotify_plus.private_key.replace(/\\n/g, '\n'),
  }),
  databaseURL: 'https://spotify-plus.firebaseio.com'
});

const whiteList = [
  'http://localhost:4200',
  'http://spotimixify.bradyisom.com'
];
const corsOptions = {
  origin: (origin, callback) => {
    if (whiteList.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  }
};
const cors = require('cors')(corsOptions);

exports.token = functions.https.onRequest((request, response) => {
  cors(request, response, () => {
    try {
      const user = request.body;
      admin.auth().createCustomToken(user.id).then((customToken) => {
        response.json({ token: customToken });
      }).catch((error) => {
        throw new Error(`Error creating custom token: ${error.toString()}`);
      })
    } catch (error) {
      return response.json({error: error.toString()});
    }
  });
});

