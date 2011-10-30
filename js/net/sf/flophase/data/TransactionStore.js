dojo.provide("net.sf.flophase.data.TransactionStore");

dojo.require("dojo.date.stamp");

dojo.declare("net.sf.flophase.data.TransactionStore", null, {
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