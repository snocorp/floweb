import datetime
import json

from google.appengine.ext import db
from google.appengine.api import users
from google.appengine.ext import webapp
from google.appengine.ext.webapp.util import run_wsgi_app

from net.sf.flophase import model
from net.sf.flophase import const
from net.sf.flophase import store


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

application = webapp.WSGIApplication([
    ('/xaction/add', TransactionCreator),
    ('/xaction/delete', TransactionRemover),
    ('/xaction/edit', TransactionEditor),
    ('/xaction/q', TransactionQuery)
], debug=True)


def main():
  run_wsgi_app(application)


if __name__ == '__main__':
  main()