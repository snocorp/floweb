dojo.provide("net.sf.flophase.data.CashFlowStore");

dojo.require("dojo.date.stamp");

dojo.require("net.sf.flophase.data.AccountStore");
dojo.require("net.sf.flophase.data.TransactionStore");
dojo.require("net.sf.flophase.model.CashFlow");

/**
 * CashFlowStore
 *
 * This class is a persistent object that allows the application to access and
 * update the data.
 */
dojo.declare("net.sf.flophase.data.CashFlowStore", null, {
    /**
     * Loads and stores the cashflow from the server. Gets the data
     * asyncronously by first getting the accounts, then the historic
     * transactions, then the upcoming transactions. Finally it updates the
     * balances.
     *
     * @param options.success The function to invoke upon success. Takes a
     *                        reference to the cashflow as an argument.
     * @param options.error
     */
    getCashFlow: function(options)  {
        var _this = this; //store a reference to this for use in the callback
        this._cashflow = new net.sf.flophase.model.CashFlow();

        var currDate = new Date();

        var accountStore = new net.sf.flophase.data.AccountStore();
        var xactionStore = new net.sf.flophase.data.TransactionStore();

        accountStore.getAccounts({
            success: function(accounts) { 
                _this.handleAccounts(accounts);

                xactionStore.getTransactions({
                    date: currDate,
                    historic: true,
                    success: function(xactions) {
                        _this.handleHistoricTransactions(xactions);

                        xactionStore.getTransactions({
                            date: currDate,
                            historic: false,
                            success: function(xactions) {
                                _this.handleUpcomingTransactions(xactions);

                                _this.updateBalances(_this._cashflow);

                                options.success(_this._cashflow);
                            },
                            error: options.error
                        });
                    },
                    error: options.error
                });
            },
            error: options.error
        });
    },
    /**
     * Handles the accounts sent from the server. Sets the cashflow's accounts.
     *
     * @param accounts The accounts sent from the server.
     */
    handleAccounts: function(accounts) {
        this._cashflow.setAccounts(accounts);
    },
    /**
     * Handles historic transactions from the server. Adds these transactions to
     * the current set of transactions and re-sorts them.
     *
     * @param xactions The transactions from the server.
     */
    handleHistoricTransactions: function(xactions) {
        var origXactions = this._cashflow.getTransactions();

        xactions = xactions.concat(origXactions);
        xactions.sort(this._xactionSorter);

        this._cashflow.setTransactions(xactions);
    },
    /**
     * Handles upcoming transactions from the server. Adds these transactions to
     * the current set of transactions and re-sorts them.
     *
     * @param xactions The transactions from the server.
     */
    handleUpcomingTransactions: function(xactions) {
        var origXactions = this._cashflow.getTransactions();

        xactions = origXactions.concat(xactions);
        xactions.sort(this._xactionSorter);

        this._cashflow.setTransactions(xactions);
    },
    /**
     * Adds a new account to the cashflow.
     *
     * @param options.name The account name
     * @param options.balance The current balance
     * @param options.success The function to call upon success. Takes the new
     *                        account as a parameter.
     * @param options.error The function to call upon error, takes a single
     *                      string parameter
     */
    addAccount: function(options) {
        var _this = this; //store a reference to this for use in the callback

        var accountStore = new net.sf.flophase.data.AccountStore();
        accountStore.addAccount({
            name: options.name,
            balance: options.balance,
            success: function(account) {
                var accounts = _this._cashflow.getAccounts();
                accounts.push(account);
                _this._cashflow.setAccounts(accounts);

                options.success(account);
            },
            error: options.error
        });
    },
    /**
     * Deletes an existing account from the cashflow.
     *
     * @param options.key The account key
     * @param options.success The function to call upon success
     * @param options.error The function to call upon error, takes a single
     *                      string parameter
     */
    deleteAccount: function(options) {
        var _this = this; //store a reference to this for use in the callback

        var accountStore = new net.sf.flophase.data.AccountStore();
        accountStore.deleteAccount({
            key: options.key,
            success: function() {
                var i;

                //remove the account
                var accounts = _this._cashflow.getAccounts();
                for (i in accounts) {
                    if (accounts[i].key == options.key) {
                        accounts.splice(i, 1);
                        break;
                    }
                }
                _this._cashflow.setAccounts(accounts);

                //remove any entries for the account
                var xactions = _this._cashflow.getTransactions();
                for (i in xactions) {
                    //remove entry if it exists
                    if (xactions[i].entries[options.key]) {
                        delete xactions[i].entries[options.key];
                    }
                }

                options.success();
            },
            error: options.error
        });
    },
    /**
     * Edits an existing account. Updates one or both of the name and the
     * balance. If the balance is updated, updates all balances.
     *
     * @param options.key The key of the account
     * @param options.name The new name
     * @param options.balance The new balance
     * @param options.success The function to call upon success
     * @param options.error The function to call upon error, takes a single
     *                      string parameter
     */
    editAccount: function(options) {
        var account = this._cashflow.getAccount(options.key);

        if (options.name) {
            account.name = options.name;
        }
        if (options.balance) {
            account.balance = options.balance;

            this.updateBalances(this._cashflow);
        }

        var accountStore = new net.sf.flophase.data.AccountStore();
        accountStore.editAccount({
            account: account,
            success: options.success,
            error: options.error
        });
    },
    /**
     * Adds an entry to a transaction. Updates the balances.
     *
     * @param options.acctKey The key of the account
     * @param options.xactionKey The key of the transaction
     * @param options.amount The amount of the entry
     * @param options.success The function to call upon success. Takes the new
     *                        entry as a parameter.
     * @param options.error The function to call upon error, takes a single
     *                      string parameter
     */
    addEntry: function(options) {
        var _this = this; //store a reference to this for use in the callback

        var xactionStore = new net.sf.flophase.data.TransactionStore();
        xactionStore.addEntry({
            key: options.acctKey,
            xaction: options.xactionKey,
            amount: options.amount,
            success: function(entry) {
                var xaction = _this._cashflow.getTransaction(options.xactionKey);
                xaction.entries[options.acctKey] = entry;

                _this.updateBalances(_this._cashflow);

                options.success(entry);
            },
            error: options.error
        });
    },
    /**
     * Edits an entry amount. Updates the balances.
     *
     * @param options.key The key of the entry
     * @param options.acctKey The key of the account
     * @param options.xactionKey The key of the transaction
     * @param options.amount The amount of the entry
     * @param options.success The function to call upon success. Takes the new
     *                        entry as a parameter.
     * @param options.error The function to call upon error, takes a single
     *                      string parameter
     */
    editEntry: function(options) {
        var _this = this; //store a reference to this for use in the callback

        var xactionStore = new net.sf.flophase.data.TransactionStore();
        xactionStore.editEntry({
            key: options.key,
            amount: options.amount,
            success: function() {
                //update the entry
                var xaction = _this._cashflow.getTransaction(options.xactionKey);
                xaction.entries[options.acctKey].amount = options.amount;

                _this.updateBalances(_this._cashflow);

                options.success(xaction.entries[options.acctKey]);
            },
            error: options.error
        });
    },
    addTransaction: function(options) {
        var _this = this; //store a reference to this for use in the callback

        var xactionStore = new net.sf.flophase.data.TransactionStore();
        xactionStore.addTransaction({
            name: options.name,
            date: options.date,
            success: function(xaction) {
                var xactions = _this._cashflow.getTransactions();
                xactions.push(xaction);
                _this._cashflow.setTransactions(xactions);

                _this.updateBalances(_this._cashflow);

                options.success(xaction);
            },
            error: options.error
        });
    },
    deleteTransaction: function(options) {
        var _this = this; //store a reference to this for use in the callback

        var xactionStore = new net.sf.flophase.data.TransactionStore();
        xactionStore.deleteTransaction({
            key: options.key,
            success: function() {
                var xactions = _this._cashflow.getTransactions();
                for (var i in xactions) {
                    if (xactions[i].key == options.key) {
                        xactions.splice(i, 1);
                        break;
                    }
                }
                _this._cashflow.setTransactions(xactions);

                _this.updateBalances(_this._cashflow);

                options.success();
            },
            error: options.error
        });
    },
    editTransaction: function(options) {
        var xaction = this._cashflow.getTransaction(options.key);

        if (options.name) {
            xaction.name = options.name;
        }
        if (options.date) {
            xaction.date = dojo.date.stamp.toISOString(options.date, {selector: 'date'});

            //re-sort the transactions
            var xactions = this._cashflow.getTransactions();
            xactions.sort(this._xactionSorter);

            this.updateBalances(this._cashflow);
        }

        var xactionStore = new net.sf.flophase.data.TransactionStore();
        xactionStore.editTransaction({
            xaction: xaction,
            success: options.success,
            error: options.error
        });
    },
    updateBalances: function(cashflow) {
        var xactions = cashflow.getTransactions();
        var accounts = cashflow.getAccounts();

        var currentBalance = {};
        for (var j in accounts) {
            currentBalance[accounts[j].key] = accounts[j].balance;
        }

        var historic = []; //holder for historic transactions
        var now = new Date();
        var amount;
        var entry;

        for (var i in xactions) {
            var xactionDate = dojo.date.stamp.fromISOString(xactions[i].date);
            if (xactionDate < now) {
                historic.unshift(xactions[i]);
            } else {
                if (!xactions[i].balances) {
                    xactions[i].balances = {};
                }
                for (j in accounts) {
                    entry = xactions[i].entries[accounts[j].key];
                    if (entry) {
                        amount = entry.amount;
                    } else {
                        amount = 0;
                    }
                    currentBalance[accounts[j].key] += amount;
                    xactions[i].balances[accounts[j].key] = currentBalance[accounts[j].key];
                }
            }
        }

        //reset the balances
        for (j in accounts) {
            currentBalance[accounts[j].key] = accounts[j].balance;
        }

        //now deal with the historic transactions
        for (i in historic) {
            if (!historic[i].balances) {
                historic[i].balances = {};
            }
            for (j in accounts) {
                entry = historic[i].entries[accounts[j].key];
                if (entry) {
                    amount = entry.amount;
                } else {
                    amount = 0;
                }
                currentBalance[accounts[j].key] -= amount;
                historic[i].balances[accounts[j].key] = currentBalance[accounts[j].key];
            }
        }
    },
    _xactionSorter: function(a, b) {
        return (a.date > b.date) ? 1 : ((a.date < b.date) ? -1 : 0);
    }
});