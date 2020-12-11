export default class Validator {
    static isTypeOf( val, type, error = `Value (${val}) is not type of ${type}` ) {
        if( typeof val !== type ) {
            throw new TypeError(error);
        }
    }

    static isInstanceOf( val, type, error = `Value (${val}) is not instance of ${type}` ) {
        if( !(val instanceof type) ) {
            throw new TypeError(error);
        }
    }
    
    static compare( number1, number2, callback, error = `Numbers ${number1} and ${number2} don't satisfy function:\n${callback}` ) {
        this.isTypeOf( number1, 'number' );
        this.isTypeOf( number2, 'number' );
        this.isTypeOf( callback, 'function' );
        if( callback(number1, number2 ) ) {
            throw new RangeError(error);
        }
    }

    static notNull( obj, error = `Argument (${obj}) is null` ) {
        if( obj === null ) {
            throw new TypeError(error);
        }
    }
}