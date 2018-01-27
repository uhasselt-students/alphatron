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
