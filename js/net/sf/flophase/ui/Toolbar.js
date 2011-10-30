dojo.provide("net.sf.flophase.ui.Toolbar");

dojo.require("dijit.form.Button");

dojo.declare("net.sf.flophase.ui.Toolbar", null, {
    init: function(srcNodeRef) {
        // Create add account button
        this._addAccountButton = new dijit.form.Button({
            label: "Add Account",
            onClick: function() { app.showAddAccount(); }
        });
        dojo.byId(srcNodeRef).appendChild(this._addAccountButton.domNode);

        //Create add transaction button
        this._addTransactionButton = new dijit.form.Button(
            {
                label: "Add Transaction",
                onClick: function() { app.showAddTransaction(); }
            });
        dojo.byId(srcNodeRef).appendChild(this._addTransactionButton.domNode);
    }
});