import tensorflow as tf
from tensorflow.keras.layers import Layer
import numpy as np

class L2Normalization(Layer):
    """Custom L2 normalization layer"""
    def __init__(self, **kwargs):
        super(L2Normalization, self).__init__(**kwargs)

    def call(self, inputs):
        return tf.math.l2_normalize(inputs, axis=1)

    def get_config(self):
        config = super(L2Normalization, self).get_config()
        return config

def load_face_model(model_path):
    """Load the face recognition model with custom objects"""
    custom_objects = {
        'L2Normalization': L2Normalization
    }
    
    try:
        model = tf.keras.models.load_model(
            model_path,
            custom_objects=custom_objects,
            compile=False
        )
        return model
    except Exception as e:
        print(f"Error loading model: {str(e)}")
        raise 