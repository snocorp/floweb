dojo.provide("net.sf.flophase.ui.Userbar");

dojo.require("dijit.form.Button");

dojo.declare("net.sf.flophase.ui.Userbar", null, {
    /**
     * Initializes the toolbar and adds it to the given dome node.
     *
     * @param options.logoutUrl The url to logout the user
     * @param srcNodeRef The id of the DOM node
     */
    init: function(options, srcNodeRef) {
        var container = dojo.byId(srcNodeRef);

        //Create logout button
        this._logoutButton = new dijit.form.Button(
            {
                label: "Logout",
                onClick: function() { window.location = options.logoutUrl; }
            });
        container.appendChild(this._logoutButton.domNode);
    }
});