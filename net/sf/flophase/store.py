
from google.appengine.api import users

import model

class CashFlowStore():
    """ Retrieves the cash flow model object """
    def get(self):
        """ Query to get the only cash flow """
        cashFlowQuery = model.CashFlow.all()
        cashFlowQuery.filter('user = ', users.get_current_user())
        results = cashFlowQuery.fetch(limit=1)

        """ if there is no cash flow """
        if (len(results) == 0):
            """ create a new one """
            cashFlow = model.CashFlow()
            cashFlow.user = users.get_current_user()
            cashFlow.put()
        else:
            cashFlow = results[0]

        return cashFlow

class AccountStore():
    """ gets the accounts for the given cash flow """
    def getAccounts(self, cashFlow):
        accountQuery = model.Account.all()
        accountQuery.ancestor(cashFlow)
        accountQuery.order("order")

        """ limit to 5 accounts for now """
        accounts = accountQuery.fetch(limit=5)

        """ if there are no accounts """
        if (len(accounts) == 0):
            """ add default account to the list for processing """
            accounts.append(self.createDefaultAccount(cashFlow))

        return accounts

    def getNextAccountOrder(self, cashFlow):
        accountQuery = model.Account.all()
        accountQuery.ancestor(cashFlow)
        accountQuery.order("-order")
        accounts = accountQuery.fetch(limit=1)

        if (len(accounts) == 1):
            """the last order plus one"""
            order = accounts[0].order + 1
        else:
            order = 1

        return order

    """ creates an account """
    def createAccount(self, cashFlow, name, balance, order):
        account = model.Account(parent=cashFlow)
        account.name = name
        account.balance = balance
        account.order = order
        account.put()

        return account

    """ creates a default empty account """
    def createDefaultAccount(self, cashFlow):
        account = self.createAccount(cashFlow, 'My Account', 0.0, 1)

        return account

class TransactionStore():
    """ gets the transactions for the given cash flow """
    def getTransactions(self, cashFlow, startDate, historic):

        """ query for the transactions """
        xactionQuery = model.Transaction.all()
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
        entryQuery = model.Entry.all()
        entryQuery.ancestor(xaction)
        entries = entryQuery.fetch(limit=5)

        return entries