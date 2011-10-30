dojo.provide("net.sf.flophase.ui.Userbar");

dojo.require("dijit.form.Button");

dojo.declare("net.sf.flophase.ui.Userbar", null, {
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