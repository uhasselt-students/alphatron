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
