import os
import datetime
import json

from google.appengine.ext import db
from google.appengine.api import users
from google.appengine.ext import webapp
from google.appengine.ext.webapp.util import run_wsgi_app
from google.appengine.ext.webapp import template

"""response codes"""
SUCCESS = 1
FAILURE = 2

class CashFlow(db.Model):
    """Models a cash flow."""
    user = db.UserProperty()

class Account(db.Model):
    """Models an account"""
    name = db.StringProperty()
    balance = db.FloatProperty()
    order = db.IntegerProperty()

class Transaction(db.Model):
    """Models a transaction"""
    name = db.StringProperty()
    date = db.DateProperty()

class Entry(db.Model):
    """Models an entry in a transaction"""
    account = db.ReferenceProperty()
    amount = db.FloatProperty()

class CashFlowStore():
    """ Retrieves the cash flow model object """
    def get(self):
        """ Query to get the only cash flow """
        cashFlowQuery = CashFlow.all()
        cashFlowQuery.filter('user = ', users.get_current_user())
        results = cashFlowQuery.fetch(limit=1)

        """ if there is no cash flow """
        if (len(results) == 0):
            """ create a new one """
            cashFlow = CashFlow()
            cashFlow.user = users.get_current_user()
            cashFlow.put()
        else:
            cashFlow = results[0]

        return cashFlow

class AccountStore():
    """ gets the accounts for the given cash flow """
    def getAccounts(self, cashFlow):
        accountQuery = Account.all()
        accountQuery.ancestor(cashFlow)
        accountQuery.order("order")

        """ limit to 5 accounts for now """
        accounts = accountQuery.fetch(limit=5)

        """ if there are no accounts """
        if (len(accounts) == 0):
            """ create a default empty account """
            account = Account(parent=cashFlow)
            account.name = 'My Account'
            account.balance = 0.0
            account.order = 1
            account.put()

            """ add it to the list for processing """
            accounts.append(account)

        return accounts

class TransactionStore():
    """ gets the transactions for the given cash flow """
    def getTransactions(self, cashFlow, startDate, historic):
        
        """ query for the transactions """
        xactionQuery = Transaction.all()
        xactionQuery.ancestor(cashFlow)

        if (historic):
            """ include only transactions before start date in order """
            xactionQuery.filter("date <", startDate)
            xactionQuery.order("-date")
        else:
            xactionQuery.filter("date >=", startDate)
            xactionQuery.order("date")

        """ limit to 100 transactions per fetch """
        xactions = xactionQuery.fetch(limit=100)

        return xactions
    

    def getEntries(self, xaction):

        """ query the entries for the given transaction """
        entryQuery = Entry.all()
        entryQuery.ancestor(xaction)
        entries = entryQuery.fetch(limit=5)

        return entries


class MainPage(webapp.RequestHandler):
    """ Loads the main page of the application"""
    def get(self):
        """ if the user is logged in """
        if users.get_current_user():
            
            url = users.create_logout_url(self.request.uri)
            url_linktext = 'Logout'

            template_values = {
                'logout_url': url
            }

            path = os.path.join(os.path.dirname(__file__), 'index.html')
        else:
            url = users.create_login_url(self.request.uri)
            url_linktext = 'Login'

            template_values = {
                'url': url,
                'url_linktext': url_linktext
            }

            path = os.path.join(os.path.dirname(__file__), 'login.html')

        self.response.out.write(template.render(path, template_values))


class AccountCreator(webapp.RequestHandler):
    def get(self):
        response = {}
        
        if users.get_current_user():        
            cashFlowQuery = CashFlow.all()
            cashFlowQuery.filter('user = ', users.get_current_user())
            results = cashFlowQuery.fetch(limit=1)

            if (len(results) == 0):
                cashFlow = CashFlow()
                cashFlow.user = users.get_current_user()
                cashFlow.put()
            else:
                cashFlow = results[0]

            accountQuery = Account.all()
            accountQuery.ancestor(cashFlow)
            accountQuery.order("-order")
            accounts = accountQuery.fetch(limit=1)

            """Create the new account"""
            account = Account(parent=cashFlow)
            account.name = self.request.get('name')
            account.balance = float(self.request.get('balance'))
            if (len(accounts) == 1):
                """the last order plus one"""
                account.order = accounts[0].order + 1
            else:
                account.order = 1
            account.put()

            response["result"] = SUCCESS
            response["message"] = "Account created"
            response["account"] = {
                "key": str(account.key()),
                "name": account.name,
                "balance": account.balance,
                "order": account.order
            }
        else:
            response["result"] = FAILURE
            response["message"] = "Permission denied"

        self.response.headers.add_header("Content-Type", "application/json")
        self.response.out.write(json.dumps(response))

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

            response["result"] = SUCCESS
            response["message"] = "Account updated"
            response["account"] = {
                "key": str(account.key()),
                "name": account.name,
                "balance": account.balance,
                "order": account.order
            }
        else:
            response["result"] = FAILURE
            response["message"] = "Permission denied"

        self.response.headers.add_header("Content-Type", "application/json")
        self.response.out.write(json.dumps(response))

