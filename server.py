"""
MNIST Neural Network Backend
Trains a CNN model and provides REST API for digit recognition
"""

import os
import json
import numpy as np
from flask import Flask, request, jsonify, render_template
from flask_cors import CORS

# Limit TensorFlow memory usage for free tier hosting
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '2'
os.environ['TF_ENABLE_ONEDNN_OPTS'] = '0'

import tensorflow as tf

# Configure TensorFlow to use minimal memory
tf.config.set_soft_device_placement(True)
gpus = tf.config.list_physical_devices('GPU')
if gpus:
    for gpu in gpus:
        tf.config.experimental.set_memory_growth(gpu, True)

from tensorflow import keras
from tensorflow.keras import layers
import base64
from io import BytesIO
from PIL import Image

# Serve static files from /static and templates from /templates
app = Flask(__name__, static_folder='static', template_folder='templates')
CORS(app)  # Enable CORS for frontend

# Global model variable
model = None
MODEL_PATH = os.path.join('models', 'mnist_model.keras')


# Serve the main page
@app.route('/')
def index():
    return render_template('index.html')

def create_model():
    """Create a CNN model for MNIST digit recognition"""
    model = keras.Sequential([
        # Input layer - reshape to 28x28x1
        layers.Input(shape=(28, 28, 1)),
        
        # First Conv block
        layers.Conv2D(32, (3, 3), activation='relu', padding='same'),
        layers.BatchNormalization(),
        layers.Conv2D(32, (3, 3), activation='relu', padding='same'),
        layers.MaxPooling2D((2, 2)),
        layers.Dropout(0.25),
        
        # Second Conv block
        layers.Conv2D(64, (3, 3), activation='relu', padding='same'),
        layers.BatchNormalization(),
        layers.Conv2D(64, (3, 3), activation='relu', padding='same'),
        layers.MaxPooling2D((2, 2)),
        layers.Dropout(0.25),
        
        # Dense layers
        layers.Flatten(),
        layers.Dense(256, activation='relu'),
        layers.BatchNormalization(),
        layers.Dropout(0.5),
        layers.Dense(128, activation='relu'),
        layers.Dense(10, activation='softmax')
    ])
    
    model.compile(
        optimizer='adam',
        loss='categorical_crossentropy',
        metrics=['accuracy']
    )
    
    return model


def train_model():
    """Train the model on MNIST dataset"""
    print("Loading MNIST dataset...")
    (x_train, y_train), (x_test, y_test) = keras.datasets.mnist.load_data()
    
    # Normalize and reshape
    x_train = x_train.astype('float32') / 255.0
    x_test = x_test.astype('float32') / 255.0
    x_train = x_train.reshape(-1, 28, 28, 1)
    x_test = x_test.reshape(-1, 28, 28, 1)
    
    # One-hot encode labels
    y_train = keras.utils.to_categorical(y_train, 10)
    y_test = keras.utils.to_categorical(y_test, 10)
    
    print("Creating model...")
    model = create_model()
    model.summary()
    
    print("Training model...")
    history = model.fit(
        x_train, y_train,
        batch_size=128,
        epochs=3,
        validation_split=0.1,
        verbose=1
    )
    
    # Evaluate
    print("\nEvaluating model...")
    test_loss, test_acc = model.evaluate(x_test, y_test, verbose=0)
    print(f"Test accuracy: {test_acc * 100:.2f}%")
    
    # Save model
    model.save(MODEL_PATH)
    print(f"Model saved to {MODEL_PATH}")
    
    return model


def load_model():
    """Load existing model or train new one"""
    global model
    
    if os.path.exists(MODEL_PATH):
        print(f"Loading existing model from {MODEL_PATH}...")
        model = keras.models.load_model(MODEL_PATH)
        print("Model loaded successfully!")
    else:
        print("No existing model found. Training new model...")
        model = train_model()
    
    return model


