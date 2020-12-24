class CustomError extends Error {
    #properties: string[];
    constructor(message: string, properties?: object) {
        super(message);
        this.#properties = [];
        if( properties ) {
            Object.getOwnPropertyNames(properties).forEach( property => {
                this[property] = Copy.deepCopy(properties[property]);
                this.#properties.push(property);
            });
        }
    }

    print(): void {
        console.log(this.stack);
        this.#properties.forEach(prop => console.log(this[prop]));
    }
}