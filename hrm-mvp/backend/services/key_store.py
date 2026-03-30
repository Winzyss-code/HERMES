import uuid


def generate_key_ref() -> str:
    return str(uuid.uuid4())
