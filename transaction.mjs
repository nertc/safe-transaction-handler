import Validator from './validator.mjs';
import { Template, templateTypesEnum as templateTypes } from './template.mjs';
import deepCopy from './copy.mjs';
import CustomError from './error.mjs';

export default class Transaction {
    constructor() {
        this.store = null;
        this.logs = [];
        this.status = 0;
        Object.defineProperty(this, 'statusText', {
            get() {
                switch(this.status) {
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
        });
    }

    async dispatch( scenario ) {
        this.status = 0;
        if( !this.validateScenario( scenario ) ) {
            throw new TypeError(`Scenario is not compatible`);
        }

        const sortedSteps = new Map();
        scenario.forEach(step => sortedSteps.set(step.index, step));

        if( scenario.length && sortedSteps.get(scenario.length).restore !== undefined ) {
            throw new TypeError("Last step of the scenario mustnt't have a restore function");
        }

        this.status = 4;
        this.store = {};
        this.logs = [];

        await this.#call( sortedSteps );
    }

    async #call( steps ) {
        for( let index = 1; index <= steps.size; ++index ) {
            const step = steps.get(index);

            const log = await this.#getLog(step, 'call');
            this.logs.push(log);
            if( log.error !== null ) {
                await this.#rollback(steps, index);
                this.store = null;
                return false;
            }
        }
        this.status = 1;
        return true;
    }

    async #rollback( steps, index ) {
        while( --index ) {
            const step = steps.get(index);
            if( step.restore === undefined ) {
                if( step.crucial ) {
                    this.status = 3;
                    throw new ReferenceError(`Crucial step has no restore`);
                } else {
                    continue;
                }
            }

            const log = await this.#getLog(step, 'restore');
            if( log.error !== null ) {
                this.status = 3;
                throw new CustomError(log.error.message, {
                    log,
                    logs: this.logs
                });
            }
        }
        this.status = 2;
        return true;
    }

    async #getLog(step, functionName) {
        let log = {
            index: step.index,
            meta: {...step.meta},
        };
        try{
            const storeBefore = deepCopy(this.store);
            await step[functionName](this.store);
            const storeAfter = deepCopy(this.store);
            const error = null;
            log = {
                ...log,
                storeBefore,
                storeAfter,
                error
            };
        } catch(error) {
            const {name, message, stack} = error;
            log.error = {
                name,
                message,
                stack
            };
        }
        return log;
    }

    validateScenario( scenario ) {
        Validator.isInstanceOf(scenario, Array, `Scenario must be an Array`);
        if( scenario.length === 0 ) return true;
        
        if( scenario.some(step => !stepTemplate.check(step)) ) {
            throw TypeError(`At least one of the scenario's steps doesn't setisfy template`);
        }

        let minIndex = Infinity, maxIndex = -Infinity, indexes = new Set();
        scenario.forEach(step => {
            minIndex = Math.min(minIndex, step.index);
            maxIndex = Math.max(maxIndex, step.index);
            if( indexes.has(step.index) ) {
                throw RangeError(`Scenario mustn't have two identical indexes (${step.index})`);
            }
            indexes.add(step.index);
        });
        if( minIndex !== 1 || maxIndex !== scenario.length ) {
            throw new RangeError(`MinIndex (${minIndex}) must be 1 and MaxIndex (${maxIndex}) must be ${scenario.length}`);
        }

        return true;
    }
}

const metaTemplate = new Template();
metaTemplate.addAll(
    ['title',       templateTypes.STRING],
    ['description', templateTypes.STRING]
)

const stepTemplate = new Template();
stepTemplate.addAll(
    ['index',   templateTypes.NUMBER],
    ['meta',    metaTemplate],
    ['call',    templateTypes.ASYNC],
    ['restore', templateTypes.ASYNC, templateTypes.UNDEFINED],
    // If true, rollback will throw an error if restore is not specified
    ['crucial', templateTypes.BOOLEAN, templateTypes.UNDEFINED] 
);