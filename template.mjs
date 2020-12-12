import Validator from './validator.mjs';

export class Template {
    #template;

    constructor() {
        this.#template = {};
    }

    // (name, type1, type2 ... typeN) OR (name, template)
    add( name, ...types ) {
        Validator.isTypeOf(name, 'string', `Name (${name}) should be a string`);
        Validator.compare(arguments.length, 2, (a,b) => a < b, `Arguments are less than 2`);

        if( types.length === 1 && types[0] instanceof Template ) {
            this.#template[name] = types[0];
            return true;
        }

        if( types.some(type =>
            Object.getOwnPropertyNames(templateTypesEnum).every(property =>
                templateTypesEnum[property] !== type)) ) {
            throw new TypeError(`At least one of the types don't satisfy templateTypesEnum`);
        }

        this.#template[name] = types;
        return true;
    }

    // ( ... [name, type1, type2 ... typeN] ... [name, Template] ... )
    addAll( ...args ) {
        if( args.length === 0 ) return false;
        if( args.some(arg => !(arg instanceof Array)) ) {
            throw new TypeError(`At least one of the Arguments is not an Array`);
        }
        return args.every(arg => this.add(...arg));
    }

    remove( name ) {
        Validator.isTypeOf(name, 'string', `Name (${name}) should be a string`);
        if( this.#template[name] === undefined ) return false;
        return delete this.#template[name];
    }

    check( obj, strict = true ) {
        if( typeof obj !== 'object' ){
            Validator.isTypeOf(obj, 'object', `Object to check (${typeof obj === 'symbol' ? "symbol" : obj}) should be an object`);
        }
        if( obj === null ) return false;
        
        if( strict && Object.getOwnPropertyNames(obj).some( name => this.#template[name] === undefined ) ){
            return false;
        }
        
        return Object.getOwnPropertyNames(this.#template).every( name => {
            if( this.#template[name] instanceof Template ) {
                return typeof obj[name] === 'object' && this.#template[name].check(obj[name], strict);
            }

            return this.#template[name].some(type => {
                if( type === templateTypesEnum.ASYNC ) {
                    return typeof obj[name] === 'function' && obj[name][Symbol.toStringTag] === 'AsyncFunction';
                }
                return typeof obj[name] === type;
            });
        });
    }

    read() {
        let output = {};
        Object.getOwnPropertyNames(this.#template).forEach(name => {
            if( this.#template[name] instanceof Template ){
                output[name] = this.#template[name].read();
            } else {
                output[name] = this.#template[name];
            }
        });
        return output;
    }
}

export const templateTypesEnum = Object.freeze({
    UNDEFINED: 'undefined',
    BOOLEAN: 'boolean',
    NUMBER: 'number',
    STRING: 'string',
    BIGINT: 'bigint',
    SYMBOL: 'symbol',
    OBJECT: 'object',
    FUNCTION: 'function',
    ASYNC: 'async'
});