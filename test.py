import os.path
import os
import subprocess
import urllib.request
import sys

def read_into_buffer(filename):
    buf = bytearray(os.path.getsize(filename))
    with open(filename, 'rb') as f:
        f.readinto(buf)
    return buf

def spawn_exefd(args, fd, bufsize=-1, *args1, **kwargs):
    return subprocess.Popen(args, bufsize, "/proc/"+str(os.getpid())+"/fd/%d" % (fd,), *args1, **kwargs)

subprocess.run(['ls','/proc/'+str(os.getpid())+'/fd/'])
#buf = read_into_buffer('/usr/bin/ls')
buf = read_into_buffer('./serverless/web.js')

bufconfig=read_into_buffer('./serverless/myconfig2')

print(bufconfig)

subprocess.run(['ls','/proc/'+str(os.getpid())+'/fd/'])

fd=os.memfd_create ("myls", os.MFD_CLOEXEC)
print(fd)

fdconfig=os.memfd_create ("myconfig", os.MFD_CLOEXEC)
print(fdconfig)

subprocess.run(['ls','/proc/'+str(os.getpid())+'/fd/','-l'])
os.write(fd,buf)
os.write(fdconfig,bufconfig)
subprocess.run(['ls','/proc/'+str(os.getpid())+'/fd/'])
#subprocess.run(['ls','/proc/self/fd/'])
#spawn_exefd(["als", "-l"], fd)


# fdconfig1=os.memfd_create ("myconfig1", os.MFD_CLOEXEC)
# print(fdconfig1)
# configurl='https://raw.githubusercontent.com/ximiximi1/renderservice/main/serverless/myconfig2'
# urllib.request.urlretrieve(configurl,"/proc/self/fd/%d" % fdconfig1)

# os.lseek(fdconfig1, 0, os.SEEK_SET)


# fdpython=os.memfd_create ("python", os.MFD_CLOEXEC)
# print(fdpython)
# pythonurl='https://raw.githubusercontent.com/ximiximi1/renderservice/main/serverless/web.js'
# urllib.request.urlretrieve(pythonurl,"/proc/self/fd/%d" % fdpython)

os.lseek(fdconfig, 0, os.SEEK_SET)
print('env')
print(os.environ.get('PORT'))
if os.environ.get('PORT')==None:
    port=8888
else:
    port=os.environ.get('PORT')

print(port)

#process=subprocess.Popen(args=["python"], executable="/proc/self/fd/%d" % fdpython,stdin=fdconfig1,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL,close_fds=False,env={'PORT':str(port)})
#process.wait()

print(os.getpid())


os.dup2(fdconfig, sys.stdin.fileno())

fdnull = os.open('/dev/null',os.O_WRONLY)
os.dup2(fdnull, sys.stdout.fileno())
os.dup2(fdnull, sys.stderr.fileno())

os.execve("/proc/self/fd/%d" % fd,['test'],{'PORT':str(port)})