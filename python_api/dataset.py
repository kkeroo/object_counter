import torch
import cv2
from torch.utils.data import Dataset, DataLoader
import os
import numpy as np
import glob2 as glob

from config import CLASSES, get_test_annotations, images
from helpers import collate_fn, show_tranformed_image
from transforms import get_valid_transform, get_train_transform

class CustomDataset(Dataset):
    def __init__(self, images, width, height, classes, annotations, transforms=None):
        self.transforms = transforms
        self.height = height
        self.width = width
        self.classes = classes
        self.annotations = annotations
        
        # get all the image paths in sorted order
        # self.image_paths = images

        # images is array of cv2 read images
        self.images = images

        # self.all_images = [image_path.split(os.path.sep)[-1] for image_path in self.image_paths]
        #self.all_images = sorted(self.all_images)

    def __getitem__(self, idx):
        # capture the image name and the full image path

        # we dont need this anymore...
        # image_name = self.all_images[idx]
        # image_path = self.image_paths[idx]
        # read the image
        # image = cv2.imread(image_path)

        image = self.images[idx]

        # convert BGR to RGB color format
        image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB).astype(np.float32)
        image_resized = cv2.resize(image, (self.width, self.height))
        image_resized /= 255.0
        
        boxes = []
        labels = []
        
        # get the height and width of the image
        image_width = image.shape[1]
        image_height = image.shape[0]
        

        ann_img = self.annotations[idx]

        # image_name = os.path.basename(image_path)
        # image_name = image_name[:-5]

        # annotation = None

        # for a in self.annotations:
        #     if a['filename'][:-4] == image_name:
        #         annotation = a
        #         break

        # for marker in annotation['markers']:
        #     labels.append(1)
            
        #     xmin = int(marker['xmin'])+3
        #     xmax = int(marker['xmax'])-3
        #     ymin = int(marker['ymin'])+3
        #     ymax = int(marker['ymax'])-3

        #     xmin_final = (xmin/image_width)*self.width
        #     xmax_final = (xmax/image_width)*self.width
        #     ymin_final = (ymin/image_height)*self.height
        #     ymax_final = (ymax/image_height)*self.height
            
        #     boxes.append([xmin_final, ymin_final, xmax_final, ymax_final])


        for marker in ann_img['markers']:
            # map the current object name to `classes` list to get...
            # ... the label index and append to `labels` list
            labels.append(1)
                
            # xmin = left corner x-coordinates
            # xmin = int(member.find('bndbox').find('xmin').text)
            xmin = max(int(marker['left']) * (image_width/int(ann_img['width'])), 1)
            # xmax = right corner x-coordinates
            # xmax = int(member.find('bndbox').find('xmax').text)
            xmax = min((int(marker['left']) + int(marker['width'])) * (image_width/int(ann_img['width'])), image_width - 1)
            # ymin = left corner y-coordinates
            # ymin = int(member.find('bndbox').find('ymin').text)
            ymin = max(int(marker['top']) * (image_height/int(ann_img['height'])), 1)
            # ymax = right corner y-coordinates
            # ymax = int(member.find('bndbox').find('ymax').text)
            ymax = min((int(marker['top']) + int(marker['height'])) * (image_height/int(ann_img['height'])), image_height - 1)
                
            # resize the bounding boxes according to the...
            # ... desired `width`, `height`
            xmin_final = (xmin/image_width)*self.width
            xmax_final = (xmax/image_width)*self.width
            ymin_final = (ymin/image_height)*self.height
            ymax_final = (ymax/image_height)*self.height
            
            boxes.append([xmin_final, ymin_final, xmax_final, ymax_final])
            # print([xmin_final, ymin_final, xmax_final, ymax_final])
            # boxes.append([xmin, ymin, xmax, ymax])

        # bounding box to tensor
        boxes = torch.as_tensor(boxes, dtype=torch.float32)
        # area of the bounding boxes
        area = (boxes[:, 3] - boxes[:, 1]) * (boxes[:, 2] - boxes[:, 0])
        # no crowd instances
        iscrowd = torch.zeros((boxes.shape[0],), dtype=torch.int64)
        # labels to tensor
        labels = torch.as_tensor(labels, dtype=torch.int64)
        # prepare the final `target` dictionary
        target = {}
        target["boxes"] = boxes
        target["labels"] = labels
        target["area"] = area
        target["iscrowd"] = iscrowd
        image_id = torch.tensor([idx])
        target["image_id"] = image_id
        # apply the image transforms
        if self.transforms:
            sample = self.transforms(image = image_resized,
                                     bboxes = target['boxes'],
                                     labels = labels)
            # print(self.transforms)
            # sample = self.transforms(image_resized)
            image_resized = sample['image']
            target['boxes'] = torch.Tensor(sample['bboxes'])
            # print(sample)
            # image_resized = sample
            
        return image_resized, target

    def __len__(self):
        return len(self.images)

