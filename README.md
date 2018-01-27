# alphatron
The most alpha of all Slack bots.

## Setup

1. Make sure [here](https://console.firebase.google.com) that you are a member of the Alphatron Firebase project. If not, check your email for a pending invitation.
2. Make sure you have an up-to-date version of [Node.js and NPM](https://docs.npmjs.com/getting-started/installing-node) installed on your system.
3. Clone this repository and `cd` into its root folder.
4. Run `npm install` to install dependencies.
5. Run `npm run firebase login` to link your system with your account, if you haven't already.

## Usage

Alphatron's functionality is split up into so-called *features*. If you create a new command to, for example, display the time for different time zones, this would be a separate *feature*. Each *feature* resides in its own file inside the [/features](https://github.com/uhasselt-students/alphatron/tree/master/src/features) directory. The most basic feature looks as follows.

```typescript
import { ActionSet } from '../helpers';


exports.onEvent = (event: any, actions: ActionSet): void => {
    actions.ready();
}
```

`onEvent` is the only required function inside a *feature*. It gets called every time an event on Slack occurs, for example when @alphatron is mentioned. The `event` parameter contains an object describing the event, as sent by Slack. See [here](https://api.slack.com/events-api#event_types) for a full list of possible events. For example, a `reaction_added` event looks as follows.

```json
{
    "type": "reaction_added",
    "user": "U061F1EUR",
    "item": {
            "type": "message",
            "channel": "C061EG9SL",
            "ts": "1464196127.000002"
    },
    "reaction": "slightly_smiling_face"
}
```

The second parameter, called `actions`, is an object representing the set of actions that Alphatron will execute in response to the event. A *feature* can add as many actions as required using `actions.add`, after which it must call `actions.ready`. **For every call of `onEvent`, there must be exactly one `actions.ready` call.** In the current setup, due to technical limitations, no actions will execute until all *features* have indicated that they are ready. Thus, if one *feature* fails to call `actions.ready`, Alphatron will cease to work completely. Similarly, if a *feature* calls `actions.ready` more than once, other *features* may not get a chance to act. These limitations will likely be removed in future versions.

To deploy your *feature* to Firebase, simply run `npm run deploy`. Firebase and the Git repository are currently not automatically synchronized, so you should also push your changes after successful deployment.

## Simple example: ping

Please have a look at the following simple *feature*, which makes Alphatron respond with `pong` everytime someone says `@alphatron ping`. This feature resides in [/features/ping.ts](https://github.com/uhasselt-students/alphatron/tree/master/src/features/ping.ts).

```typescript
import { ActionSet } from '../helpers';


exports.onEvent = (event: any, actions: ActionSet): void => {
    if (!shouldAct(event)) { actions.ready(); return; }

    actions.add('chat.postMessage', {
        channel: event.channel,
        text: 'pong'
    }).ready();
}


function shouldAct(event: any): boolean {
    if (event.type !== 'app_mention') { return false; }

    const words: string = event.text.split(/\s+/);

    return words.length === 2 && words.includes('ping');
}
```

First we need to decide whether any given event is relevant to our *feature*, which we do in a separate function `shouldAct`. Events must be of the type [app_mention](https://api.slack.com/events/app_mention) and must contain exactly two words of which one is `ping` (the other being `@alphatron`). If the event is not relevant, we call `actions.ready` and exit. If it turns out someone did activate our *feature*, we add a [chat.postMessage](https://api.slack.com/methods/chat.postMessage) action to post `pong` to the same channel as the app mention came from. We end by calling `actions.ready` using command method chaining.

## Database example: increment

Please have a look at the following slightly more complex *feature*, which makes Alphatron respond with an increasingly higher number everytime someone says `@alphatron increment`. This feature resides in [/features/increment.ts](https://github.com/uhasselt-students/alphatron/tree/master/src/features/increment.ts).

```typescript
import { db, ActionSet } from '../helpers';


const dbRef = db.collection('features').doc('increment');


exports.onEvent = (event: any, actions: ActionSet): void => {
    if (!shouldAct(event)) { actions.ready(); return; }

    dbRef.get().then((docSnapshot) => {
        let data: any;

        if (docSnapshot.exists) { data = docSnapshot.data(); }
        else { data = { count: 0 }; }

        actions.add('chat.postMessage', {
            channel: event.channel,
            text: data.count
        }).ready();

        data.count += 1;
        dbRef.set(data).catch();

        return null;
    }).catch();
};


function shouldAct(event: any): boolean {
    if (event.type !== 'app_mention') { return false; }

    const words: string = event.text.split(/\s+/);

    return words.length === 2 && words.includes('increment');
}
```

We acquire a database reference from the same `helpers` module that we acquired the `ActionsSet` declaration from. We then get a Firestore database reference to `/features/increment`, where we keep track of our incrementing value. We use a `shouldAct` function analog to the one in the `ping` *feature* to determine whether any given event is relevant to us. If the event is determined to be an `increment` invocation, we acquire the contents of the database via a callback function (see [Firestore Quickstart](https://firebase.google.com/docs/firestore/quickstart) for more information). In this callback function, we determine the current value, or initialize it at 0 if the database entry doesn't exist yet. Then, we respond with the current value, we call `actions.ready`, and we end by writing the incremented value to the database.
