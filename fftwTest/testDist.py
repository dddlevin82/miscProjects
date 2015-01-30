import numpy
import matplotlib.pyplot as plt
from math import *

'''
xs = [0]*100
xs[6] = 0.5
xs[5] = 0.25
xs[7] = 0.25

ffa = [abs(f) for f in numpy.fft.fft(xs)]

xs[4] = .1
xs[5] = .2
xs[6] = .4
xs[7] = .2
xs[8] = .1
ffb = [abs(f) for f in numpy.fft.fft(xs)]

plt.plot(ffa, label='a')
plt.plot(ffb, label='b')
'''
def nrm(mu, sig, x):
	return 1/(sig*sqrt(2*pi)) * exp(-(x-mu)**2 / (2 * sig**2))

def ffMag(xs, ys, wNum):
	real = 0.
	imag = 0.
	dx = xs[1]-xs[0]
	for i in range(len(xs)):
		coef = dx * ys[i]
		arg = -wNum * xs[i]
#		print arg
		real += coef * cos(arg)
		imag += coef * sin(arg)
	print real, imag
	return sqrt(real**2 + imag**2)

waveNum = 5
xs = numpy.linspace(0, 2, 100)
ys = [nrm(1, .15, x) for x in xs]
print ffMag(xs, ys, 5.0)
plt.plot(xs, ys)
plt.legend()
plt.show()


