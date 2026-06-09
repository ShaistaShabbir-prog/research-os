from uuid import uuid4

class StorageService:
    def __init__(self, bucket: str = 'researchos'):
        self.bucket = bucket

    def make_key(self, filename: str) -> str:
        safe = filename.replace('/', '_').replace(' ', '_')
        return f"uploads/{uuid4().hex}/{safe}"

    async def put_bytes(self, key: str, content: bytes, content_type: str) -> str:
        # Production task: wire boto3/aioboto3 and return storage key.
        return key
