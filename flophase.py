import os
import datetime
import json

from google.appengine.ext import db
from google.appengine.api import users
from google.appengine.ext import webapp
from google.appengine.ext.webapp.util import run_wsgi_app
from google.appengine.ext.webapp import template

from net.sf.flophase import model
from net.sf.flophase import const
from net.sf.flophase import store
from net.sf.flophase import util

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
            cashFlow = store.CashFlowStore().get()

            """Create the new account"""
            account = model.Account(parent=cashFlow)
            account.name = self.request.get('name')
            account.balance = float(self.request.get('balance'))
            account.order = store.AccountStore().getNextAccountOrder(cashFlow)
            account.put()

            response["result"] = const.SUCCESS
            response["message"] = "Account created"
            response["account"] = util.JSONUtil().getAccount(account)
        else:
            response["result"] = const.FAILURE
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


class TransactionCreator(webapp.RequestHandler):
    def get(self):
        response = {}

        if users.get_current_user():  
            cashFlow = store.CashFlowStore().get()

            """Create the new transaction"""
            xaction = model.Transaction(parent=cashFlow)
            xaction.name = self.request.get('name')
            xaction.date = datetime.datetime.strptime(self.request.get('date'), '%Y-%m-%d').date()
            xaction.put()

            response['result'] = const.SUCCESS
            response['message'] = "Transaction created"
            response['transaction'] = {
                'key': str(xaction.key()),
                'name': xaction.name,
                'date': xaction.date.strftime("%Y-%m-%d"),
                'entries': {}
            }
        else:
            response['result'] = const.FAILURE
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

            response['result'] = const.SUCCESS
            response['message'] = "Transaction updated"
            response['transaction'] = {
                'key': str(xaction.key()),
                'name': xaction.name,
                'date': xaction.date.strftime("%Y-%m-%d")
            }
        else:
            response['result'] = const.FAILURE
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

            response['result'] = const.SUCCESS
            response['message'] = "Transaction removed"
            response["key"] = xactionKey
        else:
            response['result'] = const.FAILURE
            response['message'] = "Permission denied"

        self.response.headers.add_header("Content-Type", "application/json")
        self.response.out.write(json.dumps(response))

class TransactionQuery(webapp.RequestHandler):
    def get(self):
        response = {}

        if users.get_current_user():
            cashFlow = store.CashFlowStore().get()

            historic = self.request.get('hist') == 'true'
            inputDate = self.request.get('date')
            if (inputDate):
                startDate = datetime.datetime.strptime(inputDate, "%Y-%m-%d")
            else:
                startDate = datetime.datetime.today()
            

            transactionStore = store.TransactionStore()

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

            response["result"] = const.SUCCESS
            response["transactions"] = tmpXactions
            
        else:
            response["result"] = const.FAILURE
            response["message"] = "Permission denied"

        self.response.headers.add_header("Content-Type", "application/json")
        self.response.out.write(json.dumps(response))

class EntryEditor(webapp.RequestHandler):
    def get(self):
        response = {}

        if users.get_current_user():  
            value = db.get( self.request.get('key') )
            if isinstance(value, Account):
                entry = model.Entry( db.get( self.request.get('xaction') ) )
                entry.account = value
            else:
                entry = value
            entry.amount = float(self.request.get('amount'))
            entry.put()

            response["result"] = const.SUCCESS
            response['message'] = "Entry updated"
            response['entry'] = {
                'key': str(entry.key()),
                'amount': entry.amount
            }
        else:
            response["result"] = const.FAILURE
            response['message'] = "Permission denied"

        self.response.headers.add_header("Content-Type", "application/json")
        self.response.out.write(json.dumps(response))

application = webapp.WSGIApplication([
    ('/', MainPage),
    ('/account/add', AccountCreator),
    ('/account/delete', AccountRemover),
    ('/account/edit', AccountEditor),
    ('/account/q', AccountQuery),
    ('/xaction/add', TransactionCreator),
    ('/xaction/delete', TransactionRemover),
    ('/xaction/edit', TransactionEditor),
    ('/xaction/q', TransactionQuery),
    ('/entry/edit', EntryEditor)
], debug=True)


def main():
  run_wsgi_app(application)


if __name__ == '__main__':
  main()
