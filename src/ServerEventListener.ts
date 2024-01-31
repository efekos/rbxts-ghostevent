import { ReplicatedStorage } from "@rbxts/services";
import {Pair}from "./Pair";

export class ServerEventListener {
    private static pairList: Pair<string, ServerEventCallback>[] = [];

    static fire(name: string, player: Player,...args:unknown[]): void {
    
        if (ReplicatedStorage.FindFirstChild("Events") === undefined) new Instance("Folder", ReplicatedStorage).Name = "Events";
        const eventsFolder = ReplicatedStorage.WaitForChild("Events");

        const event = new Instance("RemoteEvent", eventsFolder) as RemoteEvent;
        event.Name = name;
        event.FireClient(player,...args);
    }

    static registerListener(name: string, callback: ServerEventCallback): void {
        this.pairList.push(Pair.of(name, callback));
    }

    static getListFor(name: string): Pair<string, ServerEventCallback>[] {
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
                event.OnServerEvent.Once(async(player, ...args) => {
                    await pair.object2(player, ...args);
                    connections++;
                    if (connections === maxConnections) event.Destroy();
                });
            });

        });
    }
}

type ServerEventCallback = (player: Player, ...args: unknown[]) => void;