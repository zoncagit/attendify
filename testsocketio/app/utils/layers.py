import tensorflow as tf
from keras import layers

class L2Normalization(layers.Layer):
    """
    Custom layer for L2 normalization of embeddings.
    This is commonly used in face recognition models to normalize face embeddings.
    """
    def __init__(self, axis=-1, epsilon=1e-7, **kwargs):
        super(L2Normalization, self).__init__(**kwargs)
        self.axis = axis
        self.epsilon = epsilon

    def call(self, inputs):
        """
        Normalize the inputs using L2 normalization.
        Args:
            inputs: Input tensor
        Returns:
            L2 normalized tensor
        """
        return tf.math.l2_normalize(inputs, axis=self.axis, epsilon=self.epsilon)

    def get_config(self):
        """
        Get the configuration of the layer.
        Required for saving and loading the model.
        """
        config = super(L2Normalization, self).get_config()
        config.update({
            'axis': self.axis,
            'epsilon': self.epsilon
        })
        return config 