dojo.provide("net.sf.flophase.model.CashFlow");

/**
 * CashFlow
 *
 * This class stores the data about the cashflow. It keeps a list of the
 * accounts and the transactions as well as key value maps of accounts and
 * transactions.
 */
dojo.declare("net.sf.flophase.model.CashFlow", null, {
    _accounts: [],
    _accountMap: {},
    _transactions: [],
    _transactionMap: {},

    /**
     * Returns the account with the given key.
     *
     * @param acctKey The key of the account
     */
    getAccount: function(acctKey) {
        return this._accountMap[acctKey];
    },
    /**
     * Returns the list of accounts.
     */
    getAccounts: function() {
        return this._accounts;
    },
    /**
     * Returns the transaction with the given key.
     *
     * @param xactionKey The key of the transaction
     */
    getTransaction: function(xactionKey) {
        return this._transactionMap[xactionKey];
    },
    /**
     * Returns the list of transactions.
     */
    getTransactions: function() {
        return this._transactions;
    },
    /**
     * Sets the list of accounts. Re-builds the account map.
     */
    setAccounts: function(accounts) {
        this._accounts = accounts.slice(0);

        this._accountMap = {}; //clear the map
        for (var i in this._accounts) {
            this._accountMap[this._accounts[i].key] = this._accounts[i];
        }
    },
    /**
     * Sets the list of transactions. Re-builds the transaction map.
     */
    setTransactions: function(transactions) {
        this._transactions = transactions.slice(0);

        this._transactionMap = {}; //clear the map
        for (var i in this._transactions) {
            this._transactionMap[this._transactions[i].key] = this._transactions[i];
        }
    }
});