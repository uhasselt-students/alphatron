import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';
import * as path from 'path';


// Perforn various initialization tasks.
admin.initializeApp(functions.config().firebase);
import { db, ActionSet } from './helpers';


// Load the settings, and update them whenever they change.
let settings: FirebaseFirestore.DocumentData;
loadSettings();


// Load all of Alphatron's features, which each reside in their own Node module.
let features: Set<Feature>;
loadFeatures();


export const onEvent = functions.https.onRequest((req, res) => {
    if (req.body.token !== settings.token) {
        // Drop requests without the correct verification token.
        res.status(403).send();
    } else if (req.body.type === 'event_callback') {
        // In case of an event, give all features a chance to react to it.
        const actions = new ActionSet(res, features.size);

        features.forEach((feature) => {
            feature.onEvent(req.body.event, actions);
        });
    } else {
        // In all other cases, consider the request invalid.
        res.status(400).send();
    }
});


/**
 * Interface for Alphatron features, in which each feature must have a function
 * for reacting to events.
 */
export interface Feature extends NodeModule {
    onEvent(event: any, actions: ActionSet): void;
}


/**
 * Load the settings from Firestore into the 'settings' variable, and update
 * them whenever they change.
 */
function loadSettings(): void {
    const collection = 'settings';
    const document = 'qvnmilHDWWmnfuZBK7xt';

    db.collection(collection).doc(document).get().then((doc) => {
        settings = doc.data();
        console.log('Settings loaded');
    }).catch((err) => {
        console.error('Error loading settings');
        throw err;
    });

    if (!exports.onSettingsChange) {
        exports.onSettingsChange = functions.firestore
            .document(collection + '/' + document).onWrite((event) => {
                settings = event.data.data();
                console.log('Settings reloaded because a change was detected');
                return null;
            });
    }
}


/**
 * Each of Alphatron's features resides in its own file in the 'features'
 * directory. This function loads each of these files as a Node module and
 * stores them in the 'features' variable.
 */
function loadFeatures(): void {
    const customRequire = require(path.join(__dirname, 'require'));
    const featuresDir = path.join(__dirname, 'features');

    customRequire.reqDir(featuresDir, (err, modules) => {
        if (err) {
            console.error('Error loading features');
            throw err;
        }

        features = modules;
        console.log('Features loaded');
    });
}
