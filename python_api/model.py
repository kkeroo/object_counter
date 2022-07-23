from config import DEVICE, NUM_CLASSES, NUM_EPOCHS, images, anns
from tqdm.auto import tqdm
from helpers import create_model
from dataset import create_train_loader, create_valid_loader, create_train_dataset, create_valid_dataset
import torch
import time
import copy
import math

import torchvision
import torch.nn as nn
import torch.nn.functional as F
from collections import OrderedDict


class Resnet50FPN(nn.Module):
    def __init__(self):
        super(Resnet50FPN, self).__init__()
        self.resnet = torchvision.models.resnet50(pretrained=True)
        children = list(self.resnet.children())
        self.conv1 = nn.Sequential(*children[:4])
        self.conv2 = children[4]
        self.conv3 = children[5]
        self.conv4 = children[6]
    def forward(self, im_data):
        feat = OrderedDict()
        feat_map = self.conv1(im_data)
        feat_map = self.conv2(feat_map)
        feat_map3 = self.conv3(feat_map)
        feat_map4 = self.conv4(feat_map3)
        feat['map3'] = feat_map3
        feat['map4'] = feat_map4
        return feat


class CountRegressor(nn.Module):
    def __init__(self, input_channels,pool='mean'):
        super(CountRegressor, self).__init__()
        self.pool = pool
        self.regressor = nn.Sequential(
            nn.Conv2d(input_channels, 196, 7, padding=3),
            nn.ReLU(),
            nn.UpsamplingBilinear2d(scale_factor=2),
            nn.Conv2d(196, 128, 5, padding=2),
            nn.ReLU(),
            nn.UpsamplingBilinear2d(scale_factor=2),
            nn.Conv2d(128, 64, 3, padding=1),
            nn.ReLU(),
            nn.UpsamplingBilinear2d(scale_factor=2),
            nn.Conv2d(64, 32, 1),
            nn.ReLU(),
            nn.Conv2d(32, 1, 1),
            nn.ReLU(),
        )

    def forward(self, im):
        num_sample =  im.shape[0]
        if num_sample == 1:
            output = self.regressor(im.squeeze(0))
            if self.pool == 'mean':
                output = torch.mean(output, dim=(0),keepdim=True)  
                return output
            elif self.pool == 'max':
                output, _ = torch.max(output, 0,keepdim=True)
                return output
        else:
            for i in range(0,num_sample):
                output = self.regressor(im[i])
                if self.pool == 'mean':
                    output = torch.mean(output, dim=(0),keepdim=True)
                elif self.pool == 'max':
                    output, _ = torch.max(output, 0,keepdim=True)
                if i == 0:
                    Output = output
                else:
                    Output = torch.cat((Output,output),dim=0)
            return Output


def weights_normal_init(model, dev=0.01):
    if isinstance(model, list):
        for m in model:
            weights_normal_init(m, dev)
    else:
        for m in model.modules():
            if isinstance(m, nn.Conv2d):                
                m.weight.data.normal_(0.0, dev)
                if m.bias is not None:
                    m.bias.data.fill_(0.0)
            elif isinstance(m, nn.Linear):
                m.weight.data.normal_(0.0, dev)


def weights_xavier_init(m):
    if isinstance(m, nn.Conv2d):
        torch.nn.init.xavier_normal_(m.weight, gain=nn.init.calculate_gain('relu'))
        if m.bias is not None:
            torch.nn.init.zeros_(m.bias)

def train_one_epoch(train_data_loader, model, optimizer):
     # initialize tqdm progress bar
    prog_bar = tqdm(train_data_loader, total=len(train_data_loader))
    
    epoch_loss = 0

    for i, data in enumerate(prog_bar):
        optimizer.zero_grad()
        images, targets = data
        
        images = list(image.to(DEVICE) for image in images)
        targets = [{k: v.to(DEVICE) for k, v in t.items()} for t in targets]
        loss_dict = model(images, targets)

        losses = sum(loss for loss in loss_dict.values())
        loss_value = losses.item()
        epoch_loss += loss_value
        # train_loss_list.append(loss_value)
        # train_loss_hist.send(loss_value)
        losses.backward()
        optimizer.step()
    
        # update the loss value beside the progress bar for each iteration
        prog_bar.set_description(desc=f"Loss: {loss_value:.4f}")
    
    epoch_loss /= len(train_data_loader)
    return epoch_loss

