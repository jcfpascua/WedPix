
from database import get_connection

connection = get_connection()

# Add a sample photo record
connection.execute(
    """
    INSERT INTO media (filename, original_name, media_type)
    VALUES (?, ?, ?)
    """,
    ("test-photo-001.jpg", "wedding-photo.jpg", "image")
)

connection.commit()

# Retrieve all media records
media_items = connection.execute(
    "SELECT * FROM media"
).fetchall()

for item in media_items:
    print(dict(item))

connection.close()