class AccountRemover(webapp.RequestHandler):
    def get(self):
        response = {}

        if users.get_current_user():
            acctKey = self.request.get('key')
            account = db.get( acctKey )

            entryQuery = Entry.all()
            entryQuery.filter("account =", account)
            entries = entryQuery.fetch(limit=1000)

            for entry in entries:
                entry.delete()

            account.delete()

            response["result"] = SUCCESS
            response["message"] = "Account removed"
            response["key"] = acctKey
        else:
            response["result"] = FAILURE
            response["message"] = "Permission denied"

        self.response.headers.add_header("Content-Type", "application/json")
        self.response.out.write(json.dumps(response))

class AccountQuery(webapp.RequestHandler):
    def get(self):
        response = {}
        
        if users.get_current_user():
            cashFlow = CashFlowStore().get()

            accounts = AccountStore().getAccounts(cashFlow)

            """ store the accounts in a json-friendly object """
            tmpAccounts = []
            for account in accounts:
                tmpAccounts.append({
                    'key': str(account.key()),
                    'name': account.name,
                    'balance': account.balance
                })

            response["result"] = SUCCESS
            response["accounts"] = tmpAccounts

        else:
            response["result"] = FAILURE
            response["message"] = "Permission denied"

        self.response.headers.add_header("Content-Type", "application/json")
        self.response.out.write(json.dumps(response))


class TransactionCreator(webapp.RequestHandler):
    def get(self):
        response = {}

        if users.get_current_user():  
            cashFlowQuery = CashFlow.all()
            cashFlowQuery.filter('user = ', users.get_current_user())
            results = cashFlowQuery.fetch(limit=1)

            if (len(results) == 0):
                cashFlow = CashFlow()
                cashFlow.user = users.get_current_user()
                cashFlow.put()
            else:
                cashFlow = results[0]

            """Create the new transaction"""
            xaction = Transaction(parent=cashFlow)
            xaction.name = self.request.get('name')
            xaction.date = datetime.datetime.strptime(self.request.get('date'), '%Y-%m-%d').date()
            xaction.put()

            response['result'] = SUCCESS
            response['message'] = "Transaction created"
            response['transaction'] = {
                'key': str(xaction.key()),
                'name': xaction.name,
                'date': xaction.date.strftime("%Y-%m-%d"),
                'entries': {}
            }
        else:
            response['result'] = FAILURE
            response['message'] = "Permission denied"

        self.response.headers.add_header("Content-Type", "application/json")
        self.response.out.write(json.dumps(response))

class TransactionEditor(webapp.RequestHandler):
    def get(self):
        response = {}

        if users.get_current_user():  
            xaction = db.get( self.request.get('key') )
            if (self.request.get('name')):
                xaction.name = self.request.get('name')
            if (self.request.get('date')):
                xaction.date = datetime.datetime.strptime(self.request.get('date'), '%Y-%m-%d').date()
            xaction.put()

            response['result'] = SUCCESS
            response['message'] = "Transaction updated"
            response['transaction'] = {
                'key': str(xaction.key()),
                'name': xaction.name,
                'date': xaction.date.strftime("%Y-%m-%d")
            }
        else:
            response['result'] = FAILURE
            response['message'] = "Permission denied"

        self.response.headers.add_header("Content-Type", "application/json")
        self.response.out.write(json.dumps(response))

class TransactionRemover(webapp.RequestHandler):
    def get(self):
        response = {}

        if users.get_current_user():
            xactionKey = self.request.get('key')
            xaction = db.get( xactionKey )
            xaction.delete()

            response['result'] = SUCCESS
            response['message'] = "Transaction removed"
            response["key"] = xactionKey
        else:
            response['result'] = FAILURE
            response['message'] = "Permission denied"

        self.response.headers.add_header("Content-Type", "application/json")
        self.response.out.write(json.dumps(response))

class TransactionQuery(webapp.RequestHandler):
    def get(self):
        response = {}

        if users.get_current_user():
            cashFlow = CashFlowStore().get()

            historic = self.request.get('hist') == 'true'
            inputDate = self.request.get('date')
            if (inputDate):
                startDate = datetime.datetime.strptime(inputDate, "%Y-%m-%d")
            else:
                startDate = datetime.datetime.today()
            

            transactionStore = TransactionStore()

            tmpXactions = []
            xactions = transactionStore.getTransactions(cashFlow, startDate, historic)
            for xaction in xactions:
                tmpXaction = {
                    'key': str(xaction.key()),
                    'name': xaction.name,
                    'date': xaction.date.strftime("%Y-%m-%d")
                }
                tmpXaction['entries'] = {}
                entries = transactionStore.getEntries(xaction)
                for entry in entries:
                    tmpXaction['entries'][str(entry.account.key())] = {
                        'key': str(entry.key()),
                        'amount': entry.amount
                    }
                tmpXactions.append(tmpXaction)

            response["result"] = SUCCESS
            response["transactions"] = tmpXactions
            
        else:
            response["result"] = FAILURE
            response["message"] = "Permission denied"

        self.response.headers.add_header("Content-Type", "application/json")
        self.response.out.write(json.dumps(response))

class EntryEditor(webapp.RequestHandler):
    def get(self):
        response = {}

        if users.get_current_user():  
            value = db.get( self.request.get('key') )
            if isinstance(value, Account):
                entry = Entry( db.get( self.request.get('xaction') ) )
                entry.account = value
            else:
                entry = value
            entry.amount = float(self.request.get('amount'))
            entry.put()

            response["result"] = SUCCESS
            response['message'] = "Entry updated"
            response['entry'] = {
                'key': str(entry.key()),
                'amount': entry.amount
            }
        else:
            response["result"] = FAILURE
            response['message'] = "Permission denied"

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
