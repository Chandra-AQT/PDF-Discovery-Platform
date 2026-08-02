from urllib.parse import urljoin

def normalize(base, link):

    return urljoin(base, link)