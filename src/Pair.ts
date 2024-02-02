export class Pair<K, V> {
    object1: K;
    object2: V;

    private constructor(obj1: K, obj2: V) {
        this.object1 = obj1;
        this.object2 = obj2;
    }

    public static of<K, V>(object1: K, object2: V): Pair<K, V> {
        return new Pair(object1, object2);
    }
}