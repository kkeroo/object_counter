from urllib.error import HTTPError

from tornado.httpserver import HTTPServer
from tornado.ioloop import IOLoop
from tornado.options import define, options
from tornado.web import Application
import tornado.web
import tornado.gen
from tornado.escape import json_decode
from tornado.log import enable_pretty_logging

import requests
import cv2
import numpy as np
from PIL import Image
from workers import train_model, print_task, predict, predict_faster_rcnn, predict_famnet
import os
import shutil

from redis import Redis
from rq import Queue, cancel_job
from rq.job import Job
from rq.command import send_stop_job_command


# na MAC OS dodaj export OBJC_DISABLE_INITIALIZE_FORK_SAFETY=YES

images = []
pred_images = []
annotations = []

q = Queue(connection=Redis())

def getImage(image_name):
    url = f'http://localhost:4000/images/{image_name}'
    response = requests.get(url, stream=True).raw
    image = np.asarray(bytearray(response.read()), dtype="uint8")
    image = cv2.imdecode(image, cv2.IMREAD_COLOR)
    image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
    return image

def getPredImage(image_name):
    url = f'http://localhost:4000/images/prediction/{image_name}'
    response = requests.get(url, stream=True).raw
    image = np.asarray(bytearray(response.read()), dtype="uint8")
    image = cv2.imdecode(image, cv2.IMREAD_COLOR)
    return image

def getModel(model_name):
    url = f'http://localhost:4000/models/{model_name}'
    response = requests.get(url, stream=True)
    open('dmodel.pt', 'wb').write(response.content)
    return

def createDirectory(dirname):
    if not os.path.exists(dirname):
        os.makedirs(dirname)

class imagesHandler(tornado.web.RequestHandler):

    @tornado.gen.coroutine
    def get(self, param):
        img = Image.open('./predictions/'+param)
        self.set_header('Content-Type', 'image/png')
        img = open('./predictions/'+param, 'rb')
        content = img.read()
        img.close()
        self.write(content)
    
    def options(self, *args):
        # no body
        # `*args` is for route with `path arguments` supports
        self.set_status(204)
        self.finish()

class jobsHandler(tornado.web.RequestHandler):
    @tornado.gen.coroutine
    def get(self, job_id):
        try:
            job = Job.fetch(job_id, connection=Redis())
            if job.get_status() != "finished":
                self.write({"job_status": job.get_status()})
            else:
                shutil.make_archive('predictions', 'zip', './predictions')
                self.write({"job_status": job.get_status(), "result": job.result})
        except:
            self.write({"job_status": "no job found"})

    @tornado.gen.coroutine
    def delete(self, job_id):
        try:
            send_stop_job_command(Redis(), job_id)
            job = Job.fetch(job_id, connection=Redis())
            job.delete()
            self.write({"status": "success"})
        except:
            self.write({"status": "error"})
    
    def options(self, *args):
        # no body
        # `*args` is for route with `path arguments` supports
        self.set_status(204)
        self.finish()

class modelHandler(tornado.web.RequestHandler):
    @tornado.gen.coroutine
    def get(self):
        filename = './model.pt'
        self.set_header('Content-Type', 'application/force-download')
        self.set_header('Content-Disposition', 'attachment; filename=%s' % filename)
        with open(filename, 'rb') as f:
            try:
                while True:
                    _buffer = f.read(4096)
                    if _buffer:
                        self.write(_buffer)
                    else:
                        f.close()
                        self.finish()
                        return
            except:
                raise HTTPError(404)
        raise HTTPError(500)

    @tornado.gen.coroutine
    def post(self):
        data = json_decode(self.request.body)
        global annotations
        global images
        annotations = []
        images = []
        annotations = data['data']
        modelName = data['modelName']
        epochs = int(data['epochs'])
        batchSize = int(data['batchSize'])
        label = data['label']

        for ann in annotations:
            image_name = ann['image_name']
            images.append(getImage(image_name))

        print(f'Ann. lenght: {len(annotations)}, Imgs. lenght: {len(images)}, model name: {modelName} \n \
            Epochs: {epochs}, Batch size: {batchSize}, Label: {label}')

        job = q.enqueue(train_model, job_timeout='24h', args=(images, annotations, epochs, batchSize, label))
        self.write({'message': 'success', 'job_id': job.id})
    
    def options(self, *args):
        # no body
        # `*args` is for route with `path arguments` supports
        self.set_status(204)
        self.finish()

class predictHandler(tornado.web.RequestHandler):
    @tornado.gen.coroutine
    def get(self):
        filename = './predictions.zip'
        self.set_header('Content-Type', 'application/force-download')
        self.set_header('Content-Disposition', 'attachment; filename=%s' % filename)
        with open(filename, 'rb') as f:
            try:
                while True:
                    _buffer = f.read(4096)
                    if _buffer:
                        self.write(_buffer)
                    else:
                        f.close()
                        self.finish()
                        return
            except:
                raise HTTPError(404)
        raise HTTPError(500)

    @tornado.gen.coroutine
    def post(self):
        data = json_decode(self.request.body)
        method = data['method']

        folder = './predictions'
        for filename in os.listdir(folder):
            filepath = os.path.join(folder, filename)
            try:
                if os.path.isfile(filepath) or os.path.islink(filepath):
                    os.unlink(filepath)
            except Exception as e:
                print('Failed to delete %s. Reason: %s' % (filepath, e))

        if method == 'famnet':
            self.famnet_predict()
        else:
            detection_threshold = float(data['threshold'])
            label = data['label']
            images = data['images']

            global pred_images
            pred_images = []

            for img in images:
                pred_images.append({'image': getPredImage(img), 'name': img})

            if method == 'custom':
                model = data['model']
                getModel(model)
                job = q.enqueue(predict, job_timeout='24h', args=('dmodel.pt', pred_images, detection_threshold, label))
                self.write({'message': 'success', 'job_id': job.id})
            elif method == 'faster_rcnn':
                job = q.enqueue(predict_faster_rcnn, job_timeout='24h', args=(pred_images, detection_threshold, label))
                self.write({'message': 'success', 'job_id': job.id})


    def famnet_predict(self):
        data = json_decode(self.request.body)
        annotations = []
        images = []
        annotations = data['data']
        kernelSizeFactor = float(data['kernelSizeFactor'])

        for ann in annotations:
            image_name = ann['image_name']
            images.append(getImage(image_name))

        print(f'Method: FamNet, Ann. lenght: {len(annotations)}, Imgs. lenght: {len(images)}, Kernel size factor: {kernelSizeFactor}')
        job = q.enqueue(predict_famnet, job_timeout='24h', args=(images, annotations, kernelSizeFactor,))
        self.write({'message': 'success', 'job_id': job.id})

    def options(self, *args):
        # no body
        # `*args` is for route with `path arguments` supports
        self.set_status(204)
        self.finish()

define('port', default=8888, help='port to listen on')

def main():
    """Create needed directories"""
    createDirectory('./predictions')
    """Enable Tornado logging"""
    enable_pretty_logging()
    """Construct and serve the tornado application."""
    app = Application([
        (r"/", modelHandler),
        (r"/images/([^\\]+$)", imagesHandler),
        (r"/jobs/([^\\]+$)", jobsHandler),
        (r"/predict/", predictHandler)
    ])
    http_server = HTTPServer(app)
    http_server.listen(options.port)
    print('Listening on http://localhost:%i' % options.port)
    IOLoop.current().start()

if __name__ == '__main__':
    main()