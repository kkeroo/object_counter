# Object counter (Diploma thesis)

### Requirements
- NodeJS
- Python3
- Docker

### Installation
#### NodeJS Server
- run npm install inside project directory

#### Python API
- move to python_api directory
- it is recommended to use virtual environment (e.g. run ```python3 -m venv <name_of_env>```)
- if using virtual env. run ```source <name_of_env>/bin/activate``` to activate virtual environment
- run ```pip install -r requirements.txt```

#### React
- move to client directory
- run ```npm install```
- run ```npm run build```

### Running application
#### With NodeJS serving frontend
1. in first terminal window run ```docker-compose up```
2. in second window run ```rq worker``` inside your python virtual environment in python_api folder
3. in third terminal window run ```python __init__.py``` inside your python virtual environment in python_api folder
4. in fourth terminal window run ```npm run dev``` inside project's root directory
5. Python API is running on port 8888, NodeJS application is running on port 4000
6. in web browser type http://localhost:4000/ and you should see the application

#### With React server
1. in first terminal window run ```docker-compose up```
2. in second window run ```rq worker``` inside your python virtual environment in python_api folder
3. in third terminal window run ```python __init__.py``` inside your python virtual environment in python_api folder
4. in fourth terminal window run ```npm run dev``` inside project's root directory
5. in fifth terminal window run ```npm start``` inside client directory
5. Python API is running on port 8888, NodeJS application is running on port 4000
6. in web browser type http://localhost:3000/ and you should see the application

### Notes
On macOS running rq worker caused some problems with fork operation. This is solved by typing ```export OBJC_DISABLE_INITIALIZE_FORK_SAFETY=YES``` in terminal window where running rq worker
