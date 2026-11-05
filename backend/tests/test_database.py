from app.db import SessionLocal
from app.models import User


def test_user_can_be_saved_read_and_deleted():
    db = SessionLocal()
    test_user = User(language="en")

    try:
        # 1. Save a temporary user.
        db.add(test_user)
        db.commit()
        db.refresh(test_user)

        # 2. Read the saved user from Neon.
        saved_user = db.get(User, test_user.id)

        # 3. Verify the saved data.
        assert saved_user is not None
        assert saved_user.id == test_user.id
        assert saved_user.language == "en"

    finally:
        # 4. Delete only this test user.
        db.rollback()

        if test_user.id is not None:
            db.query(User).filter(User.id == test_user.id).delete(
                synchronize_session=False
            )
            db.commit()

        db.close()
