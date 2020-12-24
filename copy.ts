namespace Copy {
    // JSON.parse(JSON.stringify) loses data
    export function deepCopy( obj: any ): any {
        if( typeof obj !== 'object'
        || obj === null
        || obj instanceof WeakMap
        || obj instanceof WeakSet) {
            return obj;
        }
        
        switch( obj.constructor ) {
            case Set:
                return copySet(obj);
            case Map:
                return copyMap(obj);
            case Array:
                return copyArray(obj);
            default:
                return copyObject(obj);
        }
    }
    
    function copyMap<K, V>( map: Map<K, V> ): Map<K, V> {
        let entries: Array<[K, V]> = [];
        for( const couple of map.entries() ) {
            entries.push([deepCopy(couple[0]), deepCopy(couple[1])]);
        }
    
        return new Map(entries);
    }
    
    function copySet<T>( set: Set<T> ): Set<T> {
        let values: Array<T> = [];
        for( const value of set.values() ) {
            values.push(deepCopy(value));
        }
    
        return new Set(values);
    }
    
    function copyArray<T>( array: Array<T> ): Array<T> {
        let values: Array<T> = [];
        for( const value of array ) {
            values.push(deepCopy(value));
        }
    
        return values;
    }
    
    function copyObject( obj: object ): object {
        let output:object = Object.create(Object.getPrototypeOf(obj));
        Object.getOwnPropertyNames(obj).forEach(property => {
            let descriptors: PropertyDescriptor = Object.getOwnPropertyDescriptor(obj, property);
            if( descriptors.hasOwnProperty('value') ) {
                descriptors.value = deepCopy(descriptors.value);
            }
            Object.defineProperty(output, property, descriptors);
        });
    
        return output;
    }
}