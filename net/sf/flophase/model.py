from google.appengine.ext import db

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
