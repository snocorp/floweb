dojo.provide("net.sf.flophase.data.AccountStore");

dojo.declare("net.sf.flophase.data.AccountStore", null, {
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