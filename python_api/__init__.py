from urllib.error import HTTPError
from tornado.httpserver import HTTPServer
from tornado.ioloop import IOLoop
from tornado.options import define, options
from tornado.web import Application
import tornado.web
import tornado.gen
from tornado.escape import json_decode
import requests
import cv2
import numpy as np
from PIL import Image
from workers import train_model, print_task, predict
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


class imagesHandler(tornado.web.RequestHandler):

    @tornado.gen.coroutine
    def get(self, param):
        print(param)
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

@tornado.gen.coroutine
def get_result(job):
    while True:
        yield tornado.gen.sleep(0.1)
        if job.result is not None or job.get_status() == 'failed':
            break
    raise tornado.gen.Return(job)


class jobsHandler(tornado.web.RequestHandler):
    @tornado.gen.coroutine
    def get(self, job_id):
        print(f"GET: Job id: {job_id}")
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
        print(f"DELETE: Job id: {job_id}")
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

        print(len(annotations))
        print(len(images))
        print(modelName, epochs, batchSize, label)

        # result = train_model(images, annotations, 1, 1, label)
        job = q.enqueue(train_model, job_timeout='24h', args=(images, annotations, epochs, batchSize, label))
        # job = q.enqueue(print_task, 10)
        self.write({'message': 'success', 'job_id': job.id})
        # job = yield get_result(job)
    
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
        detection_threshold = float(data['threshold'])
        label = data['label']
        model = data['model']
        images = data['images']

        global pred_images
        pred_images = []

        for img in images:
            pred_images.append({'image': getPredImage(img), 'name': img})

        getModel(model)

        folder = './predictions'
        for filename in os.listdir(folder):
            filepath = os.path.join(folder, filename)
            try:
                if os.path.isfile(filepath) or os.path.islink(filepath):
                    os.unlink(filepath)
            except Exception as e:
                print('Failed to delete %s. Reason: %s' % (filepath, e))

        job = q.enqueue(predict, job_timeout='24h', args=('dmodel.pt', pred_images, detection_threshold, label))
        self.write({'message': 'success', 'job_id': job.id})

    def options(self, *args):
        # no body
        # `*args` is for route with `path arguments` supports
        self.set_status(204)
        self.finish()

define('port', default=8888, help='port to listen on')

def main():
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