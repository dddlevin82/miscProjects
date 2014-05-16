import Image
import numpy as np
f = open('../../../asIntFaces.txt', 'r')
imgarr = []
for l in f.readlines():
	if not 'END' in l:
		imgarr.append(np.array([float(x) for x in l.split()]))
	else:
		break
imgarr = np.array(imgarr)
nonint = np.copy(imgarr)
for i in range(1, len(imgarr)):
	for j in range(1,len(imgarr[0])):
		nonint[i][j] = 255 * (imgarr[i][j] - imgarr[i-1][j] - imgarr[i][j-1] + imgarr[i-1][j-1])

img = Image.fromarray(np.array(nonint))
img.show()
#img.save('face.bmp')

