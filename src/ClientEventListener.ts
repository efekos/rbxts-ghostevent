import { ReplicatedStorage } from "@rbxts/services";
import {Pair} from "./Pair";

export class ClientEventListener {
    private static pairList: Pair<string, Callback>[] = [];

    static fire(name: string, ...args: unknown[]): void {
        if (ReplicatedStorage.FindFirstChild("Events") === undefined) new Instance("Folder", ReplicatedStorage).Name = "Events";
        const eventsFolder = ReplicatedStorage.WaitForChild("Events");

        const event = this.sendCreatePacket(name);
        print("created event")
        wait(0.01)
        event.FireServer(...args);
        print("fire event")
    }

    static registerListener(name: string, callback: Callback): void {
        this.pairList.push(Pair.of(name, callback));
    }

    static getListFor(name: string): Pair<string, Callback>[] {
        return this.pairList.filter(r => r.object1 === name);
    }

    private static sendCreatePacket(name:string):RemoteEvent{
        const func = ReplicatedStorage.WaitForChild("ce") as RemoteFunction;
        func.InvokeServer(name);
        return ReplicatedStorage.WaitForChild("Events").WaitForChild(name) as RemoteEvent;
    }

    static handle(): void {
        if (ReplicatedStorage.FindFirstChild("Events") === undefined) new Instance("Folder", ReplicatedStorage).Name = "Events";
        const eventsFolder = ReplicatedStorage.WaitForChild("Events");

        eventsFolder.ChildAdded.Connect(i => {
            print("received event")
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