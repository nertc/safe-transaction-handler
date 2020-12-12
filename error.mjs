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

    toString() {
        let output = `${this.name}: ${this.message}`;
        output = this.#properties.reduce((prev, cur) => `${prev}\n${cur}`, output);
        if( this.stack ) output += `\n${this.stack}`;
        
        return output;
    }
}