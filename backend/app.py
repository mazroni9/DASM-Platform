from flask import Flask, jsonify, request, send_from_directory
import sqlite3
import os
from werkzeug.utils import secure_filename

app = Flask(__name__)

# المسارات الأساسية
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, 'database', 'auctions.db')

# مسارات تخزين الملفات
UPLOAD_FOLDER_IMAGES = os.path.join(BASE_DIR, 'uploads', 'images')
UPLOAD_FOLDER_REPORTS = os.path.join(BASE_DIR, 'uploads', 'reports')
os.makedirs(UPLOAD_FOLDER_IMAGES, exist_ok=True)
os.makedirs(UPLOAD_FOLDER_REPORTS, exist_ok=True)

# دالة الاتصال بقاعدة البيانات
def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

# --------------------- API Endpoints ---------------------

# جلب جميع المزادات
@app.route('/api/auctions', methods=['GET'])
def get_auctions():
    conn = get_db_connection()
    auctions = conn.execute('SELECT * FROM auctions').fetchall()
    conn.close()
    return jsonify([dict(row) for row in auctions])

# جلب الأسعار المخفية
@app.route('/api/hidden_prices', methods=['GET'])
def get_hidden_prices():
    conn = get_db_connection()
    prices = conn.execute('SELECT * FROM hidden_prices').fetchall()
    conn.close()
    return jsonify([dict(row) for row in prices])

# جلب مزاد حسب المعرف
@app.route('/api/auctions/<int:auction_id>', methods=['GET'])
def get_auction_by_id(auction_id):
    conn = get_db_connection()
    auction = conn.execute('SELECT * FROM auctions WHERE id = ?', (auction_id,)).fetchone()
    conn.close()
    if auction:
        return jsonify(dict(auction))
    else:
        return jsonify({'error': 'المزاد غير موجود'}), 404

# إدخال سيارة جديدة من نموذج الفورم
@app.route('/api/auctions', methods=['POST'])
def create_auction():
    try:
        data = request.form
        images = request.files.getlist('images')
        report = request.files.get('report')

        # حفظ الصور
        image_paths = []
        for img in images:
            filename = secure_filename(img.filename)
            save_path = os.path.join(UPLOAD_FOLDER_IMAGES, filename)
            img.save(save_path)
            image_paths.append(f'/uploads/images/{filename}')

        # حفظ تقرير الفحص
        report_path = None
        if report:
            filename = secure_filename(report.filename)
            report_path = os.path.join(UPLOAD_FOLDER_REPORTS, filename)
            report.save(report_path)
            report_path = f'/uploads/reports/{filename}'

        # تخزين البيانات في قاعدة البيانات
        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute('''
            INSERT INTO auctions (
                brand, model, year, plate, mileage, fuel, color,
                min_price, max_price
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            data.get('brand'),
            data.get('model'),
            int(data.get('year')),
            data.get('plate'),
            int(data.get('mileage')),
            data.get('fuel'),
            data.get('color'),
            float(data.get('min_price')),
            float(data.get('max_price') or 0)
        ))

        conn.commit()
        conn.close()

        return jsonify({
            "message": "✅ تم حفظ السيارة بنجاح",
            "images": image_paths,
            "report": report_path
        }), 201

    except Exception as e:
        return jsonify({"error": str(e)}), 500

# عرض الصور والتقارير المخزنة
@app.route('/uploads/<folder>/<filename>')
def uploaded_file(folder, filename):
    dir_map = {
        "images": UPLOAD_FOLDER_IMAGES,
        "reports": UPLOAD_FOLDER_REPORTS
    }
    return send_from_directory(dir_map.get(folder, ''), filename)

# --------------------- Run Server ---------------------
if __name__ == '__main__':
    app.run(debug=True, port=5000)