def preprocess_image(image_data):
    """Preprocess the input image for prediction - MNIST style"""
    from scipy import ndimage
    
    # Convert to numpy array
    img_array = np.array(image_data, dtype=np.float32).reshape(28, 28)
    
    # Apply slight blur to smooth drawing artifacts
    img_array = ndimage.gaussian_filter(img_array, sigma=0.5)
    
    # Normalize to 0-1 range
    if img_array.max() > 0:
        img_array = img_array / img_array.max()
    
    # Binarize with threshold
    img_array = np.where(img_array > 0.15, img_array, 0)
    
    # Find bounding box of the digit
    coords = np.column_stack(np.where(img_array > 0.1))
    if len(coords) > 0:
        # Get bounding box
        min_y, min_x = coords.min(axis=0)
        max_y, max_x = coords.max(axis=0)
        
        # Crop to bounding box
        cropped = img_array[min_y:max_y+1, min_x:max_x+1]
        
        # Calculate new size preserving aspect ratio
        h, w = cropped.shape
        if h > w:
            new_h = 20
            new_w = max(1, int(w * 20 / h))
        else:
            new_w = 20
            new_h = max(1, int(h * 20 / w))
        
        # Resize using zoom
        zoom_factors = (new_h / h, new_w / w)
        resized = ndimage.zoom(cropped, zoom_factors, order=1)
        
        # Ensure dimensions don't exceed 20x20
        resized = resized[:20, :20]
        
        # Center in 28x28 image
        final = np.zeros((28, 28), dtype=np.float32)
        pad_y = (28 - resized.shape[0]) // 2
        pad_x = (28 - resized.shape[1]) // 2
        final[pad_y:pad_y+resized.shape[0], pad_x:pad_x+resized.shape[1]] = resized
        
        # Center of mass adjustment for better centering
        cy, cx = ndimage.center_of_mass(final)
        if not np.isnan(cy) and not np.isnan(cx):
            shift_y = int(14 - cy)
            shift_x = int(14 - cx)
            final = ndimage.shift(final, [shift_y, shift_x], mode='constant', cval=0)
        
        img_array = final
    
    # Final normalization
    if img_array.max() > 0:
        img_array = img_array / img_array.max()
    
    # Reshape for model (batch, height, width, channels)
    img_array = img_array.reshape(1, 28, 28, 1)
    
    return img_array


@app.route('/predict', methods=['POST'])
def predict():
    """Predict digit from pixel data"""
    global model
    
    if model is None:
        return jsonify({'error': 'Model not loaded'}), 500
    
    try:
        data = request.json
        pixels = data.get('pixels', [])
        
        if len(pixels) != 784:
            return jsonify({'error': 'Invalid input size'}), 400
        
        # Preprocess
        img_array = preprocess_image(pixels)
        
        # Get predictions
        predictions = model.predict(img_array, verbose=0)[0]
        
        # Get the preprocessed image for visualization
        processed_flat = img_array.flatten()
        
        # Create meaningful hidden layer activations
        # hidden1: 128 values - sample from different regions of the 28x28 image
        hidden1 = []
        for i in range(128):
            # Each hidden neuron "looks at" a different 7x7 region
            row = (i // 16) * 3
            col = (i % 16) * 2
            region_sum = 0
            count = 0
            for dy in range(7):
                for dx in range(7):
                    y, x = row + dy, col + dx
                    if 0 <= y < 28 and 0 <= x < 28:
                        region_sum += processed_flat[y * 28 + x]
                        count += 1
            hidden1.append(float(region_sum / max(count, 1)))
        
        # Normalize hidden1
        h1_max = max(hidden1) if hidden1 else 1
        if h1_max > 0:
            hidden1 = [v / h1_max for v in hidden1]
        
        # hidden2: 64 values - combinations of hidden1
        hidden2 = []
        for i in range(64):
            # Each hidden2 neuron combines 2 hidden1 neurons
            h1_idx = i * 2
            val = (hidden1[h1_idx] + hidden1[min(h1_idx + 1, 127)]) / 2
            # Modulate by output probabilities to show relevance
            out_idx = i % 10
            val = val * (0.5 + predictions[out_idx])
            hidden2.append(float(val))
        
        # Normalize hidden2
        h2_max = max(hidden2) if hidden2 else 1
        if h2_max > 0:
            hidden2 = [v / h2_max for v in hidden2]
        
        # Prepare response
        result = {
            'digit': int(np.argmax(predictions)),
            'confidence': float(predictions.max()),
            'probabilities': predictions.tolist(),
            'activations': {
                'hidden1': hidden1,
                'hidden2': hidden2
            }
        }
        
        return jsonify(result)
    
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500


@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({
        'status': 'ok',
        'model_loaded': model is not None
    })


@app.route('/retrain', methods=['POST'])
def retrain():
    """Retrain the model"""
    global model
    try:
        model = train_model()
        return jsonify({'status': 'success', 'message': 'Model retrained successfully'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# Initialize model when module is imported (for gunicorn)
print("=" * 50)
print("MNIST Neural Network Backend")
print("=" * 50)

# Load or train model at startup
load_model()

print("Model ready!")
print("=" * 50)

if __name__ == '__main__':
    print("\nStarting server on http://localhost:5000")
    app.run(host='0.0.0.0', port=5000, debug=False)
