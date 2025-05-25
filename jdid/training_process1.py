import os
import cv2
import numpy as np
import tensorflow as tf
import matplotlib.pyplot as plt
from tensorflow.keras import layers, Model, Input
from tensorflow.keras.layers import Lambda
from tensorflow.keras.callbacks import EarlyStopping, ModelCheckpoint
from sklearn.utils import shuffle
from sklearn.model_selection import train_test_split
from tensorflow.keras.utils import to_categorical
import tensorflow.keras.backend as K
from tensorflow.keras.layers import Layer

class L2Normalization(Layer):
    def __init__(self, **kwargs):
        super(L2Normalization, self).__init__(**kwargs)

    def call(self, inputs):
        return tf.nn.l2_normalize(inputs, axis=1)

    def get_config(self):
        config = super().get_config()
        return config
#main model(embedding_model)
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

def preprocess(image):
    image = cv2.resize(image, (160, 160))
    image = image.astype('float32') / 255.0
    return image

def triplet_loss(alpha=0.2):
    def loss(y_true, y_pred):
        anchor, positive, negative = y_pred[:, 0:128], y_pred[:, 128:256], y_pred[:, 256:384]
        pos_dist = tf.reduce_sum(tf.square(anchor - positive), axis=1)
        neg_dist = tf.reduce_sum(tf.square(anchor - negative), axis=1)
        basic_loss = pos_dist - neg_dist + alpha
        loss = tf.reduce_mean(tf.maximum(basic_loss, 0.0))
        return loss
    return loss

def load_triplet_images(triplet_folder_path):
    anchors, positives, negatives = [], [], []

    for dir_name in sorted(os.listdir(triplet_folder_path)):
        triplet_path = os.path.join(triplet_folder_path, dir_name)
        if not os.path.isdir(triplet_path):
            continue

        paths = {
            'anchor': os.path.join(triplet_path, 'anchor.jpg'),
            'positive': os.path.join(triplet_path, 'positive.jpg'),
            'negative': os.path.join(triplet_path, 'negative.jpg')
        }

        if not all(os.path.exists(p) for p in paths.values()):
            continue

        anchor_img = preprocess(cv2.imread(paths['anchor']))
        positive_img = preprocess(cv2.imread(paths['positive']))
        negative_img = preprocess(cv2.imread(paths['negative']))

        anchors.append(anchor_img)
        positives.append(positive_img)
        negatives.append(negative_img)

    anchors = np.array(anchors)
    positives = np.array(positives)
    negatives = np.array(negatives)
    dummy_labels = np.zeros((len(anchors),))
    return [anchors, positives, negatives], dummy_labels
#triplet model(uses the main model to generate triplet embeddings in a single tensor )
anchor_input = Input(shape=(160, 160, 3), name='anchor_input')
positive_input = Input(shape=(160, 160, 3), name='positive_input')
negative_input = Input(shape=(160, 160, 3), name='negative_input')

anchor_embedding = embedding_model(anchor_input)
positive_embedding = embedding_model(positive_input)
negative_embedding = embedding_model(negative_input)

merged_output = layers.Concatenate(axis=1)([anchor_embedding, positive_embedding, negative_embedding])
triplet_model = Model(inputs=[anchor_input, positive_input, negative_input], outputs=merged_output)
triplet_model.compile(optimizer='adam', loss=triplet_loss(alpha=0.2))

triplet_folder = 'C:/Users/hmani/new_test/triplets_outputsmall/easy' 
X, y = load_triplet_images(triplet_folder)

callbacks = [
    EarlyStopping(patience=3, restore_best_weights=True),
    ModelCheckpoint('triplet_model.keras', save_best_only=True)
]
#the training process(the training should be allowed in the model men9bel)
history = triplet_model.fit(
    X, y,
    batch_size=8,
    epochs=20,
    validation_split=0.2,
    callbacks=callbacks
)
#hada the the new trained model that's gonna be loaded and used later
embedding_model.save('trained_embedding_model.keras')

# progress visualization 
plt.figure(figsize=(10, 5))
plt.plot(history.history['loss'], label='Training Loss')
plt.plot(history.history['val_loss'], label='Validation Loss')
plt.title('Triplet Loss During Training')
plt.xlabel('Epochs')
plt.ylabel('Loss')
plt.legend()
plt.grid(True)
plt.show()