from setuptools import setup, find_packages

requires = [
    'tornado',
    'tornado-sqlalchemy',
    'psycopg2',
]

setup(
    name='api',
    version='1.0',
    description='Api',
    author='Jaša Kerec',
    author_email='<Your email>',
    keywords='web tornado',
    packages=find_packages(),
    install_requires=requires,
    entry_points={
        'console_scripts': [
            'serve_app = todo:main',
        ],
    },
)