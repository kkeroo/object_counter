import torch
import glob2 as glob
import os

BATCH_SIZE = 8 # increase / decrease according to GPU memeory
RESIZE_TO = 512 # resize the image for training and transforms
NUM_EPOCHS = 5 # number of epochs to train for
NUM_WORKERS = 4
DEVICE = torch.device('cuda') if torch.cuda.is_available() else torch.device('cpu')
# classes: 0 index is reserved for background
CLASSES = [
    '__background__', 'person'
]

NUM_CLASSES = len(CLASSES)

anns = [{'width': 1008.0, 'height': 649.0, 'markers': [{'height': 67.76093749999995, 'width': 40.275, 'left': 33.99375, 'top': 499.9828125}, {'height': 57.099999999999966, 'width': 24.96406250000001, 'left': 363.284375, 'top': 358.8421875}, {'height': 47.04531250000002, 'width': 18.59062499999999, 'left': 356.0546875, 'top': 359.3984375}, {'height': 54.45625000000001, 'width': 23.8515625, 'left': 461.525, 'top': 370.2578125}, {'height': 51.978125000000034, 'width': 21.434375000000045, 'left': 475.68125, 'top': 360.840625}, {'height': 63.01718749999998, 'width': 25.554687500000057, 'left': 491.809375, 'top': 375.475}, {'height': 56.689062500000034, 'width': 19.864062499999932, 'left': 517.4046875, 'top': 369.4265625}, {'height': 54.44218749999999, 'width': 19.975000000000023, 'left': 563.3984375, 'top': 381.5359375}, {'height': 64.73906249999999, 'width': 22.082812500000045, 'left': 590.3859375, 'top': 384.5078125}]}, {'width': 1008.0, 'height': 649.0, 'markers': [{'height': 76.72812500000003, 'width': 30.628125000000004, 'left': 57.384375, 'top': 296.2703125}, {'height': 55.90937500000001, 'width': 15.246874999999989, 'left': 474.3859375, 'top': 295.9921875}, {'height': 52.03437500000001, 'width': 11.771875000000023, 'left': 486.2125, 'top': 299.55}, {'height': 66.57968750000003, 'width': 20.807812499999955, 'left': 490.6234375, 'top': 299.4546875}, {'height': 56.4453125, 'width': 24.40625, 'left': 519.5921875, 'top': 299.346875}, {'height': 54.83749999999998, 'width': 27.428125000000023, 'left': 545.0890625, 'top': 299.58125}, {'height': 47.706249999999955, 'width': 20.196874999999977, 'left': 568.921875, 'top': 302.9359375}, {'height': 66.53593750000005, 'width': 25.896875000000023, 'left': 665.3546875, 'top': 303.915625}, {'height': 56.6640625, 'width': 22.307812500000068, 'left': 682.0796875, 'top': 304.534375}]}]

images = [
    '/Users/jasa/Desktop/dron/obisk_promotorjev/DJI_0005.JPG',
    '/Users/jasa/Desktop/dron/obisk_promotorjev/DJI_0006.JPG'
]

# for pedestrians
# images = glob.glob('/Users/jasa/Downloads/pedestrians/PNGImages/*.png')
# for guns
# images = glob.glob('/Users/jasa/Downloads/guns/Images/*.jpeg')

def get_test_annotations():
    ann_folder = '/Users/jasa/Downloads/guns/Labels/*.txt'
    annotations = []

    all_files = glob.glob(ann_folder)

    for ann_file in all_files:
        filename = os.path.basename(ann_file)
        f = open(ann_file, 'r')

        lines = f.readlines()

        file_anns = []

        for i, line in enumerate(lines):
            if i == 0: continue
            
            linesplit = line.split(' ')
            file_anns.append({'xmin': linesplit[0], 'ymin': linesplit[1], 'xmax': linesplit[2], 'ymax': linesplit[3][:-1]})

        f.close()
        annotations.append({'filename': filename, 'markers': file_anns})
    return annotations

def get_test_annotations_people():
    ann_folder = '/Users/jasa/Downloads/pedestrians/Annotation/*.txt'
    annotations = []

    all_files = glob.glob(ann_folder)
    
    for ann_file in all_files:
        filename = os.path.basename(ann_file)
        
        f = open(ann_file, 'r')
        lines = f.readlines()

        file_anns = []

        for line in lines:
            if line[0] == '#': continue
            
            words = line.split(' ')
            if words[0] == 'Bounding':
                linesplit = line.split('(')
                first = linesplit[-2]
                second = linesplit[-1]
                first = first.split(')')[0]
                second = second.split(')')[0]
                first = first.split(', ')
                second = second.split(', ')
                file_anns.append({'xmin': first[0], 'ymin': first[1], 'xmax': second[0], 'ymax': second[1]})

        f.close()
        annotations.append({'filename': filename, 'markers': file_anns})
    
    return annotations
