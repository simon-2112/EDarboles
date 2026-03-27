from flask import Flask
from flask_cors import CORS
from controllers.treeController import tree_bp

app = Flask(__name__)

# Enable CORS for all routes
CORS(app, resources={r"/api/*": {"origins": "*"}})

app.register_blueprint(tree_bp, url_prefix="/api/tree")

if __name__ == "__main__":
    app.run(debug=True)
