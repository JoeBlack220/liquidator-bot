import { delay } from './delay';

export default class TaskExecutor {

    wait = async (time: number) => {
        await delay(time);
    }
}