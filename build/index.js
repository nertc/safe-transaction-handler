var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, privateMap, value) {
    if (!privateMap.has(receiver)) {
        throw new TypeError("attempted to set private field on non-instance");
    }
    privateMap.set(receiver, value);
    return value;
};
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, privateMap) {
    if (!privateMap.has(receiver)) {
        throw new TypeError("attempted to get private field on non-instance");
    }
    return privateMap.get(receiver);
};
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
;
;
var Copy;
(function (Copy) {
    // JSON.parse(JSON.stringify) loses data
    function deepCopy(obj) {
        if (typeof obj !== 'object'
            || obj === null
            || obj instanceof WeakMap
            || obj instanceof WeakSet) {
            return obj;
        }
        switch (obj.constructor) {
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
    Copy.deepCopy = deepCopy;
    function copyMap(map) {
        let entries = [];
        for (const couple of map.entries()) {
            entries.push([deepCopy(couple[0]), deepCopy(couple[1])]);
        }
        return new Map(entries);
    }
    function copySet(set) {
        let values = [];
        for (const value of set.values()) {
            values.push(deepCopy(value));
        }
        return new Set(values);
    }
    function copyArray(array) {
        let values = [];
        for (const value of array) {
            values.push(deepCopy(value));
        }
        return values;
    }
    function copyObject(obj) {
        let output = Object.create(Object.getPrototypeOf(obj));
        Object.getOwnPropertyNames(obj).forEach(property => {
            let descriptors = Object.getOwnPropertyDescriptor(obj, property);
            if (descriptors.hasOwnProperty('value')) {
                descriptors.value = deepCopy(descriptors.value);
            }
            Object.defineProperty(output, property, descriptors);
        });
        return output;
    }
})(Copy || (Copy = {}));
var Validator;
(function (Validator) {
    function define(key) {
        return function (target, propertyKey, parameterIndex) {
            target[key] = parameterIndex;
        };
    }
    Validator.define = define;
})(Validator || (Validator = {}));
var _properties;
class CustomError extends Error {
    constructor(message, properties) {
        super(message);
        _properties.set(this, void 0);
        __classPrivateFieldSet(this, _properties, []);
        if (properties) {
            Object.getOwnPropertyNames(properties).forEach(property => {
                this[property] = Copy.deepCopy(properties[property]);
                __classPrivateFieldGet(this, _properties).push(property);
            });
        }
    }
    print() {
        console.log(this.stack);
        __classPrivateFieldGet(this, _properties).forEach(prop => console.log(this[prop]));
    }
}
_properties = new WeakMap();
class Transaction {
    constructor() {
        this.store = null;
        this.logs = [];
        this.status = 0;
    }
    get statusText() {
        switch (this.status) {
            case 0:
                return 'Not Started';
            case 1:
                return 'SUCCEED';
            case 2:
                return 'FAILED: restored without error';
            case 3:
                return 'FAILED: restored with error';
            case 4:
                return 'Running';
            default:
                return 'Unknown';
        }
    }
    async dispatch(scenario) {
        this.status = 0;
        const sortedSteps = new Map();
        scenario.forEach(step => sortedSteps.set(step.index, step));
        if (scenario.length && sortedSteps.get(scenario.length).restore !== undefined) {
            throw new TypeError("Last step of the scenario mustnt't have a restore function");
        }
        this.status = 4;
        this.store = {};
        this.logs = [];
        await this.call(sortedSteps);
    }
    async call(steps) {
        for (let index = 1; index <= steps.size; ++index) {
            const step = steps.get(index);
            const log = await this.getLog(step, 'call');
            this.logs.push(log);
            if (log.error) {
                await this.rollback(steps, index);
                this.store = null;
                return;
            }
        }
        this.status = 1;
    }
    async rollback(steps, index) {
        while (--index) {
            const step = steps.get(index);
            if (step.restore === undefined) {
                if (step.crucial) {
                    this.status = 3;
                    throw new CustomError(`Crucial step has no restore`, {
                        logs: this.logs
                    });
                }
                else {
                    continue;
                }
            }
            const log = await this.getLog(step, 'restore');
            if (log.error) {
                this.status = 3;
                throw new CustomError(log.error.message, {
                    log,
                    logs: this.logs
                });
            }
        }
        this.status = 2;
    }
    async getLog(step, functionName) {
        let log = {
            index: step.index,
            meta: Object.assign({}, step.meta),
            error: null
        };
        try {
            const storeBefore = Copy.deepCopy(this.store);
            await step[functionName](this.store);
            const storeAfter = Copy.deepCopy(this.store);
            const error = null;
            log = Object.assign(Object.assign({}, log), { storeBefore,
                storeAfter,
                error });
        }
        catch (error) {
            const { name, message, stack } = error;
            log.error = {
                name,
                message,
                stack
            };
        }
        return log;
    }
    static validateScenario(target, propertyName, descriptor) {
        const method = descriptor.value;
        descriptor.value = function () {
            if (!(Transaction.scenario in target)) {
                throw new ReferenceError("Scenario is not found");
            }
            const scenario = arguments[target[Transaction.scenario]];
            if (scenario.length === 0)
                return method.apply(this, arguments);
            let minIndex = Infinity, maxIndex = -Infinity, indexes = new Set();
            scenario.forEach(step => {
                minIndex = Math.min(minIndex, step.index);
                maxIndex = Math.max(maxIndex, step.index);
                if (indexes.has(step.index)) {
                    throw RangeError(`Scenario mustn't have two identical indexes (${step.index})`);
                }
                indexes.add(step.index);
            });
            if (minIndex !== 1 || maxIndex !== scenario.length) {
                throw new RangeError(`MinIndex (${minIndex}) must be 1 and MaxIndex (${maxIndex}) must be ${scenario.length}`);
            }
            return method.apply(this, arguments);
        };
    }
}
Transaction.scenario = Symbol('Scenario');
__decorate([
    Transaction.validateScenario,
    __param(0, Validator.define(Transaction.scenario)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Array]),
    __metadata("design:returntype", Promise)
], Transaction.prototype, "dispatch", null);
const scenario = [
    {
        index: 1,
        meta: {
            title: 'Read popular customers',
            description: 'This action is responsible for reading the most popular customers'
        },
        // callback for main execution
        call: async (store) => { store['a'] = 5; },
    }
];
const transaction = new Transaction();
(async () => {
    try {
        await transaction.dispatch(scenario);
        const store = transaction.store; // {} | null
        const logs = transaction.logs; // []
        console.log(store);
        console.log(logs);
    }
    catch (err) {
        // log detailed error
        if (err instanceof CustomError) {
            err.print();
        }
        else {
            console.log(err);
        }
    }
    console.log(transaction.statusText);
})();
