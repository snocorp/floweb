dojo.provide("net.sf.flophase.App");

dojo.require("net.sf.flophase.data.CashFlowStore");
dojo.require("net.sf.flophase.model.CashFlow");
dojo.require("net.sf.flophase.ui.Toolbar");
dojo.require("net.sf.flophase.ui.Userbar");
dojo.require("net.sf.flophase.ui.Grid");

dojo.declare("net.sf.flophase.App", null, {
    constructor: function(options) {
        var _this = this; //store a reference to this

        this.cashflowStore = new net.sf.flophase.data.CashFlowStore();

        this.toolbar = new net.sf.flophase.ui.Toolbar();
        this.toolbar.init(options.toolbarNodeRef);

        this.userbar = new net.sf.flophase.ui.Userbar();
        this.userbar.init({logoutUrl:options.logoutUrl}, options.userbarNodeRef);

        this.grid = new net.sf.flophase.ui.Grid();

        //load the initial cashflow
        this.cashflowStore.getCashFlow({
            historic: true,
            upcoming: true,
            success: function(cashflow) {
                _this.cashflow = cashflow;
                _this.grid.init({"cashflow":cashflow}, options.gridNodeRef);
            },
            error: function(message) {
                window.alert(message);
            }
        });        
    },
    getCashflow: function() {
        return this.cashflow;
    },
    showAddAccount: function() {
        $('#newAccountName').val('');
        dijit.byId('newAccountBalance').value = 0.0;
        
        dijit.byId("addAccountDialog").show();
    },
    showAddTransaction: function() {
        $('#newTransactionName').val('');
        $('#newTransactionDate').val('');

        dijit.byId("addTransactionDialog").show();
    },
    showEditAccount: function( event, acctHeaderCellNodeRef, acctKey, acctName ) {
        var _this = this; //store a reference to this

        $("#accountDelete").unbind();

        if (this.getCashflow().getAccounts().length == 1) {
            dijit.byId('accountDelete').set('disabled', true);
        } else {
            dijit.byId('accountDelete').set('disabled', false);
            $("#accountDelete").click([ acctKey ], function(event) {
                _this.deleteAccount(event.data);
            });
        }

        var accountNameField = $("#accountName");
        accountNameField.unbind();
        accountNameField.keydown(
            [ acctKey ],
            function( event ) {
                if (event.keyCode == 13) {
                    _this.editAccountName(event.data, this.value);
                } else if (event.keyCode == 27) {
                    _this.hideEditAccountName();
                }
            }
        );


        //set the existing values
        accountNameField.val( acctName );
        accountNameField.css( { "width": $('#'+acctHeaderCellNodeRef).width()+7 } );

        //find the position of the clicked cell
        var acctEditor = $("#accountEditor");
        var headerCellPos = $('#'+acctHeaderCellNodeRef).position();
        acctEditor.css( {
            "top": (headerCellPos.top-1) + 'px',
            "left": (headerCellPos.left-1) + 'px'
        } );
        acctEditor.unbind();
        acctEditor.click(
            function( event ) {
                //prevent bubbling so it doesnt hide
                event.stopPropagation();
            }
        );

        $(acctEditor).fadeIn(250);

        //select the account name
        accountNameField.select();

        //prevent bubbling
        event.stopPropagation();

        $("body").unbind();
        $("body").click(this.hideEditAccountName);
    },
    showEditTransaction: function( event, nameCellNodeRef, xactionKey, xactionName ) {
        var _this = this; //store a reference to this

        $("#xactionDelete").unbind();
        $("#xactionDelete").click([ xactionKey ], function(event) {
            _this.deleteTransaction(event.data);
        });

        var xactionNameField = $("#xactionName");
        xactionNameField.unbind();
        xactionNameField.keydown(
            [ xactionKey ],
            function( event ) {
                //return
                if (event.keyCode == 13) {
                    _this.editTransactionName(event.data);
                }
                //escape
                else if (event.keyCode == 27) {
                    _this.hideEditTransaction();
                }
            }
        );

        var nameCell = $('#'+nameCellNodeRef);


        //set the existing values
        xactionNameField.val( xactionName );
        xactionNameField.css( { "width": nameCell.width()+7 } );

        //find the position of the clicked cell
        var xactionEditor = $("#xactionEditor");
        var nameCellPos = nameCell.position();
        xactionEditor.css( {
            "top": (nameCellPos.top-1) + 'px',
            "left": (nameCellPos.left-1) + 'px'
        } );

        $(xactionEditor).fadeIn(250);

        //select the transaction name
        xactionNameField.select();

        //prevent bubbling
        event.stopPropagation();

        $("body").unbind();
        $("body").click(this.hideEditTransaction);
    },
    hideAddAccount: function() {
        dijit.byId("addAccountDialog").hide();
    },
    hideAddTransaction: function() {
        dijit.byId("addTransactionDialog").hide();
    },
    hideEditAccountName: function() {
        $("#accountEditor").fadeOut(250);
    },
    hideEditTransaction: function() {
        $("#xactionEditor").fadeOut(250);
    },
    addAccount: function() {
        var _this = this; //store a reference to this
        
        this.hideAddAccount();

        this.cashflowStore.addAccount({
            name: $("#newAccountName").val(),
            balance: dijit.byId("newAccountBalance").value,
            success: function(account) {
                _this.grid.onAccountAdd(account);
            },
            error: function(message) { window.alert(message); }
        });
    },
    addTransaction: function() {
        var _this = this; //store a reference to this

        this.hideAddTransaction();

        this.cashflowStore.addTransaction({
            name: $("#newTransactionName").val(),
            date: dojo.byId("newTransactionDate").value,
            success: function(xaction) {
                _this.grid.onTransactionAdd(xaction);
            },
            error: function(message) { window.alert(message); }
        });
    },
    deleteAccount: function(acctKey) {
        var _this = this; //store a reference to this

        this.cashflowStore.deleteAccount({
           key: acctKey,
           success: function() {
                _this.hideEditAccountName();
                
               _this.grid.onAccountDelete(acctKey);
           },
           error: function(message) {
               window.alert(message);
           }
        });
    },
    deleteTransaction: function(xactionKey) {
        var _this = this; //store a reference to this

        this.cashflowStore.deleteTransaction({
            key: xactionKey,
            success: function() {
                _this.hideEditTransaction();

                _this.grid.onTransactionDelete(xactionKey);

                _this.grid.onBalanceUpdate(_this.cashflow.getTransactions());
            },
            error: function(message) { window.alert(message); }
        })
    },
    editAccountBalance: function(acctKey, balance) {
        var _this = this; //store a reference to this

        this.cashflowStore.editAccount({
            key:acctKey,
            balance:balance,
            success: function(account) {
                _this.grid.onBalanceUpdate(_this.cashflow.getTransactions(), account);
            },
            error: function(message) { window.alert(message); }
        });
    },
    editAccountName: function(acctKey, name) {
        var _this = this; //store a reference to this

        this.hideEditAccountName();

        this.cashflowStore.editAccount({
            key:acctKey,
            name:name,
            success: function(account) {
                _this.grid.onAccountUpdate(account);
            },
            error: function(message) { window.alert(message); }
        });
    },
    editEntryAmount: function(value, xactionKey, acctKey, entryKey) {
        var _this = this; //store a reference to this

        if (entryKey) {
            this.cashflowStore.editEntry({
                key: entryKey,
                acctKey: acctKey,
                xactionKey: xactionKey,
                amount: value,
                success: function(entry) {
                    _this.grid.onEntryEdit(entry, acctKey, xactionKey);

                    var xactions = _this.cashflow.getTransactions();
                    var account = _this.cashflow.getAccount(acctKey);
                    _this.grid.onBalanceUpdate(xactions, account);
                },
                error: function(message) { window.alert(message); }
            })
        } else {
            this.cashflowStore.addEntry({
                acctKey: acctKey,
                xactionKey: xactionKey,
                amount: value,
                success: function(entry) {
                    _this.grid.onEntryEdit(entry, acctKey, xactionKey);

                    var xactions = _this.cashflow.getTransactions();
                    var account = _this.cashflow.getAccount(acctKey);
                    _this.grid.onBalanceUpdate(xactions, account);
                },
                error: function(message) { window.alert(message); }
            });
        }
    },
    editTransactionDate: function(xactionKey, newDate, origDate) {
        var _this = this; //store a reference to this

        if (origDate != newDate) {
            this.cashflowStore.editTransaction({
                key:xactionKey,
                date:newDate,
                success: function(xaction) { 
                    _this.grid.onTransactionUpdate(xaction);

                    _this.grid.onBalanceUpdate(_this.cashflow.getTransactions())
                },
                error: function(message) { window.alert(message); }
            });
        }
    },
    editTransactionName: function(xactionKey) {
        this.hideEditTransaction();

        this.cashflowStore.editTransaction({
            key:xactionKey,
            name:$("#xactionName").val(),
            success: this.grid.onTransactionUpdate,
            error: function(message) { window.alert(message); }
        });
    }
});
