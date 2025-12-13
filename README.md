# Neural Network Digit Recognizer

An interactive web app that visualizes how a neural network recognizes handwritten digits in real-time.

**🔗 Live Demo:** [neural-visualizer-production.up.railway.app](https://neural-visualizer-production.up.railway.app)

## Features

- Draw digits with adjustable brush size
- Real-time prediction powered by TensorFlow
- Live neural network visualization
- Probability distribution for all 10 digits
- Modern dark UI with glow effects
- Mobile responsive

## Quick Start

```bash
# Clone
git clone https://github.com/Chronos778/neural-visualizer.git
cd neural-visualizer

# Install dependencies
pip install -r requirements.txt

# Run
python server.py
```

Open `http://localhost:5000` in your browser.

## Tech Stack

- **Backend:** Python, Flask, TensorFlow/Keras
- **Frontend:** HTML5 Canvas, Vanilla JS, CSS3
- **Model:** CNN trained on MNIST (99%+ accuracy)

## Project Structure

```
├── server.py           # Flask backend & model
├── index.html          # Main page
├── styles.css          # Styling
├── app.js              # Drawing & UI logic
├── network.js          # API client
├── visualization.js    # Network visualization
└── requirements.txt    # Dependencies
```

## License

MIT License

## Author

**Maithil** - [GitHub](https://github.com/Chronos778)

---

Made with ❤️
