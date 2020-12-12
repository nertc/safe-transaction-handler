import deepCopy from './copy.mjs';

export default class CustomError extends Error {
    #properties;
    constructor(message, properties) {
        super(message);
        this.#properties = [];
        if( typeof properties === 'object' && properties !== null ) {
            Object.getOwnPropertyNames(properties).forEach( property => {
                this[property] = deepCopy(properties[property]);
                this.#properties.push(property);
            });
        }
    }

    print() {
        console.log(this.stack);
        this.#properties.forEach(prop => console.log(this[prop]));
    }
}