import re
import json

from google.appengine.ext import db
from google.appengine.api import users
from google.appengine.ext import webapp
from google.appengine.ext.webapp.util import run_wsgi_app

from net.sf.flophase import model
from net.sf.flophase import const
from net.sf.flophase import store
from net.sf.flophase import util

class AccountCreator(webapp.RequestHandler):
    def get(self):
        name = self.request.get('name')
        balance = self.request.get('balance')

        response = self.validate(name, balance)

        if response["result"] == const.SUCCESS:
            cashFlow = store.CashFlowStore().get()

            """Create the new account"""
            account = model.Account(parent=cashFlow)
            account.name = name
            account.balance = float(balance)
            account.order = store.AccountStore().getNextAccountOrder(cashFlow)
            account.put()

            response["messages"].append("Account created")
            response["account"] = util.JSONUtil().getAccount(account)
        
        self.response.headers.add_header("Content-Type", "application/json")
        self.response.out.write(json.dumps(response))

    def validate(self, name, balance):
        result = {
                "result": const.SUCCESS,
                "messages": []
            }

        # check if the user is logged in
        if not users.get_current_user():
            response["result"] = const.FAILURE
            response["messages"].append("Permission denied")

        else:
            # check if the name is empty
            if len(name) == 0:
                result["result"] = const.FAILURE
                result["messages"].append(
                        "The account name cannot be empty."
                    )

            # check if the name is too long
            elif len(name) > const.MAX_ACCOUNT_NAME_LENGTH:
                result["result"] = const.FAILURE
                result["messages"].append(
                        "The account name cannot be more than " + str(const.MAX_ACCOUNT_NAME_LENGTH) + " characters."
                    )
            else:
                # check for invalid characters
                regexp = re.compile('[\w\s]+')
                if not regexp.match(name):
                    result["result"] = const.FAILURE
                    result["messages"].append(
                            "The account name can only contain alphanumeric characters and spaces."
                        )

            # ensure the balance is numeric
            if not util.is_numeric(balance):
                result["result"] = const.FAILURE
                result["messages"].append(
                        "The balance must be a valid number."
                    )

            #ensure the user has less than the maximum number of accounts
            #TODO

        return result

class AccountEditor(webapp.RequestHandler):
    def get(self):
        response = {}

        if users.get_current_user():
            account = db.get( self.request.get('key') )
            if (self.request.get('name')):
                account.name = self.request.get('name')
            if (self.request.get('balance')):
                account.balance = float(self.request.get('balance'))
            account.put()

            response["result"] = const.SUCCESS
            response["message"] = "Account updated"
            response["account"] = util.JSONUtil().getAccount(account)
        else:
            response["result"] = const.FAILURE
            response["message"] = "Permission denied"

        self.response.headers.add_header("Content-Type", "application/json")
        self.response.out.write(json.dumps(response))

class AccountRemover(webapp.RequestHandler):
    def get(self):
        response = {}

        if users.get_current_user():
            acctKey = self.request.get('key')
            account = db.get( acctKey )

            entryQuery = model.Entry.all()
            entryQuery.filter("account =", account)
            entries = entryQuery.fetch(limit=1000)

            for entry in entries:
                entry.delete()

            account.delete()

            response["result"] = const.SUCCESS
            response["message"] = "Account removed"
            response["key"] = acctKey
        else:
            response["result"] = const.FAILURE
            response["message"] = "Permission denied"

        self.response.headers.add_header("Content-Type", "application/json")
        self.response.out.write(json.dumps(response))

class AccountQuery(webapp.RequestHandler):
    def get(self):
        response = {}

        if users.get_current_user():
            cashFlow = store.CashFlowStore().get()

            accounts = store.AccountStore().getAccounts(cashFlow)

            """ store the accounts in a json-friendly object """
            tmpAccounts = []
            for account in accounts:
                tmpAccounts.append(util.JSONUtil().getAccount(account))

            response["result"] = const.SUCCESS
            response["accounts"] = tmpAccounts

        else:
            response["result"] = const.FAILURE
            response["message"] = "Permission denied"

        self.response.headers.add_header("Content-Type", "application/json")
        self.response.out.write(json.dumps(response))

application = webapp.WSGIApplication([
    ('/account/add', AccountCreator),
    ('/account/delete', AccountRemover),
    ('/account/edit', AccountEditor),
    ('/account/q', AccountQuery)
], debug=True)


def main():
  run_wsgi_app(application)


if __name__ == '__main__':
  main()
