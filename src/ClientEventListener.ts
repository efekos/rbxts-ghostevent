import { ReplicatedStorage } from "@rbxts/services";
import {Pair} from "./Pair";

export class ClientEventListener {
    private static pairList: Pair<string, Callback>[] = [];

    static fire(name: string, ...args: unknown[]): void {
        if (ReplicatedStorage.FindFirstChild("Events") === undefined) new Instance("Folder", ReplicatedStorage).Name = "Events";
        const eventsFolder = ReplicatedStorage.WaitForChild("Events");

        const event = new Instance("RemoteEvent", eventsFolder) as RemoteEvent;
        event.Name = name;
        event.FireServer(...args);
    }

    static registerListener(name: string, callback: Callback): void {
        this.pairList.push(Pair.of(name, callback));
    }

    static getListFor(name: string): Pair<string, Callback>[] {
        return this.pairList.filter(r => r.object1 === name);
    }

    static handle(): void {
        if (ReplicatedStorage.FindFirstChild("Events") === undefined) new Instance("Folder", ReplicatedStorage).Name = "Events";
        const eventsFolder = ReplicatedStorage.WaitForChild("Events");

        eventsFolder.ChildAdded.Connect(i => {
            if (!i.IsA("RemoteEvent")) return;
            const event = i as RemoteEvent;

            const evnetList = this.pairList.filter(r => r.object1 === event.Name);
            let maxConnections = evnetList.size();
            let connections = 0;
            evnetList.forEach(pair => {
                event.OnClientEvent.Once(async (...args) => {
                    await pair.object2(...args as unknown[]);
                    connections++;
                    if (connections === maxConnections) event.Destroy();
                });
            });

        });
    }
}