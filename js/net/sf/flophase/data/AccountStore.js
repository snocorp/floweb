dojo.provide("net.sf.flophase.data.AccountStore");

/**
 * AccountStore
 *
 * This class is the main interface for the cash flow store to account-related
 * data.
 */
dojo.declare("net.sf.flophase.data.AccountStore", null, {
    /**
     * Loads the accounts from the server.
     *
     * @param options.success The function to invoke upon success
     * @param options.error The function to invoke upon error, takes a single string parameter
     */
    getAccounts: function(options) {
        dojo.xhrGet({
            url: "account/q",
            handleAs: "json",
            load: function(jsonData) {
                if (jsonData.result == 1) { //SUCCESS
                    options.success(jsonData.accounts);
                } else {
                    options.error(jsonData.message);
                }
           },
           error: function() {
               options.error("Unable to load accounts.");
           }
        });
    },
    /**
     * Adds a new account.
     *
     * @param options.name The account name
     * @param options.balance The current balance
     * @param options.success The function to call upon success
     * @param options.error The function to call upon error, takes a single string parameter
     */
    addAccount: function(options) {
        dojo.xhrGet({
            url: "account/add",
            content: {
                name: options.name,
                balance: options.balance
            },
            handleAs: "json",
            load: function (jsonData) {
                if (jsonData.result == 1) { //SUCCESS
                    options.success(jsonData.account);
                } else {
                    options.error(jsonData.message);
                }
            },
            error: function() {
                options.error("Unable to add account.");
            }
        });
    },
    /**
     * Deletes an existing account.
     *
     * @param options.key The account key
     * @param options.success The function to call upon success
     * @param options.error The function to call upon error, takes a single string parameter
     */
    deleteAccount: function(options) {
        dojo.xhrGet({
            url: "account/delete",
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
                options.error("Unable to delete account.");
            }
        });
    },
    /**
     * Edits an existing account.
     *
     * @param options.account The updated account object
     * @param options.success The function to call upon success
     * @param options.error The function to call upon error, takes a single string parameter
     */
    editAccount: function(options) {
        dojo.xhrGet({
            url: "account/edit",
            content: {
                key: options.account.key,
                name: options.account.name,
                balance: options.account.balance
            },
            handleAs: "json",
            load: function(jsonData) {
                if (jsonData.result == 1) { //SUCCESS
                    options.success(options.account);
                } else {
                    options.error(jsonData.message);
                }
            },
            error: function() {
                options.error("Unable to edit account.");
            }
        });
    }
});