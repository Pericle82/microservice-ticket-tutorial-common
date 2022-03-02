import { Message, Stan } from "node-nats-streaming";
import { Subjects } from "./subjects";

interface Event {
    subject: Subjects;
    data: any;
}

export abstract class Listener<T extends Event> {

    // abstract ==> must be defined inside implemented class
    // protectd ==> can be defined insiede implemented class

    abstract subject: T['subject'];
    abstract queueGroupName: string;
    abstract onMessage(data: T['data'], msg: Message): void;
    protected ackAwait = 5*1000;

    constructor(private client: Stan) {
    }

    subscriptionOptions() {
        return this.client
        .subscriptionOptions()
        .setManualAckMode(true)
        .setAckWait(this.ackAwait) 
        .setDeliverAllAvailable() 
        .setDurableName(this.queueGroupName) 
    }

    listen() {
        const subscrition = this.client.subscribe(
            this.subject,
            this.queueGroupName,
            this.subscriptionOptions()
        );

        subscrition.on('message', (msg: Message) => {
            console.log(
                `Message received: ${this.subject} / ${this.queueGroupName}`
            );

            const parsedData = this.parseMessage(msg);
            this.onMessage(parsedData, msg)
        })
    }

    parseMessage(msg: Message) {
        const data = msg.getData();
        return typeof data === 'string' ?
        JSON.parse(data) : JSON.parse(data.toString('utf-8'))
    }
}
