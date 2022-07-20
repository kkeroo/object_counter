import time
from inference import inference
from model import train
import glob2 as glob

def print_task(seconds):
    print("Starting task")
    for num in range(seconds):
        print(num, ". Hello World!")
        time.sleep(1)
    print("Task completed")

def train_model(images, annotations, epochs, batchSize, label):
    return train(images, annotations, batchSize, epochs, label)

def predict(model_path, images, detection_threshold, label):
    return inference(model_path, images, detection_threshold, ['__background__', label])

if __name__ == '__main__':
    images = glob.glob('/Users/jasa/Downloads/guns/Images/*.jpeg')
    results = inference('./best_model.pt', images, 0., ['__background__', 'gun'])