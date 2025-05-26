import os
import cv2
import numpy as np
import tensorflow as tf
from tensorflow.keras import layers, Model, Input
from sklearn.model_selection import train_test_split
from tensorflow.keras.utils import to_categorical
from mtcnn import MTCNN
import tensorflow.keras.backend as K
from tensorflow.keras.callbacks import ModelCheckpoint, EarlyStopping
from tensorflow.keras.layers import Lambda
from tensorflow.keras.layers import Layer


class L2Normalization(Layer):
    def __init__(self, **kwargs):
        super(L2Normalization, self).__init__(**kwargs)

    def call(self, inputs):
        return tf.nn.l2_normalize(inputs, axis=1)

    def get_config(self):
        config = super().get_config()
        return config

input_shape = (160, 160, 3)


input_layer = Input(shape=input_shape, name='InputImage')


x = layers.Conv2D(32, (3, 3), activation='relu', padding='same')(input_layer)
x = layers.BatchNormalization()(x)
x = layers.MaxPooling2D(pool_size=(2, 2))(x)
x = layers.Conv2D(64, (3, 3), activation='relu', padding='same')(x)
x = layers.BatchNormalization()(x)
x = layers.MaxPooling2D(pool_size=(2, 2))(x)
x = layers.Conv2D(128, (3, 3), activation='relu', padding='same')(x)
x = layers.BatchNormalization()(x)
x = layers.MaxPooling2D(pool_size=(2, 2))(x)

x = layers.Flatten()(x)
x = layers.Dense(128)(x)
output = L2Normalization(name='L2_Normalized_Embedding')(x)
embedding_model = Model(inputs=input_layer, outputs=output, name='EmbeddingModel')