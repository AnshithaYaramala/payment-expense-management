import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from database import get_db_connection, init_db
from models import hash_password, generate_account_number

def seed_database():
    init_db()
    conn = get_db_connection()
    cursor = conn.cursor()

    # Check if users already exist
    cursor.execute("SELECT COUNT(*) as count FROM users")
    if cursor.fetchone()["count"] > 0:
        conn.close()
        return

    print("Seeding initial data...")

    # 1. Create Athena
    pwd_hash, _ = hash_password("password123")
    cursor.execute(
        "INSERT INTO users (name, email, password_hash, account_number) VALUES (?, ?, ?, ?)",
        ("Athena", "athena@example.com", pwd_hash, "ACC9823410291")
    )
    athena_id = cursor.lastrowid

    # Athena's wallet
    cursor.execute(
        """INSERT INTO wallets (user_id, balance, currency, card_number, card_expiry, card_cvv, spending_limit) 
           VALUES (?, 3420.55, 'USD', '2216 1245 9814 3892', '09/29', '714', 1000.00)""",
        (athena_id,)
    )

    # 2. Create Alex Rivers
    cursor.execute(
        "INSERT INTO users (name, email, password_hash, account_number) VALUES (?, ?, ?, ?)",
        ("Alex Rivers", "alex@example.com", pwd_hash, "ACC7723910441")
    )
    alex_id = cursor.lastrowid
    cursor.execute(
        """INSERT INTO wallets (user_id, balance, currency, card_number, card_expiry, card_cvv, spending_limit) 
           VALUES (?, 1850.00, 'USD', '4111 8821 3491 5512', '11/27', '342', 1000.00)""",
        (alex_id,)
    )

    # 3. Create Sarah Jenkins
    cursor.execute(
        "INSERT INTO users (name, email, password_hash, account_number) VALUES (?, ?, ?, ?)",
        ("Sarah Jenkins", "sarah@example.com", pwd_hash, "ACC4412890533")
    )
    sarah_id = cursor.lastrowid
    cursor.execute(
        """INSERT INTO wallets (user_id, balance, currency, card_number, card_expiry, card_cvv, spending_limit) 
           VALUES (?, 2490.00, 'USD', '5245 9012 4478 1190', '04/28', '901', 1200.00)""",
        (sarah_id,)
    )

    # Athena's Next Payments / Subscriptions (Matching Screenshot)
    subscriptions = [
        (athena_id, "Netflix", "Entertainment", 19.99, "Monthly", "2026-10-21", "ACTIVE"),
        (athena_id, "Wifi Bill", "Utilities", 89.00, "Monthly", "2026-10-22", "ACTIVE"),
        (athena_id, "Spotify Premium", "Entertainment", 9.99, "Monthly", "2026-10-23", "ACTIVE"),
        (athena_id, "Gym Membership", "Health", 35.00, "Monthly", "2026-10-24", "ACTIVE"),
    ]
    cursor.executemany(
        """INSERT INTO subscriptions 
           (user_id, service_name, category, amount, billing_cycle, next_payment_date, status) 
           VALUES (?, ?, ?, ?, ?, ?, ?)""",
        subscriptions
    )

    # Athena's Transactions (Matching Screenshot)
    txns = [
        ("TXN-A82FD31", athena_id, alex_id, "Alex Rivers", "TRANSFER_IN", "Income", 17.00, "COMPLETED", "Bank Transfer received from Alex", "2026-10-20 14:32:00"),
        ("TXN-A80FC11", athena_id, None, "Landlord Properties", "EXPENSE", "Housing", 930.00, "COMPLETED", "House Rent Payment", "2026-10-18 10:15:00"),
        ("TXN-S779B01", athena_id, None, "TechCorp Global", "TOPUP", "Salary", 4200.00, "COMPLETED", "Monthly Salary Deposit", "2026-10-01 09:00:00"),
        ("TXN-M448123", athena_id, None, "Amazon", "EXPENSE", "Shopping", 142.50, "COMPLETED", "Amazon Electronics & Books", "2026-10-15 16:40:00"),
        ("TXN-G112984", athena_id, None, "Whole Foods", "EXPENSE", "Food", 86.20, "COMPLETED", "Organic Grocery Market", "2026-10-12 18:22:00"),
        ("TXN-F992100", athena_id, sarah_id, "Sarah Jenkins", "TRANSFER_IN", "Income", 750.00, "COMPLETED", "Freelance UI/UX Design Milestone", "2026-10-10 11:05:00"),
        ("TXN-U332190", athena_id, None, "City Power Co.", "BILL", "Utilities", 74.80, "COMPLETED", "Electric & Water Utility Bill", "2026-10-05 08:30:00"),
    ]

    cursor.executemany(
        """INSERT INTO transactions 
           (reference_id, user_id, recipient_id, recipient_name, type, category, amount, status, description, created_at) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
        txns
    )

    conn.commit()
    conn.close()
    print("Database seeded successfully with demo data!")

if __name__ == "__main__":
    seed_database()
