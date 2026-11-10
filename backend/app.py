import os
import sys
import csv
import io

# Ensure backend directory is in python module search path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from flask import Flask, request, jsonify, send_from_directory, make_response
from database import init_db
from seed import seed_database
from models import (
    UserModel, WalletModel, TransactionModel, SubscriptionModel,
    ReportModel, generate_token, verify_token, verify_password
)

app = Flask(__name__, template_folder='templates', static_folder='static')
app.config['SECRET_KEY'] = os.getenv("SECRET_KEY", "payment-expense-secret-key-2026")

# CORS middleware for standalone frontend support
@app.after_request
def add_cors_headers(response):
    response.headers['Access-Control-Allow-Origin'] = '*'
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type,Authorization'
    response.headers['Access-Control-Allow-Methods'] = 'GET,PUT,POST,DELETE,OPTIONS'
    return response

# Initialize & seed SQLite database on startup
with app.app_context():
    init_db()
    seed_database()

def get_current_user():
    """Extracts and validates Authorization: Bearer <token>."""
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith("Bearer "):
        return None
    token = auth_header.split(" ")[1]
    user_payload = verify_token(token)
    return user_payload

def require_auth():
    user = get_current_user()
    if not user:
        return None, (jsonify({"error": "Unauthorized or session expired"}), 401)
    return user, None

# ----------------- Frontend Web Route -----------------
@app.route('/')
def index():
    templates_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'templates')
    return send_from_directory(templates_dir, 'index.html')

# ----------------- Authentication Routes -----------------
@app.route('/api/auth/register', methods=['POST'])
def register():
    data = request.get_json() or {}
    name = data.get('name', '').strip()
    email = data.get('email', '').strip().lower()
    password = data.get('password', '')

    if not name or not email or not password:
        return jsonify({"error": "Full name, email, and password are required."}), 400

    if len(password) < 6:
        return jsonify({"error": "Password must be at least 6 characters long."}), 400

    if UserModel.find_by_email(email):
        return jsonify({"error": "An account with this email already exists."}), 409

    try:
        user = UserModel.create(name, email, password)
        token = generate_token(user['id'], user['email'])
        return jsonify({
            "message": "Registration successful! $500 welcome bonus credited.",
            "token": token,
            "user": user
        }), 201
    except Exception as e:
        return jsonify({"error": f"Registration failed: {str(e)}"}), 500

@app.route('/api/auth/login', methods=['POST'])
def login():
    data = request.get_json() or {}
    email = data.get('email', '').strip().lower()
    password = data.get('password', '')

    if not email or not password:
        return jsonify({"error": "Email and password are required."}), 400

    user = UserModel.find_by_email(email)
    if not user or not verify_password(user['password_hash'], password):
        return jsonify({"error": "Invalid email or password."}), 401

    token = generate_token(user['id'], user['email'])
    return jsonify({
        "message": "Login successful",
        "token": token,
        "user": {
            "id": user['id'],
            "name": user['name'],
            "email": user['email'],
            "account_number": user['account_number']
        }
    })

@app.route('/api/auth/me', methods=['GET'])
def get_profile():
    auth, err = require_auth()
    if err:
        return err

    user = UserModel.find_by_id(auth['user_id'])
    if not user:
        return jsonify({"error": "User not found"}), 404

    wallet = WalletModel.get_by_user_id(auth['user_id'])
    return jsonify({
        "user": user,
        "wallet": {
            "balance": float(wallet['balance']) if wallet else 0.0,
            "card_number": wallet['card_number'] if wallet else '**** **** **** 0000',
            "card_expiry": wallet['card_expiry'] if wallet else '12/28',
            "spending_limit": float(wallet['spending_limit']) if wallet else 1000.00
        }
    })

# ----------------- Wallet & Transfers Routes -----------------
@app.route('/api/wallet', methods=['GET'])
def get_wallet():
    auth, err = require_auth()
    if err:
        return err
    wallet = WalletModel.get_by_user_id(auth['user_id'])
    return jsonify(dict(wallet) if wallet else {})

@app.route('/api/wallet/topup', methods=['POST'])
def topup_wallet():
    auth, err = require_auth()
    if err:
        return err

    data = request.get_json() or {}
    try:
        amount = float(data.get('amount', 0))
    except (ValueError, TypeError):
        return jsonify({"error": "Invalid amount provided."}), 400

    method = data.get('payment_method', 'Credit Card')
    try:
        result = WalletModel.top_up(auth['user_id'], amount, method)
        return jsonify({
            "message": f"Successfully deposited ${amount:,.2f} into your wallet.",
            "data": result
        })
    except ValueError as ve:
        return jsonify({"error": str(ve)}), 400
    except Exception as e:
        return jsonify({"error": f"Failed to complete deposit: {str(e)}"}), 500

