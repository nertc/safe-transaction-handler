import CustomError from './error.mjs';
import Transaction from './transaction.mjs';

const scenario = [
    {
        index: 1,
        meta: {
            title: 'Read popular customers',
            description: 'This action is responsible for reading the most popular customers'
        },
				// callback for main execution
        call: async (store) => {},
				// callback for rollback
        restore: async (store) => {}
    }
];

const transaction = new Transaction();

(async() => {
    try {
			await transaction.dispatch(scenario);
			const store = transaction.store; // {} | null
            const logs = transaction.logs; // []
            console.log(store);
            console.log(logs);
    } catch (err) {
            // log detailed error
            if( err instanceof CustomError ) {
                err.print();
            } else {
                console.log(err);
            }
    }
    console.log(transaction.statusText);
})();
