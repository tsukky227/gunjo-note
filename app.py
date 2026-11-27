from flask import Flask, request, jsonify, send_from_directory
from pathlib import Path
import os, sqlite3, secrets, hashlib, json, re
app = Flask(__name__, static_folder='static', static_url_path='')
app.config['MAX_CONTENT_LENGTH']=8192
root=Path(__file__).resolve().parent
db=Path(os.environ.get('SEISHUN_DB', '/home/seishun.db' if os.environ.get('WEBSITE_SITE_NAME') else str(root/'seishun.db')))
categories={'友達','学校生活','放課後','挑戦','その他'}
def connect():
    con=sqlite3.connect(db, timeout=10);con.row_factory=sqlite3.Row;return con
def init():
    with connect() as con:
        con.execute('CREATE TABLE IF NOT EXISTS posts (id TEXT PRIMARY KEY, category TEXT, title TEXT, body TEXT, nickname TEXT, likes INTEGER, done INTEGER, token TEXT)')
        seeds=[('s1','友達','制服で海まで行って写真を撮りたい','いつも駅で解散するけど、卒業前にみんなで少し遠くまで寄り道したい。','夕焼け',12,0),('s2','学校生活','お世話になった先生に手紙を渡す','普段は照れくさくて言えないありがとうを、最後にちゃんと伝えたい。','匿名',8,0),('s3','挑戦','文化祭で初めてステージに立つ','緊張したけど、友達と一緒に最後まで演奏できた！','ラムネ',16,1),('s4','放課後','放課後にみんなでたこ焼きパーティー','いつものメンバーでくだらない話をしながら過ごしたい。','匿名',5,0),('s5','友達','クラス全員で集合写真を撮る','卒業しても見返せる一枚を残したい。','青い空',9,0),('s6','挑戦','苦手だった英語のテストで目標点を取る','最後まで諦めずに勉強したら、やっと目標を超えられた。','匿名',7,1)]
        con.executemany('INSERT OR IGNORE INTO posts VALUES (?,?,?,?,?,?,?,?)',[(*s,'') for s in seeds])
init()
def public(row):
    d=dict(row);d.pop('token');d['done']=bool(d['done']);return d
@app.get('/')
def index(): return send_from_directory(app.static_folder,'index.html')
@app.get('/api/posts')
def get_posts():
    with connect() as con: return jsonify([public(r) for r in con.execute('SELECT * FROM posts ORDER BY rowid DESC LIMIT 200')])
@app.post('/api/posts')
def create():
    data=request.get_json(silent=True)
    if not isinstance(data,dict): return jsonify(error='invalid'),400
    def field(k):
        v=data.get(k,'');return v.strip() if isinstance(v,str) else ''
    cat,title,body,nick=field('category'),field('title'),field('body'),field('nickname') or '匿名'
    if cat not in categories or not 1<=len(title)<=60 or not 1<=len(body)<=300 or len(nick)>20: return jsonify(error='invalid'),400
    id='p'+secrets.token_hex(10);token=secrets.token_urlsafe(24)
    with connect() as con:
        con.execute('INSERT INTO posts VALUES (?,?,?,?,?,0,0,?)',(id,cat,title,body,nick,hashlib.sha256(token.encode()).hexdigest()))
        post=public(con.execute('SELECT * FROM posts WHERE id=?',(id,)).fetchone())
    return jsonify(post=post,token=token),201
@app.post('/api/posts/<id>/<action>')
def update(id,action):
    if action not in ('like','done'):return jsonify(error='invalid'),400
    with connect() as con:
        row=con.execute('SELECT * FROM posts WHERE id=?',(id,)).fetchone()
        if row is None:return jsonify(error='not found'),404
        if action=='done':
            data=request.get_json(silent=True);token=data.get('token','') if isinstance(data,dict) else ''
            if not isinstance(token,str) or not row['token'] or not secrets.compare_digest(row['token'],hashlib.sha256(token.encode()).hexdigest()):return jsonify(error='forbidden'),403
            con.execute('UPDATE posts SET done=1 WHERE id=?',(id,))
        else:con.execute('UPDATE posts SET likes=likes+1 WHERE id=?',(id,))
        return jsonify(public(con.execute('SELECT * FROM posts WHERE id=?',(id,)).fetchone()))
if __name__=='__main__':app.run()
