import deepCopy from './copy.mjs';

export default class CustomError extends Error {
    constructor(message, properties) {
        super(message);
        if( typeof properties === 'object' && properties !== null ) {
            Object.getOwnPropertyNames(properties).forEach( property => {
                this[property] = deepCopy(properties[property]);
            });
        }
    }
}