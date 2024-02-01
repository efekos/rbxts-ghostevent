import { ReplicatedStorage } from "@rbxts/services";
import { Pair } from "./Pair";

export class ClientEventListener {
    private static pairList: Pair<string, Callback>[] = [];
    private static handleCalled = false;

    static fire(name: string, ...args: unknown[]): void {
        if (!this.handleCalled) error("ClientEventListener.handle() must be called before using ClientEventListener.fire()", 2);
        if (ReplicatedStorage.FindFirstChild("Events") === undefined) new Instance("Folder", ReplicatedStorage).Name = "Events";
        const eventsFolder = ReplicatedStorage.WaitForChild("Events");

        wait(0.01);
        this.sendCreatePacket(name);
        print("fire event");
    }

    static registerListener(name: string, callback: Callback): void {
        this.pairList.push(Pair.of(name, callback));
    }

    static getListFor(name: string): Pair<string, Callback>[] {
        return this.pairList.filter(r => r.object1 === name);
    }

    private static sendCreatePacket(name: string) {
        const func = ReplicatedStorage.WaitForChild("ce") as RemoteFunction;
        func.InvokeServer(name, false);
    }

    private static sendDeletePacket(name: string) {
        const func = ReplicatedStorage.WaitForChild("ce") as RemoteFunction;
        func.InvokeServer(name, true);
    }

    static handle(): void {
        if(this.handleCalled) error("ClientEventListener.handle() is already called",2);
        else this.handleCalled = true;
        if (ReplicatedStorage.FindFirstChild("Events") === undefined) new Instance("Folder", ReplicatedStorage).Name = "Events";
        const eventsFolder = ReplicatedStorage.WaitForChild("Events");

        eventsFolder.ChildAdded.Connect(i => {
            print("received event");
            if (!i.IsA("RemoteEvent")) return;
            const event = i as RemoteEvent;

            const evnetList = this.pairList.filter(r => r.object1 === event.Name);
            let maxConnections = evnetList.size();
            let connections = 0;
            evnetList.forEach(pair => {
                event.OnClientEvent.Once(async (...args) => {
                    await pair.object2(...args as unknown[]);
                    connections++;
                    if (connections === maxConnections) {
                        event.Destroy();
                        this.sendDeletePacket(event.Name);
                    }
                });
            });

        });
    }
}