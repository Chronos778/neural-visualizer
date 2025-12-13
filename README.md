# Neural Network Digit Recognizer

<p align="center">
  <img src="demo.gif" alt="Demo" width="800">
</p>

<p align="center">
  <a href="https://neural-visualizer-46f1.onrender.com">🌐 Live Demo</a> •
  <a href="#-quick-start">Quick Start</a> •
  <a href="#-features">Features</a> •
  <a href="#-deployment">Deployment</a>
</p>

A beautiful, interactive web application that visualizes how a neural network recognizes handwritten digits in real-time. Draw a digit and watch the network's neurons activate as it makes predictions.

> **🔗 Try it now:** [https://neural-visualizer-46f1.onrender.com](https://neural-visualizer-46f1.onrender.com)

## ✨ Features

- **Interactive Drawing Canvas** - Draw digits with adjustable brush size
- **Real-time Prediction** - Instant digit recognition powered by TensorFlow
- **Live Network Visualization** - See neurons light up and connections activate
- **Probability Distribution** - View confidence scores for all 10 digits
- **Modern Dark UI** - Sleek, aesthetic interface with glow effects
- **Fully Responsive** - Works on desktop, tablet, and mobile devices
- **99%+ Accuracy** - Trained on the MNIST dataset with CNN architecture

## 🚀 Quick Start

### Prerequisites

- Python 3.8+
- pip

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/neural-network-visualizer.git
   cd neural-network-visualizer
   ```

2. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

3. **Run the application**
   ```bash
   python server.py
   ```

4. **Open in browser**
   ```
   http://localhost:5000
   ```

On first run, the model will automatically train on the MNIST dataset (~5 minutes). Subsequent runs will load the saved model instantly.

## 🛠️ Tech Stack

### Backend
- **Python 3.8+** - Server runtime
- **Flask** - Lightweight web framework
- **TensorFlow/Keras** - Deep learning framework
- **NumPy** - Numerical computing
- **SciPy** - Image preprocessing

### Frontend
- **HTML5 Canvas** - Drawing interface
- **Vanilla JavaScript** - No framework dependencies
- **CSS3** - Modern styling with animations

### Model Architecture
```
Input (28x28x1)
    ↓
Conv2D (32 filters, 3x3) + BatchNorm + ReLU
    ↓
Conv2D (32 filters, 3x3) + ReLU
    ↓
MaxPooling2D (2x2) + Dropout (0.25)
    ↓
Conv2D (64 filters, 3x3) + BatchNorm + ReLU
    ↓
Conv2D (64 filters, 3x3) + ReLU
    ↓
MaxPooling2D (2x2) + Dropout (0.25)
    ↓
Flatten
    ↓
Dense (256) + BatchNorm + Dropout (0.5)
    ↓
Dense (128) + ReLU
    ↓
Dense (10) + Softmax
```

## 📁 Project Structure

```
neural-network-visualizer/
├── server.py           # Flask backend & model training
├── index.html          # Main HTML page
├── styles.css          # Responsive CSS with dark theme
├── app.js              # Drawing canvas & UI logic
├── network.js          # API client for predictions
├── visualization.js    # Neural network canvas visualization
├── requirements.txt    # Python dependencies
├── Procfile           # Deployment configuration
├── runtime.txt        # Python version for deployment
├── .gitignore         # Git ignore rules
└── README.md          # This file
```

## 🎨 Screenshots

### Desktop View
The full interface with drawing canvas, network visualization, and prediction results side by side.

### Mobile View
Stacked layout optimized for touch interaction on smaller screens.

## 🌐 Deployment

### Deploy to Render (Free)

1. Push to GitHub
2. Go to [render.com](https://render.com)
3. Create new **Web Service**
4. Connect your GitHub repo
5. Configure:
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `gunicorn server:app`
6. Deploy!

### Deploy to Heroku

```bash
heroku create your-app-name
git push heroku main
```

### Deploy to Railway

1. Connect GitHub repo at [railway.app](https://railway.app)
2. Railway auto-detects Python and deploys

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | 5000 |
| `MODEL_PATH` | Path to saved model | mnist_model.keras |

### Customization

- **Brush Size**: Adjustable via slider (10-40px)
- **Theme**: Edit CSS variables in `styles.css`
- **Model**: Retrain by deleting `mnist_model.keras`

## 📊 API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/` | GET | Serve main page |
| `/health` | GET | Health check |
| `/predict` | POST | Predict digit from pixel data |
| `/retrain` | POST | Retrain the model |

### Predict API

**Request:**
```json
{
  "pixels": [0.0, 0.1, 0.9, ...] // 784 values (28x28)
}
```

**Response:**
```json
{
  "digit": 7,
  "confidence": 0.98,
  "probabilities": [0.01, 0.0, ...],
  "activations": {
    "hidden1": [...],
    "hidden2": [...]
  }
}
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## � Deployment

### Option 1: Full Stack on Render (Current Setup)

Deploy the entire app (backend + frontend) to Render:

1. Push to GitHub
2. Create a **Web Service** on [render.com](https://render.com)
3. Connect your GitHub repo
4. Settings:
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `gunicorn server:app`
5. Deploy!

### Option 2: Frontend Only (Static Hosting)

If you want to host just the frontend separately (faster, free):

#### **GitHub Pages** (Free)
```bash
# Create gh-pages branch with only frontend files
git checkout -b gh-pages
# Keep only: index.html, styles.css, app.js, visualization.js, network.js
git add index.html styles.css app.js visualization.js network.js
git commit -m "Frontend only"
git push origin gh-pages
```
Then enable GitHub Pages in repo settings → Pages → Source: `gh-pages`

#### **Netlify** (Free)
1. Go to [netlify.com](https://netlify.com)
2. Drag & drop your frontend folder (html, css, js files)
3. Done! Get a free `.netlify.app` URL

#### **Vercel** (Free)
1. Install: `npm i -g vercel`
2. Run: `vercel` in your project folder
3. Follow prompts

#### **Cloudflare Pages** (Free)
1. Go to [pages.cloudflare.com](https://pages.cloudflare.com)
2. Connect GitHub repo
3. Set build output to `/` (root)

> ⚠️ **Note:** Frontend-only hosting requires the backend to be hosted separately. Update `network.js` to point to your backend URL.

### Option 3: Separate Frontend + Backend

**Backend (API):** Deploy to Render, Railway, or Heroku
**Frontend:** Deploy to Netlify, Vercel, or GitHub Pages

Update `network.js`:
```javascript
const API_URL = 'https://your-backend-url.onrender.com';
```

## �📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [MNIST Dataset](http://yann.lecun.com/exdb/mnist/) - Handwritten digit database
- [TensorFlow](https://tensorflow.org) - Machine learning framework
- [Flask](https://flask.palletsprojects.com) - Web framework

## 📬 Contact

Your Name - [@yourtwitter](https://twitter.com/yourtwitter)

Project Link: [https://github.com/yourusername/neural-network-visualizer](https://github.com/yourusername/neural-network-visualizer)

---

<p align="center">
  Made with ❤️ and 🧠
</p>