@app.route('/api/wallet/transfer', methods=['POST'])
def transfer_money():
    auth, err = require_auth()
    if err:
        return err

    data = request.get_json() or {}
    recipient = data.get('recipient', '').strip()
    note = data.get('note', '').strip()

    try:
        amount = float(data.get('amount', 0))
    except (ValueError, TypeError):
        return jsonify({"error": "Invalid transfer amount."}), 400

    if not recipient:
        return jsonify({"error": "Recipient email or account number is required."}), 400

    try:
        result = WalletModel.transfer(auth['user_id'], recipient, amount, note)
        return jsonify({
            "message": f"Successfully transferred ${amount:,.2f} to {result['recipient_name']}.",
            "data": result
        })
    except ValueError as ve:
        return jsonify({"error": str(ve)}), 400
    except Exception as e:
        return jsonify({"error": f"Transfer failed: {str(e)}"}), 500

# ----------------- Transactions & Expenses Routes -----------------
@app.route('/api/transactions', methods=['GET'])
def get_transactions():
    auth, err = require_auth()
    if err:
        return err

    category = request.args.get('category', 'all')
    txn_type = request.args.get('type', 'all')
    limit = int(request.args.get('limit', 50))

    txns = TransactionModel.get_user_transactions(auth['user_id'], limit, category, txn_type)
    return jsonify({"transactions": txns})

@app.route('/api/transactions/expense', methods=['POST'])
def add_expense():
    auth, err = require_auth()
    if err:
        return err

    data = request.get_json() or {}
    title = data.get('title', '').strip()
    category = data.get('category', 'General').strip()

    try:
        amount = float(data.get('amount', 0))
    except (ValueError, TypeError):
        return jsonify({"error": "Invalid amount."}), 400

    if not title:
        return jsonify({"error": "Expense title is required."}), 400

    try:
        result = TransactionModel.add_expense(auth['user_id'], title, category, amount)
        return jsonify({
            "message": f"Expense of ${amount:,.2f} recorded.",
            "data": result
        }), 201
    except ValueError as ve:
        return jsonify({"error": str(ve)}), 400
    except Exception as e:
        return jsonify({"error": f"Failed to record expense: {str(e)}"}), 500

# ----------------- Subscriptions & Upcoming Payments -----------------
@app.route('/api/subscriptions', methods=['GET'])
def get_subscriptions():
    auth, err = require_auth()
    if err:
        return err

    subs = SubscriptionModel.get_by_user(auth['user_id'])
    return jsonify({"subscriptions": subs})

# ----------------- Reports & Dashboard Summary -----------------
@app.route('/api/reports/dashboard', methods=['GET'])
def get_dashboard_data():
    auth, err = require_auth()
    if err:
        return err

    summary = ReportModel.get_dashboard_summary(auth['user_id'])
    return jsonify(summary)

@app.route('/api/users/recipients', methods=['GET'])
def get_recipients():
    auth, err = require_auth()
    if err:
        return err

    users = UserModel.list_other_users(auth['user_id'])
    return jsonify({"recipients": users})

@app.route('/api/export/transactions', methods=['GET'])
def export_transactions():
    auth, err = require_auth()
    if err:
        return err

    txns = TransactionModel.get_user_transactions(auth['user_id'], limit=1000)
    
    si = io.StringIO()
    cw = csv.writer(si)
    cw.writerow(['Reference ID', 'Type', 'Category', 'Amount ($)', 'Status', 'Description', 'Date'])
    
    for t in txns:
        cw.writerow([
            t['reference_id'],
            t['type'],
            t['category'],
            t['amount'],
            t['status'],
            t['description'],
            t['created_at']
        ])
    
    output = make_response(si.getvalue())
    output.headers["Content-Disposition"] = "attachment; filename=transactions_report.csv"
    output.headers["Content-type"] = "text/csv"
    return output

if __name__ == '__main__':
    port = int(os.getenv("PORT", 5000))
    print(f"🚀 Payment & Expense Management Server running at http://127.0.0.1:{port}")
    app.run(host='0.0.0.0', port=port, debug=True)
