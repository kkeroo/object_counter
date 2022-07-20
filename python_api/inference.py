import numpy as np
import cv2
import torch
from config import images, CLASSES
import os
import glob2 as glob

def inference(model_path, images, detection_threshold, classes):
    model = torch.load(model_path)
    model.eval()

    test_images = images

    print(f'Total images to analyze: {len(test_images)}')

    predictions = []

    for i in range(len(test_images)):
        # image = cv2.imread(test_images[i])
        image = test_images[i]['image']

        orig_image = image.copy()

        # BGR to RGB
        image = cv2.cvtColor(orig_image, cv2.COLOR_BGR2RGB).astype(np.float32)
        # make the pixel range between 0 and 1
        image /= 255.0
        # bring color channels to front
        image = np.transpose(image, (2, 0, 1)).astype(np.float)
        # convert to tensor
        image = torch.tensor(image, dtype=torch.float)
        # add batch dimension
        image = torch.unsqueeze(image, 0)

        with torch.no_grad():
            outputs = model(image)
        
        # load all detection to CPU for further operations
        outputs = [{k: v.to('cpu') for k, v in t.items()} for t in outputs]
        # carry further only if there are detected boxes
        if len(outputs[0]['boxes']) != 0:
            boxes = outputs[0]['boxes'].data.numpy()
            scores = outputs[0]['scores'].data.numpy()
            # filter out boxes according to `detection_threshold`
            boxes = boxes[scores >= detection_threshold].astype(np.int32)
            print(boxes)
            draw_boxes = boxes.copy()
            # get all the predicited class names
            pred_classes = [classes[i] for i in outputs[0]['labels'].cpu().numpy()]
            
            # draw the bounding boxes and write the class name on top of it
            for j, box in enumerate(draw_boxes):
                cv2.rectangle(orig_image,
                            (int(box[0]), int(box[1])),
                            (int(box[2]), int(box[3])),
                            (0, 0, 255), 2)
                cv2.putText(orig_image, pred_classes[j], 
                            (int(box[0]), int(box[1]-5)),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 
                            2, lineType=cv2.LINE_AA)
            # cv2.imwrite(f"./predictions/{os.path.basename(test_images[i])}", orig_image,)
            # predictions.append({'image': os.path.basename(test_images[i]), 'count': len(draw_boxes)})
            cv2.imwrite(f"./predictions/{test_images[i]['name']}", orig_image,)
            predictions.append({'image': test_images[i]['name'], 'count': len(draw_boxes)})

        print(f"Image {i+1} done...")
        print('-'*50)
    print('TEST PREDICTIONS COMPLETE')
    print(predictions)
    return predictions


if __name__ == '__main__':
    model = torch.load('./best_model.pt')
    model.eval()

    test_images = images[300:]
    # test_images = glob.glob('/Users/jasa/Desktop/dron/obisk_promotorjev/*.JPG')

    detection_threshold = 0.6

    for i in range(len(test_images)):
        image = cv2.imread(test_images[i])

        orig_image = image.copy()

        # BGR to RGB
        image = cv2.cvtColor(orig_image, cv2.COLOR_BGR2RGB).astype(np.float32)
        # make the pixel range between 0 and 1
        image /= 255.0
        # bring color channels to front
        image = np.transpose(image, (2, 0, 1)).astype(np.float)
        # convert to tensor
        image = torch.tensor(image, dtype=torch.float)
        # add batch dimension
        image = torch.unsqueeze(image, 0)

        with torch.no_grad():
            outputs = model(image)
        
        # load all detection to CPU for further operations
        outputs = [{k: v.to('cpu') for k, v in t.items()} for t in outputs]
        # carry further only if there are detected boxes
        if len(outputs[0]['boxes']) != 0:
            boxes = outputs[0]['boxes'].data.numpy()
            scores = outputs[0]['scores'].data.numpy()
            # filter out boxes according to `detection_threshold`
            boxes = boxes[scores >= detection_threshold].astype(np.int32)
            print(boxes)
            draw_boxes = boxes.copy()
            # get all the predicited class names
            pred_classes = [CLASSES[i] for i in outputs[0]['labels'].cpu().numpy()]
            
            # draw the bounding boxes and write the class name on top of it
            for j, box in enumerate(draw_boxes):
                cv2.rectangle(orig_image,
                            (int(box[0]), int(box[1])),
                            (int(box[2]), int(box[3])),
                            (0, 0, 255), 2)
                cv2.putText(orig_image, pred_classes[j], 
                            (int(box[0]), int(box[1]-5)),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 
                            2, lineType=cv2.LINE_AA)
            cv2.imshow('Prediction', orig_image)
            cv2.waitKey(1)
            cv2.imwrite(f"./predictions/{os.path.basename(test_images[i])}", orig_image,)
        print(f"Image {i+1} done...")
        print('-'*50)
    print('TEST PREDICTIONS COMPLETE')
    cv2.destroyAllWindows()