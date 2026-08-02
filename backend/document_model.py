from pydantic import BaseModel

class Document(BaseModel):
    name: str
    url: str