# function for running validation iterations
def validate_one_epoch(valid_data_loader, model):
    
    # initialize tqdm progress bar
    prog_bar = tqdm(valid_data_loader, total=len(valid_data_loader))

    epoch_loss = 0
    
    for i, data in enumerate(prog_bar):
        images, targets = data
        
        images = list(image.to(DEVICE) for image in images)
        targets = [{k: v.to(DEVICE) for k, v in t.items()} for t in targets]
        
        with torch.no_grad():
            loss_dict = model(images, targets)
        losses = sum(loss for loss in loss_dict.values())
        loss_value = losses.item()
        epoch_loss += loss_value

        # update the loss value beside the progress bar for each iteration
        prog_bar.set_description(desc=f"Loss: {loss_value:.4f}")

    epoch_loss /= len(valid_data_loader)
    
    return epoch_loss

def train(imgs, annotations, batch_size, num_of_epochs, label):
    model = create_model(2)
    model = model.to(DEVICE)

    params = [p for p in model.parameters() if p.requires_grad]
    optimizer = torch.optim.SGD(params, lr=0.001, momentum=0.9, weight_decay=0.0005)

    train_perc = 0.7
    num_train_samples = math.floor(len(imgs) * train_perc)
    num_valid_samples = len(imgs) - num_train_samples

    print(f'Total samples: {len(imgs)}, Train samples: {num_train_samples}, valid samples: {num_valid_samples}')

    train_dataset = create_train_dataset(imgs[:num_train_samples], 1024, 1024, ['__background__', label], annotations[:num_train_samples])
    valid_dataset = create_valid_dataset(imgs[-num_valid_samples:], 1024, 1024, ['__background__', label], annotations[-num_valid_samples:])
    train_loader = create_train_loader(train_dataset, batch_size, 0)
    valid_loader = create_valid_loader(valid_dataset, batch_size, 0)
    # train_loader = create_train_loader(create_train_dataset(), 4)
    # valid_loader = create_valid_loader(create_valid_dataset(), 4)
    
    train_epoch_losses = []
    val_epoch_losses = []

    best_loss = 1000
    best_model_data = None

    for epoch in range(num_of_epochs):
        print(f"\nEPOCH {epoch+1} of {num_of_epochs}")
        
        start = time.time()

        train_loss = train_one_epoch(train_loader, model, optimizer)
        train_epoch_losses.append(train_loss)

        val_loss = validate_one_epoch(valid_loader, model)
        val_epoch_losses.append(val_loss)

        end = time.time()

        print(f"Took {((end - start) / 60):.3f} minutes for epoch {epoch+1}")

        # print(f'Model: {model.state_dict()}')
        if val_loss < best_loss:
            model_data = copy.deepcopy(model.state_dict())
            best_model_data = model_data
            best_loss = val_loss


    print(f'Min. train loss: {min(train_epoch_losses)} \nMin. valid. loss: {min(val_epoch_losses)}')
    torch.save(model, f'./model.pt')
    return {'train_loss': min(train_epoch_losses), 'valid_loss': min(val_epoch_losses)}


if __name__ == '__main__':
    train(images, anns, 1, 3, 'people')
    # model = create_model(NUM_CLASSES)
    # model = model.to(DEVICE)

    # params = [p for p in model.parameters() if p.requires_grad]
    # optimizer = torch.optim.SGD(params, lr=0.001, momentum=0.9, weight_decay=0.0005)

    # train_loader = create_train_loader(create_train_dataset(), 4)
    # valid_loader = create_valid_loader(create_valid_dataset(), 4)
    
    # train_epoch_losses = []
    # val_epoch_losses = []

    # best_loss = 1000
    # best_model_data = None

    # for epoch in range(NUM_EPOCHS):
    #     print(f"\nEPOCH {epoch+1} of {NUM_EPOCHS}")
        
    #     start = time.time()

    #     train_loss = train_one_epoch(train_loader, model, optimizer)
    #     train_epoch_losses.append(train_loss)

    #     val_loss = validate_one_epoch(valid_loader, model)
    #     val_epoch_losses.append(val_loss)

    #     end = time.time()

    #     print(f"Took {((end - start) / 60):.3f} minutes for epoch {epoch+1}")

    #     # print(f'Model: {model.state_dict()}')
    #     if val_loss < best_loss:
    #         model_data = copy.deepcopy(model.state_dict())
    #         best_model_data = model_data
    #         best_loss = val_loss


    # print(f'Min. train loss: {min(train_epoch_losses)} \nMin. valid. loss: {min(val_epoch_losses)}')
    # torch.save(model, f'./best_model.pt')