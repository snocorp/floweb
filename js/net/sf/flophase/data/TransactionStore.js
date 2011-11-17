dojo.provide("net.sf.flophase.data.TransactionStore");

dojo.require("dojo.date.stamp");

/**
 * TransactionStore
 *
 * This class is the main interface for the cash flow store to transaction
 * related data.
 */
dojo.declare("net.sf.flophase.data.TransactionStore", null, {
    /**
     * Gets the transactions from the server.
     * 
     * @param options.historic True to get transactions before the given date or
     *                         false for transactions after.
     * @param options.date The date before or after which to get the 
     *                     transactions.
     * @param options.success The function to invoke upon success. Takes an 
     *                        array of transactions as a parameter
     * @param options.error The function to invoke upon error, takes a single 
     *                      string parameter
     */
    getTransactions: function(options) {
        dojo.xhrGet({
            url: "xaction/q",
            content: {
                hist: options.historic,
                date: dojo.date.stamp.toISOString(options.date, {selector: 'date'})
            },
            handleAs: "json",
            load: function(jsonData) {
                if (jsonData.result == 1) { //SUCCESS
                    options.success(jsonData.transactions);
                } else {
                    options.error(jsonData.message);
                }
           },
           error: function() {
               options.error("Unable to load transactions.");
           }
        });
    },
    /**
     * Adds a transaction.
     *
     * @param options.name The name of the transaction
     * @param options.date The date of the transaction
     * @param options.success The function to invoke upon success. Takes the new
     *                        new transaction as a parameter
     * @param options.error The function to invoke upon error, takes a single
     *                      string parameter
     */
    addTransaction: function(options) {
        dojo.xhrGet({
            url: "xaction/add",
            content: {
                name: options.name,
                date: options.date
            },
            handleAs: "json",
            load: function(jsonData) {
                if (jsonData.result == 1) { //SUCCESS
                    options.success(jsonData.transaction);
                } else {
                    options.error(jsonData.message);
                }
           },
           error: function() {
               options.error("Unable to add transaction.");
           }
        });
    },
    /**
     * Deletes a transaction.
     *
     * @param options.key The transaction key
     * @param options.success The function to invoke upon success
     * @param options.error The function to invoke upon error, takes a single
     *                      string parameter
     */
    deleteTransaction: function(options) {
        dojo.xhrGet({
            url: "xaction/delete",
            content: {
                key: options.key
            },
            handleAs: "json",
            load: function(jsonData) {
                if (jsonData.result == 1) { //SUCCESS
                    options.success();
                } else {
                    options.error(jsonData.message);
                }
           },
           error: function() {
               options.error("Unable to delete transaction.");
           }
        });
    },
    /**
     * Edits a transaction.
     *
     * @param options.xaction The updated transaction
     * @param options.success The function to invoke upon success. Takes the new
     *                        edited transaction as a parameter
     * @param options.error The function to invoke upon error, takes a single
     *                      string parameter
     */
    editTransaction: function(options) {
        dojo.xhrGet({
            url: "xaction/edit",
            content: {
                key: options.xaction.key,
                name: options.xaction.name,
                date: options.xaction.date
            },
            handleAs: "json",
            load: function(jsonData) {
                if (jsonData.result == 1) { //SUCCESS
                    options.success(options.xaction);
                } else {
                    options.error(jsonData.message);
                }
           },
           error: function() {
               options.error("Unable to edit transaction.");
           }
        });
    },
    /**
     * Adds an entry to a transaction.
     *
     * @param options.key The key of the account
     * @param options.xaction The key of the transaction
     * @param options.amount The amount of the entry
     * @param options.success The function to call upon success. Takes the new
     *                        entry as a parameter.
     * @param options.error The function to call upon error, takes a single
     *                      string parameter
     */
    addEntry: function(options) {
        dojo.xhrGet({
            url: "entry/edit",
            content: {
                key: options.key,
                xaction: options.xaction,
                amount: options.amount
            },
            handleAs: "json",
            load: function(jsonData) {
                if (jsonData.result == 1) { //SUCCESS                    
                    options.success(jsonData.entry);
                } else {
                    options.error(jsonData.message);
                }
           },
           error: function() {
               options.error("Unable to edit entry.");
           }
        });
    },
    /**
     * Edits an existing entry.
     *
     * @param options.key The key of the entry
     * @param options.amount The amount of the entry
     * @param options.success The function to call upon success. Takes the
     *                        edited entry as a parameter.
     * @param options.error The function to call upon error, takes a single
     *                      string parameter
     */
    editEntry: function(options) {
        dojo.xhrGet({
            url: "entry/edit",
            content: {
                key: options.key,
                amount: options.amount
            },
            handleAs: "json",
            load: function(jsonData) {
                if (jsonData.result == 1) { //SUCCESS
                    options.success();
                } else {
                    options.error(jsonData.message);
                }
           },
           error: function() {
               options.error("Unable to edit entry.");
           }
        });
    }
});