# 群青ノート

## ローカルで動かす
VS Codeでこのフォルダ（app.pyがある場所）を開き、ターミナルで実行。

```powershell
python -m pip install -r requirements.txt
python app.py
```

http://127.0.0.1:5000/ を開く。Pythonがない場合、static/index.htmlを直接開けば静的プレビューが動く（投稿は端末内のみ保存）。

## GitHubへ
Publicリポジトリを新規作成し、app.py、requirements.txt、requirements.md、README.md、.gitignore、staticフォルダをリポジトリ直下に置いてpushする。DBや秘密情報はアップロードしない。

## Azure App Service
Azure for Studentsのサブスクリプション、利用可能なリージョン、Linux / Python（3.12または対応するバージョン）、無料F1プランが利用できれば選択。App Serviceを作成し、デプロイセンターでGitHubの対象リポジトリ・mainブランチを選択し、GitHub Actionsを設定する。認証情報をコードに記載しない。GitHub Actionsが成功したら、Azureの概要ページにある既定のドメインを開く。起動できない場合はスタートアップコマンドに `gunicorn --bind=0.0.0.0:8000 app:app` を設定して再起動する。

公式：https://learn.microsoft.com/ja-jp/azure/app-service/configure-language-python

## 注意
Azure実環境の公開確認は利用者が行う。SQLiteは単一インスタンスでの授業用簡易保存。Blob/Table Storageは未実装。公開運用を想定した認証・通報・モデレーション・レート制限は未実装。実際の個人情報を入れないこと。

## 画面演出
`static/motion.js` と `static/motion.css` に演出を分離。外部ライブラリ不要。端末の動きの軽減設定に対応。
