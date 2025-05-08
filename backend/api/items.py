from flask import Flask, request, jsonify
import sqlite3
import json

app = Flask(__name__)
DB_PATH = 'database/auctions.db'  # تأكد أن المسار صحيح داخل مشروعك

@app.route("/api/items", methods=["GET"])
def get_items():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM items ORDER BY created_at DESC")
    rows = cursor.fetchall()
    conn.close()
    items = [dict(row) for row in rows]
    return jsonify(items)

@app.route("/api/items", methods=["POST"])
def add_item():
    data = request.form.to_dict()
    images = request.form.getlist('images')  # صور متعددة
    additional_info = request.form.get('additional_info')
    auction_result = data.get('auction_result', 'بانتظار المزايدة')  # القيمة الافتراضية

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    cursor.execute("""
        INSERT INTO items (
            title, description, category, type,
            min_price, max_price, start_price, current_price,
            high_price, low_price, images, inspection_report,
            additional_info, auction_result
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        data.get('title'),
        data.get('description'),
        data.get('category'),
        data.get('type', 'instant'),
        data.get('min_price'),
        data.get('max_price'),
        data.get('start_price'),
        data.get('current_price'),
        data.get('high_price'),
        data.get('low_price'),
        json.dumps(images),
        data.get('inspection_report'),
        additional_info,
        auction_result
    ))

    conn.commit()
    conn.close()
    return jsonify({"status": "success"}), 201

if __name__ == "__main__":
    app.run(debug=True)
