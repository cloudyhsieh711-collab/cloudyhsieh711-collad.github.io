import http.server
import socketserver
import json
import os
import urllib.parse
from datetime import datetime

PORT = 8000
DB_FILE = 'posts.json'

# 確保資料庫檔案存在
if not os.path.exists(DB_FILE):
    with open(DB_FILE, 'w', encoding='utf-8') as f:
        json.dump([], f, ensure_ascii=False)

class BearSmartHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        # 允許 CORS 跨域請求（以便外部的 n8n 能輕鬆 POST）
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        super().end_headers()

    def do_OPTIONS(self):
        # 處理 CORS 預檢請求
        self.send_response(200, "OK")
        self.end_headers()

    def do_GET(self):
        # API: 取得所有專欄文章
        if self.path == '/api/posts':
            self.send_response(200)
            self.send_header('Content-type', 'application/json; charset=utf-8')
            self.end_headers()
            
            with open(DB_FILE, 'r', encoding='utf-8') as f:
                data = json.load(f)
            
            self.wfile.write(json.dumps(data, ensure_ascii=False).encode('utf-8'))
        else:
            # 預設首頁
            if self.path == '/' or self.path == '':
                self.path = '/index.html'
            super().do_GET()

    def do_POST(self):
        # API: 發布新專欄文章（供 n8n 呼叫）
        if self.path == '/api/posts':
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length).decode('utf-8')
            
            try:
                payload = json.loads(post_data)
                subject = payload.get('subject', '自動化精選文章')
                html_content = payload.get('html', '')
                
                # 若 html 為空，試著從 content 或 body 欄位取得
                if not html_content:
                    html_content = payload.get('content', payload.get('message', '內容為空'))

                # 讀取現有文章
                with open(DB_FILE, 'r', encoding='utf-8') as f:
                    posts = json.load(f)
                
                # 建立新文章項目
                new_post = {
                    "id": len(posts) + 1,
                    "title": subject,
                    "content": html_content,
                    "date": datetime.now().strftime("%Y-%m-%d"),
                    "tag": "自動化摘要"
                }
                
                # 插入到最前面（最新發布在最上面）
                posts.insert(0, new_post)
                
                with open(DB_FILE, 'w', encoding='utf-8') as f:
                    json.dump(posts, f, ensure_ascii=False, indent=2)
                
                self.send_response(200)
                self.send_header('Content-type', 'application/json; charset=utf-8')
                self.end_headers()
                
                response = {"status": "success", "message": "文章發布成功！", "post": new_post}
                self.wfile.write(json.dumps(response, ensure_ascii=False).encode('utf-8'))
                print(f"[熊智 AI 伺服器] 已成功接收並發布文章: {subject}")
                
            except Exception as e:
                self.send_response(400)
                self.send_header('Content-type', 'application/json; charset=utf-8')
                self.end_headers()
                err_response = {"status": "error", "message": f"資料解析失敗: {str(e)}"}
                self.wfile.write(json.dumps(err_response).encode('utf-8'))
        else:
            self.send_response(404)
            self.end_headers()

if __name__ == '__main__':
    # 執行伺服器
    with socketserver.TCPServer(("", PORT), BearSmartHTTPRequestHandler) as httpd:
        print(f"==================================================")
        print(f"🐻 熊智 AI 專案伺服器已在本地啟動！")
        print(f"🔗 前台網址: http://localhost:{PORT}")
        print(f"🔗 發布 API: http://localhost:{PORT}/api/posts")
        print(f"==================================================")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n伺服器已關閉。")
            httpd.server_close()
