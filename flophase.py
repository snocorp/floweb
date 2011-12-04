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


application = webapp.WSGIApplication([
    ('/', MainPage)
], debug=True)


def main():
  run_wsgi_app(application)


if __name__ == '__main__':
  main()
