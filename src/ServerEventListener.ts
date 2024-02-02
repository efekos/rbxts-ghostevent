import { ReplicatedStorage } from "@rbxts/services";
import { Pair } from "./Pair";

export class ServerEventListener {
    private static pairList: Pair<string, ServerEventCallback>[] = [];
    private static handleCalled = false;

    static fire(name: string, player: Player, ...args: unknown[]): void {
        if (!this.handleCalled) error("ServerEventListener.handle() must be called before using ClientEventListener.fire()", 2);

        if (ReplicatedStorage.FindFirstChild("Events") === undefined) new Instance("Folder", ReplicatedStorage).Name = "Events";
        const eventsFolder = ReplicatedStorage.WaitForChild("Events");

        const event = new Instance("RemoteEvent", eventsFolder) as RemoteEvent;
        event.Name = name;
        event.FireClient(player, ...args);
    }

    static registerListener(name: string, callback: ServerEventCallback): void {
        this.pairList.push(Pair.of(name, callback));
    }

    static getListFor(name: string): Pair<string, ServerEventCallback>[] {
        return this.pairList.filter(r => r.object1 === name);
    }

    static handle(): void {
        if (this.handleCalled) error("ServerEventListener.handle() is already called", 2);
        else this.handleCalled = true;
        if (ReplicatedStorage.FindFirstChild("Events") === undefined) new Instance("Folder", ReplicatedStorage).Name = "Events";

        const eventsFolder = ReplicatedStorage.WaitForChild("Events");

        const f = ReplicatedStorage.WaitForChild("ce") as RemoteFunction;
        f.OnServerInvoke = (player, b, a, ...args) => {
            if (a) {
                eventsFolder.WaitForChild(b as string).Destroy();
            } else {
                const eventList = this.pairList.filter(r => r.object1 === b);
                eventList.forEach(p => {
                    p.object2(player, ...args);
                });
            }
        };

    }
}

type ServerEventCallback = (player: Player, ...args: unknown[]) => void;