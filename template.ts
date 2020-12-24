type AnySet<ITEM> = ITEM extends object ? (Set<ITEM> | WeakSet<ITEM>) : Set<ITEM>;
type AnyMap<KEY, ITEM> = KEY extends object ? (Map<KEY, ITEM> | WeakMap<KEY, ITEM>) : Map<KEY, ITEM>;
type AnyWeak<T extends object, ITEM = never> = ITEM extends never ? WeakSet<T> : WeakMap<T, ITEM>;
type Constructor = new (...args: any[]) => {};

type AnyObject<T, ITEM = never> = 
    (ITEM extends never ?
    AnySet<T> : AnyMap<Text, ITEM>)
    | (T extends object ?
    AnyWeak<T, ITEM> | object : object)
    | Array<T>;

interface metaTemplate {
    title: string,
    description: string
};

interface stepTemplate {
    index: number,
    meta: metaTemplate,
    call: (store: object)=>Promise<any>,
    restore?: (store: object)=>Promise<any>,
    // If true, rollback will throw an error if restore is not specified
    crucial?: boolean 
};

type logTemplate = {
    index: number,
    meta: metaTemplate,
} & ({
    error: {
        name: string,
        message: string,
        stack: string
    }
} | {
    storeBefore: object,
    storeAfter: object,
    error: null
});