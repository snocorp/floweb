import json

from google.appengine.ext import db
from google.appengine.api import users
from google.appengine.ext import webapp
from google.appengine.ext.webapp.util import run_wsgi_app

from net.sf.flophase import model
from net.sf.flophase import const

class EntryEditor(webapp.RequestHandler):
    def get(self):
        response = {}

        if users.get_current_user():
            value = db.get( self.request.get('key') )
            if isinstance(value, model.Account):
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
    ('/entry/edit', EntryEditor)
], debug=True)


def main():
  run_wsgi_app(application)


if __name__ == '__main__':
  main()