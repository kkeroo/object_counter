import time
from inference import inference, inference_faster_rcnn
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

def predict_faster_rcnn(images, detection_threshold, label):
    return inference_faster_rcnn(images, detection_threshold, label)

if __name__ == '__main__':
    # images = glob.glob('/Users/jasa/Downloads/guns/Images/*.jpeg')
    # results = inference('./best_model.pt', images, 0., ['__background__', 'gun'])
    images = [
        {
            'name': 'FudanPed00001.png',
            'image': '/Users/jasa/Downloads/pedestrians/PNGImages/FudanPed00001.png'
        },
        {
            'name': 'FudanPed00002.png',
            'image': '/Users/jasa/Downloads/pedestrians/PNGImages/FudanPed00002.png'
        }
    ]
    results = inference_faster_rcnn(images, 0.6, 'person')