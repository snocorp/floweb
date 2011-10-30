dojo.provide("net.sf.flophase.model.CashFlow");

dojo.declare("net.sf.flophase.model.CashFlow", null, {
    _accounts: [],
    _accountMap: {},
    _transactions: [],
    _transactionMap: {},

    getAccount: function(acctKey) {
        return this._accountMap[acctKey];
    },
    getAccounts: function() {
        return this._accounts;
    },
    getTransaction: function(xactionKey) {
        return this._transactionMap[xactionKey];
    },
    getTransactions: function() {
        return this._transactions;
    },
    setAccounts: function(accounts) {
        this._accounts = accounts.slice(0);

        this._accountMap = {}; //clear the map
        for (var i in this._accounts) {
            this._accountMap[this._accounts[i].key] = this._accounts[i];
        }
    },
    setTransactions: function(transactions) {
        this._transactions = transactions.slice(0);

        this._transactionMap = {}; //clear the map
        for (var i in this._transactions) {
            this._transactionMap[this._transactions[i].key] = this._transactions[i];
        }
    }
});