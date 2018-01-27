import * as admin from 'firebase-admin';


// Create a database reference and make it available to other modules.
export const db = admin.firestore();


/**
 * Represents a set of actions that Alphatron will execute.
 */
export class ActionSet {
    res;
    numFeaturesLeft: number;
    actions: object[] = [];

    /**
     * Create an empty set of actions.
     * @param res The Response object to use for executing the actions.
     * @param numFeatures The number of features that is expected to make a
     * ready() call. The actions will be executed as soon as this number of
     * ready() calls has been received.
     */
    public constructor(res, numFeatures: number) {
        this.res = res;
        this.numFeaturesLeft = numFeatures;
    }

    /**
     * Each feature needs to call this method exactly once as soon as they have
     * added all their actions to the set. Once every feature has called this
     * method, the actions will be executed. If a feature does not call this
     * method, no actions will execute, and if a feature calls this method more
     * than once, actions that arrive later on may not execute.
     */
    public ready(): void {
        this.numFeaturesLeft--;

        if (this.numFeaturesLeft === 0) {
            this.res.setHeader('Content-Type', 'application/json');
            this.res.send(JSON.stringify({ actions: this.actions }));
        }
    }

    /**
     * Adds an action to the set.
     * @param method The Slack API method to use, e.g. 'chat.postMessage'. See
     * https://api.slack.com/methods for a full list of available methods.
     * @param body The body to pass along with the Slack API method, e.g.
     * '{ channel: "#general", text: "This is an example." }'.
     */
    public add(method: string, body: object): ActionSet {
        this.actions.push({ method: method, body: body });

        return this;
    }
}