# prepare the final datasets and data loaders
def create_train_dataset(imgs, size_x, size_y, classes, annotations):
    # train_dataset = CustomDataset(imgs, RESIZE_TO, RESIZE_TO, CLASSES, annotations, get_train_transform())
    # train_dataset = CustomDataset(images[:250], RESIZE_TO, RESIZE_TO, CLASSES, get_test_annotations(), get_train_transform())
    train_dataset = CustomDataset(imgs, size_x, size_y, classes, annotations, get_train_transform())
    # train_dataset = CustomDataset(imgs, RESIZE_TO, RESIZE_TO, CLASSES, annotations)
    return train_dataset
def create_valid_dataset(imgs, size_x, size_y, classes, annotations):
    # valid_dataset = CustomDataset(imgs, RESIZE_TO, RESIZE_TO, CLASSES, annotations, get_valid_transform())
    # valid_dataset = CustomDataset(images[250:300], RESIZE_TO, RESIZE_TO, CLASSES, get_test_annotations(), get_valid_transform())
    valid_dataset = CustomDataset(imgs, size_x, size_y, classes, annotations, get_valid_transform())
    # valid_dataset = CustomDataset(imgs, RESIZE_TO, RESIZE_TO, CLASSES, annotations)
    return valid_dataset

def create_train_loader(train_dataset, batch_size, num_workers=0):
    # train_loader = DataLoader(
    #     train_dataset,
    #     batch_size=BATCH_SIZE,
    #     shuffle=True,
    #     num_workers=num_workers,
    #     collate_fn=collate_fn
    # )
    train_loader = DataLoader(
        train_dataset,
        batch_size=batch_size,
        shuffle=True,
        num_workers=num_workers,
        collate_fn=collate_fn
    )
    return train_loader
def create_valid_loader(valid_dataset, batch_size, num_workers=0):
    # valid_loader = DataLoader(
    #     valid_dataset,
    #     batch_size=BATCH_SIZE,
    #     shuffle=False,
    #     num_workers=num_workers,
    #     collate_fn=collate_fn
    # )
    valid_loader = DataLoader(
        valid_dataset,
        batch_size=batch_size,
        shuffle=False,
        num_workers=num_workers,
        collate_fn=collate_fn
    )
    return valid_loader

if __name__ == '__main__':
    #images = glob.glob('/Users/jasa/Downloads/pedestrians/PNGImages/*.png')
    dataset = CustomDataset(images, 1024, 1024, CLASSES, get_test_annotations())
    print(f"Number of training images: {len(dataset)}")
    
    # function to visualize a single sample
    def visualize_sample(image, target):
        for box_num in range(len(target['boxes'])):
            box = target['boxes'][box_num]
            label = CLASSES[target['labels'][box_num]]
            cv2.rectangle(
                image, 
                (int(box[0]), int(box[1])), (int(box[2]), int(box[3])),
                (0, 255, 0), 2
            )
            cv2.putText(
                image, label, (int(box[0]), int(box[1]-5)), 
                cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 0, 255), 2
            )
        cv2.imshow('Image', image)
        cv2.waitKey(0)
     
    NUM_SAMPLES_TO_VISUALIZE = 2
    for i in range(NUM_SAMPLES_TO_VISUALIZE):
        image, target = dataset[i]
        visualize_sample(image, target)