import boto
import os

from boto.s3.key import Key

os.system('grunt')


def upload(file_name, bucket):
    k = Key(bucket)
    k.key = file_name
    k.set_contents_from_filename(file_name)
    print ('{0} uploaded'.format(file_name))

conn = boto.connect_s3()

#the AWS keys are in the env - check Trello for them
bucket = conn.get_bucket('photostrip')

files = ['index.html', 'photostrip.js', 'photostrip.min.js', 'settings.json', 'newyears.json', 'christmas.json', 'halloween.json']
map(lambda files: upload(files, bucket), files)

