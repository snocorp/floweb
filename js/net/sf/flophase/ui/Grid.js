dojo.provide("net.sf.flophase.ui.Grid");

dojo.require("dojo.currency");
dojo.require("dojo.date.locale");
dojo.require("dojo.date.stamp");

dojo.require("net.sf.flophase.data.CashFlowStore");
dojo.require("net.sf.flophase.model.CashFlow");

dojo.declare("net.sf.flophase.ui.Grid", null, {
    /**
     * Initializes the grid and adds it to the given DOM node.
     *
     * @param options.cashflow The cashflow the will be represented by the grid
     * @param srcNodeRef The id of the DOM node
     */
    init: function(options, srcNodeRef) {
        var gridContainer = dojo.byId(srcNodeRef);

        gridContainer.appendChild(this.createTable(options.cashflow));
    },
    /**
     * Creates a table using the given cashflow as the model.
     */
    createTable: function(cashflow) {
        var accounts = cashflow.getAccounts();

        var table = document.createElement("table");
        table.id = 'cashFlowTable';
        table.className = 'flo-cashflow';

        //create the header rows
        table.appendChild(this.createFirstHeaderRow(accounts));
        table.appendChild(this.createSecondHeaderRow(accounts));

        //create the historic table body
        var historicBody = document.createElement("tbody");
        historicBody.id = 'historicBody';
        table.appendChild(historicBody);

        //create the current table body
        var currentBody = document.createElement("tbody");
        currentBody.id = 'currentBody';

        //add the current info row
        currentBody.appendChild(this.createCurrentRow(accounts));
        table.appendChild(currentBody);

        //create the upcoming table body
        var upcomingBody = document.createElement("tbody");
        upcomingBody.id = 'upcomingBody';
        table.appendChild(upcomingBody);

        var activeBody = historicBody;

        var transactions = cashflow.getTransactions();
        var currentDate = new Date();
        var foundCurrentRow = false;
        for (var i in transactions) {

            //if we have not yet reached the row that should contain the current info
            if (!foundCurrentRow) {
                var xactionDate = dojo.date.stamp.fromISOString(transactions[i].date);

                //if this transactions date if after the current date
                if (xactionDate > currentDate) {
                    //switch to the third table body
                    activeBody = upcomingBody;

                    foundCurrentRow = true;
                }
            }

            //the transaction row
            activeBody.appendChild(this.createTransactionRow(transactions[i], accounts));
        }

        return table;
    },
    /**
     * Creates a row representing the given transaction.
     *
     * @param transaction The transaction for the row.
     * @param accounts The list of accounts.
     */
    createTransactionRow: function(transaction, accounts) {
        var xactionRow = document.createElement("tr");
        xactionRow.id = 'xaction_' + transaction.key;
        xactionRow.className = 'flo-xaction';

        //the cell for the transactions name
        xactionRow.appendChild(this.createTransactionNameCell(transaction));

        //loop through the accounts to create the entry cells
        var j;
        for (j in accounts) {
            var value;
            var key;
            var entry = transaction.entries[accounts[j].key];
            if (entry) {
                key = entry.key;
                value = entry.amount;
            } else {
                key = null;
                value = 0;
            }


            xactionRow.appendChild(
                this.createTransactionEntryCell(value, transaction.key, accounts[j].key, key)
            );
        }

        //add the date cell
        xactionRow.appendChild(this.createTransactionDateCell(transaction));

        //loop through the accounts to create the balance cells
        for (j in accounts) {
            var balance;
            if (transaction.balances) {
                balance = transaction.balances[accounts[j].key];
            } else {
                balance = accounts[j].balance;
            }

            xactionRow.appendChild(this.createTransactionBalanceCell(transaction.key, accounts[j].key, balance));
        }

        return xactionRow;
    },
    /**
     * Creates a cell for the transaction name.
     *
     * @param transaction The transaction
     */
    createTransactionNameCell: function(transaction) {
        var xactionNameCell = document.createElement("td");
        xactionNameCell.id = 'name_' + transaction.key;
        xactionNameCell.className = 'flo-xactionname';

        //when the user clicks the cell, it will become editable
        xactionNameCell.onclick = function(key, value) {return function(event) {
            app.showEditTransaction(
                    event,
                    this.id,
                    key,
                    value);
        }}(transaction.key, transaction.name);

        //put the name in the cell
        xactionNameCell.appendChild(document.createTextNode(transaction.name));

        return xactionNameCell;
    },
    /**
     * Creates a cell for a transaction entry.
     *
     * @param value The value of the entry
     * @param xactionKey The key of the transaction
     * @param acctKey The key of the account
     * @param entryKey The key of the entry, optional
     */
    createTransactionEntryCell: function(value, xactionKey, acctKey, entryKey) {
        var xactionEntryCell = document.createElement("td");
        xactionEntryCell.id = 'entry_'+acctKey+'_'+xactionKey;

        var key = entryKey ? entryKey : acctKey+'_'+xactionKey;

        var props = {
            id: 'entryInput_'+key,
            value: value,
            lang: 'en-us',
            currency: "USD",
            invalidMessage: "Invalid amount.",
            onBlur: function(value, xactionKey, acctKey, entryKey) {return function() {
                if (this.isValid() && this.value != value) {
                    app.editEntryAmount(this.value, xactionKey, acctKey, entryKey);
                }
            }}(value, xactionKey, acctKey, entryKey)
        };

        var entryAmountTextBox = new dijit.form.CurrencyTextBox(props);

        xactionEntryCell.appendChild(entryAmountTextBox.domNode);

        return xactionEntryCell;
    },
    /**
     * Creates a cell for the transaction date.
     *
     * @param transaction The transaction
     */
    createTransactionDateCell: function(transaction) {
        var xactionDateCell = document.createElement("td");
        xactionDateCell.id = 'date_'+transaction.key;

        //create the date selection text box
        var props = {
            id:'dateInput_'+transaction.key,
            value: transaction.date,
            onChange: function(xaction) {return function(newValue) {
                app.editTransactionDate(xaction.key, newValue, xaction.date);
            }}(transaction)
        };
        var xactionDateTextBox = new dijit.form.DateTextBox(props);

        xactionDateCell.appendChild(xactionDateTextBox.domNode);

        return xactionDateCell;
    },
    /**
     * Creates a cell for the transaction balance
     *
     * @param xactionKey The key of the transaction
     * @param accountKey The key of the account
     * @param balance The balance
     */
    createTransactionBalanceCell: function(xactionKey, accountKey, balance) {
        var xactionBalanceCell = document.createElement("td");
        xactionBalanceCell.id = 'balance_'+accountKey+'_'+xactionKey;
        xactionBalanceCell.className = 'flo-xactionbalance';

        var balanceText = dojo.currency.format(balance, {currency:'USD'});
        xactionBalanceCell.appendChild(document.createTextNode(balanceText));
        
        return xactionBalanceCell;
    },
    /**
     * Creates a table row for the first part of the header.
     *
     * @param accounts The list of accounts
     */
    createFirstHeaderRow: function(accounts) {
        var firstHeaderRow = document.createElement("tr");

        var transactionsHeader = document.createElement("th");
        transactionsHeader.id = 'xactionHeader';
        transactionsHeader.rowSpan = 2;
        transactionsHeader.appendChild(document.createTextNode("Transactions"));
        firstHeaderRow.appendChild(transactionsHeader);

        var entriesHeader = document.createElement("th");
        entriesHeader.id = 'entriesHeader';
        entriesHeader.colSpan = accounts.length;
        entriesHeader.appendChild(document.createTextNode("Entries"));
        firstHeaderRow.appendChild(entriesHeader);

        var dateHeader = document.createElement("th");
        dateHeader.id = 'dateHeader';
        dateHeader.rowSpan = 2;
        dateHeader.appendChild(document.createTextNode("Date"));
        firstHeaderRow.appendChild(dateHeader);

        var balanceHeader = document.createElement("th");
        balanceHeader.id = 'balanceHeader';
        balanceHeader.colSpan = accounts.length;
        balanceHeader.appendChild(document.createTextNode("Balance"));
        firstHeaderRow.appendChild(balanceHeader);

        return firstHeaderRow;
    },
    /**
     * Creates a table row for the second part of the header.
     *
     * @param accounts The list of accounts
     */
    createSecondHeaderRow: function(accounts) {
        var secondHeaderRow = document.createElement("tr");
        secondHeaderRow.id = 'accountHeaderRow';

        var accountHeader;
        var accountText;
        for (var i in accounts) {
            accountHeader = document.createElement("th");
            accountHeader.id = 'account_'+accounts[i].key;
            accountHeader.className = 'accountheader';

            //when the user clicks the cell, it will become editable
            accountHeader.onclick = function(key, value) {return function(event) {
                app.showEditAccount(
                        event,
                        this.id,
                        key,
                        value);
            }}(accounts[i].key, accounts[i].name);
            
            accountText = document.createTextNode(accounts[i].name);

            accountHeader.appendChild(accountText);
            secondHeaderRow.appendChild(accountHeader);
        }
        for (i in accounts) {
            accountHeader = document.createElement("th");
            accountHeader.id = 'accountbal_'+accounts[i].key;
            accountHeader.className = 'accountheader';

            //when the user clicks the cell, it will become editable
            accountHeader.onclick = function(key, value) {return function(event) {
                app.showEditAccount(
                        event,
                        this.id,
                        key,
                        value);
            }}(accounts[i].key, accounts[i].name);
            
            accountText = document.createTextNode(accounts[i].name);

            accountHeader.appendChild(accountText);
            secondHeaderRow.appendChild(accountHeader);
        }

        return secondHeaderRow;
    },
    /**
     * Creates a table row representing the current situation.
     *
     * @param accounts The list of accounts
     */
    createCurrentRow: function(accounts) {
        var currentRow = document.createElement("tr");
        currentRow.id = 'currentRow';

        var currentCell = document.createElement("td");
        currentCell.id = 'current';
        currentCell.colSpan = 1 + accounts.length;
        currentCell.appendChild(document.createTextNode("Current"));
        currentRow.appendChild(currentCell);

        var currentDateCell = document.createElement("td");
        currentDateCell.id = 'currentDate';
        currentDateCell.appendChild(document.createTextNode(dojo.date.locale.format(new Date(), {selector:'date',fullYear:true})));
        currentRow.appendChild(currentDateCell);

        for (var i in accounts) {
            currentRow.appendChild(this.createCurrentBalanceCell(accounts[i]));
        }

        return currentRow;
    },
    /**
     * Creates a cell for the current balance of an account.
     *
     * @param The account
     */
    createCurrentBalanceCell: function(account) {
        var currentBalanceCell = document.createElement("td");
        currentBalanceCell.id = 'currbal_'+account.key;

        var props = {
            value: account.balance,
            lang: 'en-us',
            currency: "USD",
            required: true,
            invalidMessage: "Invalid amount.",
            missingMessage: "Enter the current balance.",
            onBlur: function(acct) {return function() {
                if (this.isValid() && this.value != acct.balance) {
                    app.editAccountBalance(acct.key, this.value);
                }
            }}(account)
        };
        var currentBalanceTextBox = new dijit.form.CurrencyTextBox(props);

        currentBalanceCell.appendChild(currentBalanceTextBox.domNode);

        return currentBalanceCell;
    },
    /**
     * This method is invoked when an account is added to the cashflow.
     *
     * @param account The account that was added.
     */
    onAccountAdd: function(account) {
        //increase the span of the entries header
        var entriesHeader = dojo.byId('entriesHeader');
        entriesHeader.colSpan += 1;

        //increase the span of the balance header
        var balanceHeader = dojo.byId('balanceHeader');
        balanceHeader.colSpan += 1;

        //increatease the span of the "current" cell
        var currentCell = dojo.byId('current');
        currentCell.colSpan += 1;

        //create a function to handle clicks on the account cell
        var clickHandler = function(key, value) {return function(event) {
            app.showEditAccount(
                    event,
                    this.id,
                    key,
                    value);
        }}(account.key, account.name);

        //create the entries header cell
        var accountHeader = document.createElement("th");
        accountHeader.id = 'account_'+account.key;
        accountHeader.className = 'accountheader';

        //when the user clicks the cell, it will become editable
        accountHeader.onclick = clickHandler;

        //add the account name to the cell
        accountHeader.appendChild(document.createTextNode(account.name));

        //the header row has account cells for entries and balances so we need
        //to find the first balance and insert the new entry header before that
        //cell
        var accountHeaderRow = dojo.byId('accountHeaderRow');
        var i;
        for (i=0; i < accountHeaderRow.cells.length; i++) {
            if (accountHeaderRow.cells[i].id.indexOf('accountbal_', 0) == 0) {
                accountHeaderRow.insertBefore(
                    accountHeader,
                    accountHeaderRow.cells[i]
                );

                break;
            }
        }

        //create the balance cell
        accountHeader = document.createElement("th");
        accountHeader.id = 'accountbal_'+account.key;
        accountHeader.className = 'accountheader';

        //when the user clicks the cell, it will become editable
        accountHeader.onclick = clickHandler;

        //add the account name to the cell
        accountHeader.appendChild(document.createTextNode(account.name));

        accountHeaderRow.appendChild(accountHeader);

        var currentRow = dojo.byId('currentRow');
        
        //create the current balance cell
        currentRow.appendChild(this.createCurrentBalanceCell(account));

        //create the entries
        var tableBodies = [
            dojo.byId('historicBody'), dojo.byId('upcomingBody')
        ];
        for (i=0; i < tableBodies.length; i++) {
            for (var j=0; j < tableBodies[i].rows.length; j++) {
                var xactionRow = tableBodies[i].rows[j];
                var xactionKey = xactionRow.id.substr(8); // everything after xaction_

                var xactionDateCell = dojo.byId('date_'+xactionKey);

                var key = account.key+'_'+xactionKey;

                xactionRow.insertBefore(
                    this.createTransactionEntryCell(0, xactionKey, account.key),
                    xactionDateCell
                );

                //the balance cell is just the account balance
                xactionRow.appendChild(this.createTransactionBalanceCell(xactionKey, account.key, account.balance));
            }
        }
    },
    /**
     * This method is invoked when an account is deleted from the cashflow.
     *
     * @param account The key of the account that was deleted.
     */
    onAccountDelete: function(acctKey) {
        //remove the account headers
        $('#account_'+acctKey).remove();
        $('#accountbal_'+acctKey).remove();

        //update header colspans
        var entriesHeader = dojo.byId('entriesHeader');
        entriesHeader.colSpan -= 1;

        var balanceHeader = dojo.byId('balanceHeader');
        balanceHeader.colSpan -= 1;
        
        //update current colspan
        var currentCell = dojo.byId('current');
        currentCell.colSpan -= 1;

        //remove current balance
        $('#currbal_'+acctKey).remove();

        //remove all entries for the account
        $('td[id^="entry_'+acctKey+'"]').remove();

        //remove all balances for the account
        $('td[id^="balance_'+acctKey+'"]').remove();
    },
    /**
     * This method is invoked when an account is updated.
     *
     * @param account The account that was updated.
     */
    onAccountUpdate: function(account) {
        var accountHeader = dojo.byId('account_'+account.key);
        accountHeader.onclick = function(key, value) {return function(event) {
                app.showEditAccount(
                        event,
                        this.id,
                        key,
                        value);
            }}(account.key, account.name);
        accountHeader.replaceChild(
            document.createTextNode(account.name),
            accountHeader.firstChild
        );

        accountHeader = dojo.byId('accountbal_'+account.key);
        accountHeader.onclick = function(key, value) {return function(event) {
                app.showEditAccount(
                        event,
                        this.id,
                        key,
                        value);
            }}(account.key, account.name);
        accountHeader.replaceChild(
            document.createTextNode(account.name),
            accountHeader.firstChild
        );
    },
    /**
     * This method is invoked when an entry is edited.
     *
     * @param entry The entry that was edited
     * @param acctKey The key of the account for the entry
     * @param xactionKey The key of the transaction for the entry
     */
    onEntryEdit: function(entry, acctKey, xactionKey) {
        var entryInput = dijit.byId('entryInput_'+acctKey+'_'+xactionKey);
        if (entryInput) {
            entryInput.set('id','entryInput_'+entry.key);
        } else {
            entryInput = dijit.byId('entryInput_'+entry.key);
        }

        entryInput.onBlur = function(value, xactionKey, acctKey, entryKey) {return function() {
                if (this.isValid() && this.value != value) {
                    app.editEntryAmount(this.value, xactionKey, acctKey, entryKey);
                }
            };}(entry.amount, xactionKey, acctKey, entry.key);
    },
    /**
     * This method is invoked when any changes happen to the balances.
     *
     * @param transactions Array of transactions
     * @param account The account that was changed, optional if all were changed
     */
    onBalanceUpdate: function(transactions, account) {
        for (var i in transactions) {
            //if there are balances to be displayed
            if (transactions[i].balances) {
                var xactionBalanceCell;
                var balance;

                //if an account was provided, only update balances for that account
                if (account) {
                    xactionBalanceCell = dojo.byId('balance_'+account.key+'_'+transactions[i].key);
                    balance = dojo.currency.format(transactions[i].balances[account.key], {currency:'USD'});
                    xactionBalanceCell.replaceChild(
                        document.createTextNode(balance),
                        xactionBalanceCell.firstChild
                    );
                } else {
                    for (var j in transactions[i].balances) {
                        xactionBalanceCell = dojo.byId('balance_'+j+'_'+transactions[i].key);
                        balance = dojo.currency.format(transactions[i].balances[j], {currency:'USD'});
                        xactionBalanceCell.replaceChild(
                            document.createTextNode(balance),
                            xactionBalanceCell.firstChild
                        );
                    }
                }
            }
        }
    },
    /**
     * This method is invoked when a transaction is added.
     *
     * @param xaction The transaction that was added
     */
    onTransactionAdd: function(xaction) {
        //get the current list of accounts
        var accounts = app.getCashflow().getAccounts();

        var xactionRow = this.createTransactionRow(xaction, accounts);

        var found = false;
        var tbody;
        var currentDate = dojo.date.stamp.toISOString(new Date(), {selector: 'date'});
        if (xaction.date < currentDate) {
            tbody = dojo.byId('historicBody');
        } else {
            tbody = dojo.byId('upcomingBody');
        }
        for (var i = 0; i < tbody.rows.length; i++) {
            var xactionKey = tbody.rows[i].id.substring(8); //evertything after 'xaction_'
            var date = dojo.date.stamp.toISOString(dijit.byId('dateInput_'+xactionKey).value, {selector: 'date'});
            if (xaction.date < date) {
                tbody.insertBefore(xactionRow, tbody.rows[i]);
                found = true;
                break;
            }
        }

        if (!found) {
            tbody.appendChild(xactionRow);
        }
    },
    /**
     * This method is invoked when a transaction is deleted.
     *
     * @param xaction The key of the transaction that was deleted
     */
    onTransactionDelete: function(xactionKey) {
        var xactionRow = dojo.byId('xaction_'+xactionKey);

        xactionRow.parentNode.removeChild(xactionRow);
    },
    /**
     * This method is invoked when a transaction is updated
     *
     * @param xaction The transaction that was updated
     */
    onTransactionUpdate: function(xaction) {
        //ensure the name is up to date
        var xactionNameCell = dojo.byId('name_'+xaction.key);
        xactionNameCell.replaceChild(
                document.createTextNode(xaction.name),
                xactionNameCell.firstChild
            );

        //move the table row to the correct spot
        var xactionRow = dojo.byId('xaction_'+xaction.key);
        xactionRow.parentNode.removeChild(xactionRow);
        
        var found = false;
        var tbody;
        var currentDate = dojo.date.stamp.toISOString(new Date(), {selector: 'date'});
        if (xaction.date < currentDate) {
            tbody = dojo.byId('historicBody');
        } else {
            tbody = dojo.byId('upcomingBody');
        }
        for (var i = 0; i < tbody.rows.length; i++) {
            var xactionKey = tbody.rows[i].id.substring(8); //evertything after 'xaction_'
            var date = dojo.date.stamp.toISOString(dijit.byId('dateInput_'+xactionKey).value, {selector: 'date'});
            if (xaction.date < date) {
                tbody.insertBefore(xactionRow, tbody.rows[i]);
                found = true;
                break;
            }
        }

        //if the position wasn't found'
        if (!found) {
            //put the transaction at the end
            tbody.appendChild(xactionRow);
        }
    }
});