import boto
import os

from boto.s3.key import Key

os.system('grunt')


def upload(file_name):
    k = Key(bucket)
    k.key = file_name
    k.set_contents_from_filename(file_name)

conn = boto.connect_s3()

#the AWS keys are in the env - check Trello for them
bucket = conn.get_bucket('photostrip')

files = ['index.html', 'photostrip.js', 'photostrip.min.js', 'settings.json', 'newyears.json', 'christmas.json']
map(upload, files)

