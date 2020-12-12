// JSON.parse(JSON.stringify) loses data
export default function deepCopy( obj ) {
    if( typeof obj !== 'object' || obj === null ) {
        return obj;
    }
    
    switch( obj.constructor ) {
        case Set:
        case WeakSet:
            return copySet(obj);
        case Map:
        case WeakMap:
            return copyMap(obj);
        case Array:
            return copyArray(obj);
        default:
            return copyObject(obj);
    }
}

function copyMap( map ) {
    let entries = [];
    for( const couple of map.entries() ) {
        entries.push([deepCopy(couple[0]), deepCopy(couple[1])]);
    }

    return new (Object.getPrototypeOf(map)).constructor(entries);
}

function copySet( set ) {
    let values = [];
    for( const value of set.values() ) {
        values.push(deepCopy(value));
    }

    return new (Object.getPrototypeOf(set)).constructor(values);
}

function copyArray( array ) {
    let values = [];
    for( const value of array ) {
        values.push(deepCopy(value));
    }

    return values;
}

function copyObject( obj ) {
    let output = Object.create(Object.getPrototypeOf(obj));
    Object.getOwnPropertyNames(obj).forEach(property => {
        let descriptors = Object.getOwnPropertyDescriptor(obj, property);
        if( descriptors.hasOwnProperty('value') ) {
            descriptors.value = deepCopy(descriptors.value);
        }
        Object.defineProperty(output, property, descriptors);
    });

    return output;
}