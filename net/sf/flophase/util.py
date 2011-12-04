
class JSONUtil():
    def getAccount(self, account):
        return {
            "key": str(account.key()),
            "name": account.name,
            "balance": account.balance,
            "order": account.order
        }

def is_numeric(val):
    try:
        float(val)
    except ValueError, e:
        return False
    return True