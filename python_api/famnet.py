import cv2
from model import CountRegressor, Resnet50FPN
from utils import MAPS, Scales, Transform, extract_features
from utils import visualize_output_and_save, select_exemplar_rois
from PIL import Image
import os
import torch
import argparse
import torch.optim as optim
from utils import MincountLoss, PerturbationLoss
from tqdm import tqdm

def predict_famnet(images, annotations, kernel_size_factor):
    result = []
    gpu_id = -1
    model_path = './data/pretrainedModels/FamNet_Save1.pth'
    adapt = False
    learning_rate = 1e-7
    gradient_steps = 100
    weight_mincount = 1e-9
    weight_perturbation = 1e-4

    if not torch.cuda.is_available() or gpu_id < 0:
        use_gpu = False
        print("===> Using CPU mode.")
    else:
        use_gpu = True
        os.environ["CUDA_DEVICE_ORDER"] = "PCI_BUS_ID"
        os.environ["CUDA_VISIBLE_DEVICES"] = str(gpu_id)

    resnet50_conv = Resnet50FPN()
    regressor = CountRegressor(6, pool='mean')

    if use_gpu:
        resnet50_conv.cuda()
        regressor.cuda()
        regressor.load_state_dict(torch.load(model_path))
    else:
        regressor.load_state_dict(torch.load(model_path, map_location=torch.device('cpu')))

    resnet50_conv.eval()
    regressor.eval()


    for i, img in enumerate(images):
        annotation = annotations[i]
        image_name = annotation['image_name']

        image_width = img.shape[1]
        image_height = img.shape[0]

        rects1 = list()
        for marker in annotation['markers']:
            xmin = max(int(marker['left']) * (image_width/int(annotation['width'])), 1)
            xmax = min((int(marker['left']) + int(marker['width'])) * (image_width/int(annotation['width'])), image_width - 1)
            ymin = max(int(marker['top']) * (image_height/int(annotation['height'])), 1)
            ymax = min((int(marker['top']) + int(marker['height'])) * (image_height/int(annotation['height'])), image_height - 1)
            rects1.append([ymin, xmin, ymax, xmax])

        print("Bounding boxes: ", end="")
        print(rects1)

        image = Image.fromarray(img)
        image.load()
        sample = {'image': image, 'lines_boxes': rects1}
        sample = Transform(sample)
        image, boxes = sample['image'], sample['boxes']


        if use_gpu:
            image = image.cuda()
            boxes = boxes.cuda()

        with torch.no_grad():
            features = extract_features(resnet50_conv, image.unsqueeze(0), boxes.unsqueeze(0), MAPS, Scales)

        if not adapt:
            with torch.no_grad(): output = regressor(features)
        else:
            features.required_grad = True
            #adapted_regressor = copy.deepcopy(regressor)
            adapted_regressor = regressor
            adapted_regressor.train()
            optimizer = optim.Adam(adapted_regressor.parameters(), lr=learning_rate)

            pbar = tqdm(range(gradient_steps))
            for step in pbar:
                optimizer.zero_grad()
                output = adapted_regressor(features)
                lCount = weight_mincount * MincountLoss(output, boxes, use_gpu=use_gpu)
                lPerturbation = weight_perturbation * PerturbationLoss(output, boxes, sigma=8, use_gpu=use_gpu)
                Loss = lCount + lPerturbation
                # loss can become zero in some cases, where loss is a 0 valued scalar and not a tensor
                # So Perform gradient descent only for non zero cases
                if torch.is_tensor(Loss):
                    Loss.backward()
                    optimizer.step()

                pbar.set_description('Adaptation step: {:<3}, loss: {}, predicted-count: {:6.1f}'.format(step, Loss.item(), output.sum().item()))

            features.required_grad = False
            output = adapted_regressor(features)


        print('===> The predicted count is: {:6.2f}'.format(output.sum().item()))

        rslt_file = "{}/{}".format('./predictions', image_name)
        visualize_output_and_save(image.detach().cpu(), output.detach().cpu(), boxes.cpu(), rslt_file, kernel_size_factor)
        print("===> Visualized output is saved to {}".format(rslt_file))
        result.append({'image': image_name, 'count': int(output.sum().item())})
    return result

    