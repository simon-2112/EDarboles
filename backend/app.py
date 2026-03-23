from flask import Flask
from controllers.treeController import tree_bp

app = Flask(__name__)

app.register_blueprint(tree_bp, url_prefix="/api/tree")

if __name__ == "__main__":
    app.run(debug=True)